import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Jobs, { JobType, JobStatus } from "../database/models/Jobs";
import Tenants from "../database/models/Tenants";
import minioService from "./minio.service";
import jobService from "./job.service";
import { getTransactionImportQueue, type TransactionImportJobData } from "../config/queue";

const ALLOWED_MIME_TYPES = new Set([
     "text/csv",
     "application/vnd.ms-excel",
     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

interface UploadFileInput {
     buffer: Buffer;
     originalname: string;
     mimetype: string;
}

class UploadService {
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

          if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
               return {
                    status: ApiResponseStatus.BAD_REQUEST,
                    message: `Unsupported file type: ${file.mimetype}. Use CSV or XLSX.`,
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

     async listJobs(): Promise<ServiceResponse> {
          return jobService.getRecentJobs();
     }
}

export default new UploadService();
