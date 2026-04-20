import { Readable } from "stream";
import crypto from "crypto";
import { getMinioClient, getBucket } from "../config/minio";
import logger from "../config/logger";

class MinioService {
     async uploadFile(
          fileBuffer: Buffer,
          originalName: string,
          mimeType: string,
          tenantId: string,
     ): Promise<{ bucket: string; key: string; size: number }> {
          const client = getMinioClient();
          const bucket = getBucket();

          const ext = originalName.substring(originalName.lastIndexOf("."));
          const key = `${tenantId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;

          const stream = Readable.from(fileBuffer);
          await client.putObject(bucket, key, stream, fileBuffer.length, {
               "Content-Type": mimeType,
               "x-amz-meta-tenant-id": tenantId,
               "x-amz-meta-original-name": originalName,
          });

          logger.info("File uploaded to MinIO", {
               bucket,
               key,
               size: fileBuffer.length,
               tenantId,
          });

          return { bucket, key, size: fileBuffer.length };
     }

     async getFileStream(
          bucket: string,
          key: string,
     ): Promise<Readable> {
          const client = getMinioClient();
          return client.getObject(bucket, key);
     }

     async deleteFile(bucket: string, key: string): Promise<void> {
          const client = getMinioClient();
          await client.removeObject(bucket, key);
          logger.info("File deleted from MinIO", { bucket, key });
     }
}

export default new MinioService();
