import type { Readable } from "stream";
import { parse as csvParse } from "csv-parse";
import ExcelJS from "exceljs";
import logger from "../config/logger";
import Jobs, { JobStatus, type JobErrorEntry } from "../database/models/Jobs";
import IndividualTransactions from "../database/models/IndividualTransactions";
import BusinessTransactions from "../database/models/BusinessTransactions";
import Tenants from "../database/models/Tenants";
import { runWithTenantContext } from "../utils/asyncStorage";
import minioService from "./minio.service";

const BATCH_SIZE = 200;

interface RawRow {
     [key: string]: string | undefined;
}

class BulkUploadService {
     private mapDebitCreditToTransactionType(
          value: string | undefined,
     ): "INFLOW" | "OUTFLOW" | null {
          if (!value) return null;
          const normalized = value.trim().toLowerCase();
          if (normalized === "credit") return "INFLOW";
          if (normalized === "debit") return "OUTFLOW";
          return null;
     }

     private parseTransactionDate(value: string): Date {
          const dateStr = value.trim();

          const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const ddmmyyyyMatch = ddmmyyyy.exec(dateStr);
          if (ddmmyyyyMatch) {
               const day = Number(ddmmyyyyMatch[1]);
               const month = Number(ddmmyyyyMatch[2]);
               const year = Number(ddmmyyyyMatch[3]);
               const parsed = new Date(Date.UTC(year, month - 1, day));
               if (
                    parsed.getUTCFullYear() === year &&
                    parsed.getUTCMonth() === month - 1 &&
                    parsed.getUTCDate() === day
               ) {
                    return parsed;
               }
               throw new Error(`Invalid date value: ${value}`);
          }

          const parsed = new Date(dateStr);
          if (Number.isNaN(parsed.getTime())) {
               throw new Error(`Invalid date value: ${value}`);
          }
          return parsed;
     }

     async processJob(
          jobId: string,
          tenantId: string,
          tenantType: "INDIVIDUAL" | "BUSINESS",
          fileBucket: string,
          fileKey: string,
          mimeType: string,
          userId: string,
     ): Promise<void> {
          const job = await runWithTenantContext(tenantId, () => Jobs.findByPk(jobId));
          if (!job) {
               logger.error("Job not found", { jobId });
               throw new Error(`Job ${jobId} not found`);
          }

          const alreadyProcessed = job.processed_rows || 0;

          await runWithTenantContext(tenantId, async () => {
               await Jobs.update(
                    { status: JobStatus.PROCESSING, started_at: new Date() },
                    { where: { job_id: jobId } },
               );
          });

          const fileStream = await minioService.getFileStream(fileBucket, fileKey);

          try {
               const isExcel =
                    mimeType ===
                         "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
                    mimeType === "application/vnd.ms-excel" ||
                    fileKey.endsWith(".xlsx") ||
                    fileKey.endsWith(".xls");

               if (isExcel) {
                    await this.processExcelStream(
                         fileStream,
                         jobId,
                         tenantId,
                         tenantType,
                         alreadyProcessed,
                         userId,
                    );
               } else {
                    await this.processCsvStream(
                         fileStream,
                         jobId,
                         tenantId,
                         tenantType,
                         alreadyProcessed,
                         userId,
                    );
               }

               const finalJob = await runWithTenantContext(tenantId, () => Jobs.findByPk(jobId));
               await runWithTenantContext(tenantId, async () => {
                    await Jobs.update(
                         {
                              status: JobStatus.COMPLETED,
                              completed_at: new Date(),
                              total_rows:
                                   (finalJob?.processed_rows || 0) + (finalJob?.failed_rows || 0),
                         },
                         { where: { job_id: jobId } },
                    );
               });

               logger.info("Job completed", {
                    jobId,
                    processedRows: finalJob?.processed_rows,
                    failedRows: finalJob?.failed_rows,
               });
          } catch (error) {
               const message = error instanceof Error ? error.message : "Unknown error";
               logger.error("Job failed", { jobId, error });

               await runWithTenantContext(tenantId, async () => {
                    await Jobs.update(
                         {
                              status: JobStatus.FAILED,
                              completed_at: new Date(),
                              error_summary: [{ message }] as JobErrorEntry[],
                         },
                         { where: { job_id: jobId } },
                    );
               });
               throw error;
          }
     }

     private async processCsvStream(
          stream: Readable,
          jobId: string,
          tenantId: string,
          tenantType: "INDIVIDUAL" | "BUSINESS",
          skipRows: number,
          userId: string,
     ): Promise<void> {
          const parser = stream.pipe(
               csvParse({
                    columns: true,
                    skip_empty_lines: true,
                    trim: true,
                    relax_column_count: true,
               }),
          );

          let batch: RawRow[] = [];
          let rowIndex = 0;

          for await (const row of parser) {
               rowIndex++;
               if (rowIndex <= skipRows) continue;

               batch.push(row as RawRow);
               if (batch.length >= BATCH_SIZE) {
                    await this.flushBatch(batch, jobId, tenantId, tenantType, userId);
                    batch = [];
               }
          }

          if (batch.length > 0) {
               await this.flushBatch(batch, jobId, tenantId, tenantType, userId);
          }
     }

     private async processExcelStream(
          stream: Readable,
          jobId: string,
          tenantId: string,
          tenantType: "INDIVIDUAL" | "BUSINESS",
          skipRows: number,
          userId: string,
     ): Promise<void> {
          const workbook = new ExcelJS.stream.xlsx.WorkbookReader(stream, {
               sharedStrings: "cache",
               hyperlinks: "cache",
               worksheets: "emit",
          });

          let headers: string[] = [];
          let batch: RawRow[] = [];
          let rowIndex = 0;

          for await (const worksheet of workbook) {
               for await (const row of worksheet) {
                    if (row.number === 1) {
                         headers = [];
                         row.eachCell((cell, colNumber) => {
                              headers[colNumber - 1] = String(cell.value || `col_${colNumber}`)
                                   .trim()
                                   .toLowerCase();
                         });
                         continue;
                    }

                    rowIndex++;
                    if (rowIndex <= skipRows) continue;

                    const parsed: RawRow = {};
                    row.eachCell((cell, colNumber) => {
                         const header = headers[colNumber - 1];
                         if (header) {
                              parsed[header] = cell.value != null ? String(cell.value) : undefined;
                         }
                    });

                    batch.push(parsed);
                    if (batch.length >= BATCH_SIZE) {
                         await this.flushBatch(batch, jobId, tenantId, tenantType, userId);
                         batch = [];
                    }
               }
               break;
          }

          if (batch.length > 0) {
               await this.flushBatch(batch, jobId, tenantId, tenantType, userId);
          }
     }

     private async flushBatch(
          rows: RawRow[],
          jobId: string,
          tenantId: string,
          tenantType: "INDIVIDUAL" | "BUSINESS",
          userId: string,
     ): Promise<void> {
          let successCount = 0;
          const errors: JobErrorEntry[] = [];

          await runWithTenantContext(tenantId, async () => {
               const tenant = await Tenants.findOne({
                    where: { tenant_id: tenantId },
                    attributes: ["tenant_id", "tax_rate"],
               });

               if (tenantType === "INDIVIDUAL") {
                    const mapped = rows
                         .map((r, i) => {
                              try {
                                   return this.mapIndividualRow(r, tenantId);
                              } catch (e) {
                                   errors.push({
                                        row: i,
                                        message: e instanceof Error ? e.message : "Mapping error",
                                   });
                                   return null;
                              }
                         })
                         .filter(Boolean);

                    if (mapped.length > 0) {
                         await IndividualTransactions.bulkCreate(
                              mapped as Record<string, unknown>[],
                              {
                                   validate: true,
                                   returning: false,
                              },
                         );
                         successCount = mapped.length;
                    }
               } else {
                    const taxRate = tenant?.tax_rate ? tenant.tax_rate / 100 : 0;
                    const mapped = rows
                         .map((r, i) => {
                              try {
                                   return this.mapBusinessRow(r, tenantId, taxRate, userId);
                              } catch (e) {
                                   errors.push({
                                        row: i,
                                        message: e instanceof Error ? e.message : "Mapping error",
                                   });
                                   return null;
                              }
                         })
                         .filter(Boolean);

                    if (mapped.length > 0) {
                         await BusinessTransactions.bulkCreate(
                              mapped as Record<string, unknown>[],
                              {
                                   validate: true,
                                   returning: false,
                              },
                         );
                         successCount = mapped.length;
                    }
               }
          });

          await runWithTenantContext(tenantId, async () => {
               const updatePayload: Record<string, unknown> = {
                    processed_rows: Jobs.sequelize!.literal(`processed_rows + ${successCount}`),
               };
               if (errors.length > 0) {
                    updatePayload.failed_rows = Jobs.sequelize!.literal(
                         `failed_rows + ${errors.length}`,
                    );
               }
               await Jobs.update(updatePayload, { where: { job_id: jobId } });
          });

          logger.info("Batch flushed", {
               jobId,
               inserted: successCount,
               errors: errors.length,
          });
     }

     private mapIndividualRow(row: RawRow, tenantId: string): Record<string, unknown> {
          const merchantName = row.merchant_name || row.merchantname || row.merchant;
          if (!merchantName) throw new Error("Missing merchant_name");

          const amount = parseFloat(row.amount || "");
          if (isNaN(amount)) throw new Error("Invalid amount");

          const dateStr = row.date || row.transaction_date;
          if (!dateStr) throw new Error("Missing date");
          const parsedDate = this.parseTransactionDate(dateStr);

          const transactionType = this.mapDebitCreditToTransactionType(
               row.transaction_type || row["transaction type"],
          );

          return {
               tenant_id: tenantId,
               merchant_name: merchantName.trim(),
               merchant_cleaned: (row.merchant_cleaned || row.merchantcleaned || merchantName)
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9 ]/g, ""),
               amount,
               date: parsedDate,
               category: row.category || null,
               transaction_type: transactionType,
               is_recurring: row.is_recurring === "true",
               prev_amount: row.prev_amount ? parseFloat(row.prev_amount) : null,
               vault_id: row.vault_id || null,
          };
     }

     private mapBusinessRow(
          row: RawRow,
          tenantId: string,
          taxRate: number,
          userId: string,
     ): Record<string, unknown> {
          const merchantName = row.merchant_name || row.merchantname || row.merchant;
          if (!merchantName) throw new Error("Missing merchant_name");

          const amount = parseFloat(row.amount || "");
          if (isNaN(amount)) throw new Error("Invalid amount");

          const dateStr = row.date || row.transaction_date;
          if (!dateStr) throw new Error("Missing date");
          const parsedDate = this.parseTransactionDate(dateStr);

          const transactionType = this.mapDebitCreditToTransactionType(
               row.transaction_type || row["transaction type"],
          );

          const isInflow = transactionType === "INFLOW";
          const taxReserved = isInflow && taxRate > 0 ? +(amount * taxRate).toFixed(2) : null;

          return {
               tenant_id: tenantId,
               user_id: userId,
               merchant_name: merchantName.trim(),
               amount,
               date: parsedDate,
               category: row.category || null,
               transaction_type: transactionType,
               account_source: row.account_source || null,
               tax_reserved: row.tax_reserved ? parseFloat(row.tax_reserved) : taxReserved,
               is_deductible: row.is_deductible === "true" || row.is_deductible === "1",
               is_leakage: false,
               tenant_invoices_id: row.tenant_invoices_id || row.invoice_id || null,
               days_to_pay: row.days_to_pay ? parseInt(row.days_to_pay) : null,
          };
     }
}

export default new BulkUploadService();
