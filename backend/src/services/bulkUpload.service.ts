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
import { Op } from "sequelize";

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

     private parseTransactionDate(value: string | number): Date {
          const strValue = String(value).trim();

          // 1. Handle Excel Serial Dates (e.g., "45962")
          if (!isNaN(Number(strValue)) && !strValue.includes("/") && !strValue.includes("-")) {
               const serial = Number(strValue);
               // Excel incorrectly assumes 1900 was a leap year, so we adjust by 25569 (days between 1900 and 1970)
               // and subtract 2 for the Excel leap year bug.
               const date = new Date(Date.UTC(1899, 11, 30 + serial));
               return date;
          }

          // 2. Handle DD/MM/YYYY strings
          const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
          const ddmmyyyyMatch = ddmmyyyy.exec(strValue);
          if (ddmmyyyyMatch) {
               const day = Number(ddmmyyyyMatch[1]);
               const month = Number(ddmmyyyyMatch[2]);
               const year = Number(ddmmyyyyMatch[3]);
               return new Date(Date.UTC(year, month - 1, day));
          }

          // 3. Fallback to standard JS parsing
          const parsed = new Date(strValue);
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
          logger.info("Batch", { batch, tenantType });
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
               const sanitizedRows = await this.sanitizeRows(rows, tenantType);

               logger.info("Sanitized rows", { sanitizedRows });

               if (tenantType === "INDIVIDUAL") {
                    const mapped = sanitizedRows
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
               price_creep_pct: row.price_creep_pct ? parseFloat(row.price_creep_pct) : null,
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

     private getPreviousCalendarMonthBoundsUTC(date: Date): { start: Date; end: Date } {
          // 1. Create a copy to avoid mutating the original date object
          const startOfCurrentMonth = new Date(
               Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0),
          );

          // 2. Subtract one month to get the start of the previous month
          const startOfPreviousMonth = new Date(startOfCurrentMonth);
          startOfPreviousMonth.setUTCMonth(startOfPreviousMonth.getUTCMonth() - 1);

          // 3. The end of the previous month is exactly 1 millisecond before the start of the current month
          const endOfPreviousMonth = new Date(startOfCurrentMonth.getTime() - 1);

          return {
               start: startOfPreviousMonth,
               end: endOfPreviousMonth,
          };
     }

     private async sanitizeRows(
          rows: RawRow[],
          tenantType: "INDIVIDUAL" | "BUSINESS",
     ): Promise<RawRow[]> {
          // Only perform recurring logic for Individuals
          if (tenantType !== "INDIVIDUAL") {
               return rows;
          }

          return Promise.all(
               rows.map(async (row, index) => {
                    // Create a copy to avoid mutating the original array mid-stream
                    const copyRow = { ...row };
                    logger.info("Copy row", { copyRow });

                    const rawDate = row.date || row.transaction_date;
                    const merchantName = (row.merchant_name || row.merchantname || "")
                         .trim()
                         .toLowerCase();
                    const category = (row.category || "").trim().toLowerCase();
                    const txType = (row.transaction_type || "").trim().toUpperCase(); // Expecting "OUTFLOW"
                    const currentAmount = parseFloat(row.amount || "0");

                    // 1. Guard Clause: Only process if we have a date, it's an OUTFLOW, and not an investment
                    if (!rawDate || txType !== "DEBIT" || category === "Investment") {
                         return copyRow;
                    }

                    let currentDateObject: Date;
                    try {
                         currentDateObject = this.parseTransactionDate(rawDate);
                    } catch {
                         return copyRow; // Skip if date is unparseable
                    }

                    // 2. Define the Previous Month Window
                    const { start: startPrev, end: endPrev } =
                         this.getPreviousCalendarMonthBoundsUTC(currentDateObject);

                    /**
                     * TIER 1: Check the current batch (In-Memory)
                     * This handles cases where a user uploads multiple months in one file.
                     */
                    const previousInArray = rows.find((r, idx) => {
                         if (idx === index || !r.date) return false;

                         let rDate: Date;
                         try {
                              rDate = this.parseTransactionDate(r.date);
                         } catch {
                              return false;
                         }

                         return (
                              (r.merchant_name || r.merchantname || "").trim().toLowerCase() ===
                                   merchantName &&
                              (r.category || "").trim().toLowerCase() === category &&
                              (r.transaction_type || "").trim().toUpperCase() === "DEBIT" &&
                              rDate >= startPrev &&
                              rDate <= endPrev
                         );
                    });

                    let previousMatch = previousInArray
                         ? { amount: parseFloat(previousInArray.amount || "0") }
                         : null;

                    /**
                     * TIER 2: Check the Database
                     * Only runs if Tier 1 found nothing.
                     */
                    if (!previousMatch) {
                         const dbMatch = await IndividualTransactions.findOne({
                              where: {
                                   merchant_name: merchantName,
                                   category: category,
                                   transaction_type: "OUTFLOW",
                                   date: { [Op.between]: [startPrev, endPrev] },
                              },
                         });

                         if (dbMatch) {
                              previousMatch = { amount: dbMatch.amount };
                         }
                    }

                    // 3. If a match was found in either Tier, enrich the row
                    if (previousMatch) {
                         copyRow.is_recurring = "true";
                         const prevAmount = previousMatch.amount;

                         // Price Creep logic: only if the price actually went up
                         if (currentAmount > prevAmount && prevAmount > 0) {
                              copyRow.prev_amount = prevAmount.toString();
                              const pct = ((currentAmount - prevAmount) / prevAmount) * 100;
                              copyRow.price_creep_pct = pct.toFixed(2);
                         }
                    }

                    return copyRow;
               }),
          );
     }
}

export default new BulkUploadService();
