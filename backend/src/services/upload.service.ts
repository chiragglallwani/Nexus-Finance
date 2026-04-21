import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Jobs, { JobType, JobStatus } from "../database/models/Jobs";
import Tenants from "../database/models/Tenants";
import minioService from "./minio.service";
import jobService from "./job.service";
import { getTransactionImportQueue, type TransactionImportJobData } from "../config/queue";
import type { Readable } from "stream";

const ALLOWED_MIME_TYPES = new Set([
     // CSV variants
     "text/csv",
     "application/csv",
     "text/x-csv",
     "text/plain",
     "application/octet-stream",
     // Excel variants
     "application/vnd.ms-excel",
     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
     "application/vnd.ms-excel.sheet.macroenabled.12",
     "application/vnd.ms-excel.sheet.binary.macroenabled.12",
]);

interface UploadFileInput {
     buffer: Buffer;
     originalname: string;
     mimetype: string;
}

interface TemplateDownloadData {
     stream: Readable;
     fileName: string;
}

class UploadService {
     private isSupportedFileType(file: UploadFileInput): boolean {
          if (ALLOWED_MIME_TYPES.has(file.mimetype)) return true;
          const name = file.originalname.toLowerCase();
          return name.endsWith(".csv") || name.endsWith(".xlsx") || name.endsWith(".xls");
     }

     async uploadTransactions(
          file: UploadFileInput | undefined,
          tenantId: string,
          userId: string,
     ): Promise<ServiceResponse> {
          if (!file) {
               return {
                    status: ApiResponseStatus.BAD_REQUEST,
                    message: "No file provided. Attach a CSV or XLSX file.",
               };
          }

          if (!this.isSupportedFileType(file)) {
               return {
                    status: ApiResponseStatus.BAD_REQUEST,
                    message: `Unsupported file type: ${file.mimetype}. Use CSV or XLS/XLSX.`,
               };
          }

          try {
               const tenant = await Tenants.findOne({
                    where: { tenant_id: tenantId },
                    attributes: ["tenant_id", "type"],
               });
               if (!tenant) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Tenant not found",
                    };
               }
               const tenantType = tenant.type as "INDIVIDUAL" | "BUSINESS";

               const { bucket, key, size } = await minioService.uploadFile(
                    file.buffer,
                    file.originalname,
                    file.mimetype,
                    tenantId,
               );

               const job = await Jobs.create({
                    tenant_id: tenantId,
                    user_id: userId,
                    type: JobType.TRANSACTION_IMPORT,
                    status: JobStatus.QUEUED,
                    file_bucket: bucket,
                    file_key: key,
                    file_original_name: file.originalname,
                    file_mime_type: file.mimetype,
                    file_size_bytes: size,
                    processed_rows: 0,
                    failed_rows: 0,
                    metadata: { tenantType, batchSize: 200 },
               });

               const queue = getTransactionImportQueue();
               const bullmqJob = await queue.add(
                    `import-${job.job_id}`,
                    {
                         jobId: job.job_id,
                         tenantId,
                         tenantType,
                         fileBucket: bucket,
                         fileKey: key,
                         mimeType: file.mimetype,
                         userId,
                         originalName: file.originalname,
                    } satisfies TransactionImportJobData,
                    { jobId: job.job_id },
               );

               await Jobs.update(
                    { bullmq_job_id: bullmqJob.id },
                    { where: { job_id: job.job_id } },
               );

               logger.info("Upload accepted", {
                    jobId: job.job_id,
                    tenantId,
                    tenantType,
                    fileName: file.originalname,
                    fileSize: size,
               });

               return {
                    status: ApiResponseStatus.ACCEPTED,
                    message: "File queued for processing",
                    data: {
                         jobId: job.job_id,
                         status: JobStatus.QUEUED,
                         fileName: file.originalname,
                         fileSize: size,
                    },
               };
          } catch (error) {
               logger.error("Upload failed", {
                    error: error instanceof Error ? error.message : error,
                    tenantId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Upload failed",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async getUploadStatus(jobId: string): Promise<ServiceResponse> {
          return jobService.getJobById(jobId);
     }

     async listJobs(limit = 50): Promise<ServiceResponse> {
          return jobService.getRecentJobs(limit);
     }

     async getTemplateForTenant(
          tenantType: "INDIVIDUAL" | "BUSINESS",
     ): Promise<ServiceResponse<TemplateDownloadData>> {
          try {
               const { stream, fileName } = await minioService.getTemplateFileStream(tenantType);
               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Template fetched successfully",
                    data: { stream, fileName },
               };
          } catch (error) {
               logger.error("Template download failed", {
                    error: error instanceof Error ? error.message : error,
                    tenantType,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch template",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new UploadService();
