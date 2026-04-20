import * as Minio from "minio";

let minioClient: Minio.Client | null = null;

export function getMinioClient(): Minio.Client {
     if (minioClient) return minioClient;

     minioClient = new Minio.Client({
          endPoint: process.env.MINIO_ENDPOINT || "localhost",
          port: parseInt(process.env.MINIO_PORT || "9000"),
          useSSL: process.env.MINIO_USE_SSL === "true",
          accessKey: process.env.MINIO_ACCESS_KEY || "",
          secretKey: process.env.MINIO_SECRET_KEY || "",
     });

     return minioClient;
}

export function getBucket(): string {
     return process.env.MINIO_BUCKET || "nexus-uploads";
}
