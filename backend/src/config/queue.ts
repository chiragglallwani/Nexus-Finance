import { Queue } from "bullmq";
import { getRedisConnection } from "./redis";

export const QUEUE_NAMES = {
     TRANSACTION_IMPORT: "transaction-import",
} as const;

let transactionImportQueue: Queue | null = null;

export function getTransactionImportQueue(): Queue {
     if (transactionImportQueue) return transactionImportQueue;

     transactionImportQueue = new Queue(QUEUE_NAMES.TRANSACTION_IMPORT, {
          connection: getRedisConnection(),
          defaultJobOptions: {
               attempts: 3,
               backoff: { type: "exponential", delay: 5000 },
               removeOnComplete: { count: 1000 },
               removeOnFail: { count: 5000 },
          },
     });

     return transactionImportQueue;
}

export interface TransactionImportJobData {
     jobId: string;
     userId: string;
     tenantId: string;
     tenantType: "INDIVIDUAL" | "BUSINESS";
     fileBucket: string;
     fileKey: string;
     mimeType: string;
     originalName: string;
}
