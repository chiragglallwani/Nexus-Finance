import { Worker, type Job } from "bullmq";
import { createNewRedisConnection } from "../config/redis";
import { QUEUE_NAMES, type TransactionImportJobData } from "../config/queue";
import bulkUploadService from "../services/bulkUpload.service";
import logger from "../config/logger";

let transactionWorker: Worker | null = null;

async function handleTransactionImport(job: Job<TransactionImportJobData>): Promise<void> {
     const { jobId, tenantId, tenantType, fileBucket, fileKey, mimeType } = job.data;

     logger.info("Worker picked up job", {
          bullmqJobId: job.id,
          dbJobId: jobId,
          tenantId,
          tenantType,
          fileKey,
     });

     await bulkUploadService.processJob(jobId, tenantId, tenantType, fileBucket, fileKey, mimeType);
}

export function startTransactionWorker(): Worker {
     if (transactionWorker) return transactionWorker;

     transactionWorker = new Worker<TransactionImportJobData>(
          QUEUE_NAMES.TRANSACTION_IMPORT,
          handleTransactionImport,
          {
               connection: createNewRedisConnection(),
               concurrency: 3,
               limiter: { max: 5, duration: 1000 },
          },
     );

     transactionWorker.on("completed", (job) => {
          logger.info("Worker job completed", {
               bullmqJobId: job.id,
               dbJobId: job.data.jobId,
          });
     });

     transactionWorker.on("failed", (job, err) => {
          logger.error("Worker job failed", {
               bullmqJobId: job?.id,
               dbJobId: job?.data.jobId,
               error: err.message,
               attempt: job?.attemptsMade,
          });
     });

     transactionWorker.on("error", (err) => {
          logger.error("Worker error", { error: err.message });
     });

     logger.info("Transaction import worker started", {
          queue: QUEUE_NAMES.TRANSACTION_IMPORT,
          concurrency: 3,
     });

     return transactionWorker;
}

export async function stopTransactionWorker(): Promise<void> {
     if (transactionWorker) {
          await transactionWorker.close();
          transactionWorker = null;
          logger.info("Transaction import worker stopped");
     }
}
