import { Readable } from "stream";
import crypto from "crypto";
import { getMinioClient, getBucket } from "../config/minio";
import logger from "../config/logger";

class MinioService {
     private getCurrentDateDDMMYYYY(): string {
          const now = new Date();
          const dd = String(now.getDate()).padStart(2, "0");
          const mm = String(now.getMonth() + 1).padStart(2, "0");
          const yyyy = String(now.getFullYear());
          return `${dd}${mm}${yyyy}`;
     }

     async uploadFile(
          fileBuffer: Buffer,
          originalName: string,
          mimeType: string,
          tenantId: string,
     ): Promise<{ bucket: string; key: string; size: number }> {
          const client = getMinioClient();
          const bucket = getBucket();

          const ext = originalName.substring(originalName.lastIndexOf("."));
          const dateSuffix = this.getCurrentDateDDMMYYYY();
          const random = crypto.randomUUID().slice(0, 8);
          const key = `tenant/${tenantId}/uploads_transaction_${dateSuffix}_${random}${ext}`;

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

     async getFileStream(bucket: string, key: string): Promise<Readable> {
          const client = getMinioClient();
          return client.getObject(bucket, key);
     }

     async getTemplateFileStream(
          tenantType: "INDIVIDUAL" | "BUSINESS",
     ): Promise<{ stream: Readable; fileName: string; bucket: string; key: string }> {
          const client = getMinioClient();
          const bucket = getBucket();
          const baseName =
               tenantType === "INDIVIDUAL"
                    ? "individual_uploads_template"
                    : "business_uploads_template";

          const candidateKeys = [
               `tenant/${baseName}`,
               `tenant/${baseName}.csv`,
               `tenant/${baseName}.xlsx`,
          ];

          for (const key of candidateKeys) {
               try {
                    await client.statObject(bucket, key);
                    const stream = await client.getObject(bucket, key);
                    const fileName = key.split("/").pop() || baseName;
                    return { stream, fileName, bucket, key };
               } catch {
                    // Try next candidate key.
               }
          }

          throw new Error(
               `Template file not found for tenant type ${tenantType}. Checked: ${candidateKeys.join(
                    ", ",
               )}`,
          );
     }

     async deleteFile(bucket: string, key: string): Promise<void> {
          const client = getMinioClient();
          await client.removeObject(bucket, key);
          logger.info("File deleted from MinIO", { bucket, key });
     }
}

export default new MinioService();
