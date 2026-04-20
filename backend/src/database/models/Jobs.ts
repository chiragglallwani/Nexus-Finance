import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

enum JobType {
     TRANSACTION_IMPORT = "TRANSACTION_IMPORT",
     ANALYSIS_RUN = "ANALYSIS_RUN",
     REPORT_GENERATION = "REPORT_GENERATION",
}

enum JobStatus {
     PENDING = "PENDING",
     QUEUED = "QUEUED",
     PROCESSING = "PROCESSING",
     COMPLETED = "COMPLETED",
     FAILED = "FAILED",
     RETRYING = "RETRYING",
}

interface JobErrorEntry {
     row?: number;
     field?: string;
     message: string;
     code?: string;
}

interface JobMetadata {
     tenantType?: "INDIVIDUAL" | "BUSINESS";
     batchSize?: number;
     [key: string]: unknown;
}

class Jobs extends BaseModel {
     declare job_id: string;
     declare user_id: string | null;
     declare bullmq_job_id: string | null;
     declare type: JobType;
     declare status: JobStatus;
     declare file_bucket: string | null;
     declare file_key: string | null;
     declare file_original_name: string | null;
     declare file_mime_type: string | null;
     declare file_size_bytes: number | null;
     declare total_rows: number | null;
     declare processed_rows: number;
     declare failed_rows: number;
     declare error_summary: JobErrorEntry[] | null;
     declare metadata: JobMetadata | null;
     declare started_at: Date | null;
     declare completed_at: Date | null;

     get isTerminal(): boolean {
          return this.status === JobStatus.COMPLETED || this.status === JobStatus.FAILED;
     }

     get progressPct(): number {
          if (!this.total_rows || this.total_rows === 0) return 0;
          return Math.round((this.processed_rows / this.total_rows) * 100);
     }

     static initModel(sequelize: Sequelize) {
          return Jobs.initWithTenant(
               {
                    job_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
                    },
                    user_id: {
                         type: DataTypes.UUID,
                         allowNull: true,
                         references: {
                              model: "users",
                              key: "user_id",
                         },
                    },
                    bullmq_job_id: {
                         type: DataTypes.STRING(255),
                         allowNull: true,
                    },
                    type: {
                         type: DataTypes.ENUM(...Object.values(JobType)),
                         allowNull: false,
                    },
                    status: {
                         type: DataTypes.ENUM(...Object.values(JobStatus)),
                         allowNull: false,
                         defaultValue: JobStatus.PENDING,
                    },
                    file_bucket: {
                         type: DataTypes.STRING(255),
                         allowNull: true,
                    },
                    file_key: {
                         type: DataTypes.STRING(1024),
                         allowNull: true,
                    },
                    file_original_name: {
                         type: DataTypes.STRING(512),
                         allowNull: true,
                    },
                    file_mime_type: {
                         type: DataTypes.STRING(128),
                         allowNull: true,
                    },
                    file_size_bytes: {
                         type: DataTypes.BIGINT,
                         allowNull: true,
                    },
                    total_rows: {
                         type: DataTypes.INTEGER,
                         allowNull: true,
                    },
                    processed_rows: {
                         type: DataTypes.INTEGER,
                         allowNull: true,
                         defaultValue: 0,
                    },
                    failed_rows: {
                         type: DataTypes.INTEGER,
                         allowNull: true,
                         defaultValue: 0,
                    },
                    error_summary: {
                         type: DataTypes.JSONB,
                         allowNull: true,
                    },
                    metadata: {
                         type: DataTypes.JSONB,
                         allowNull: true,
                    },
                    started_at: {
                         type: DataTypes.DATE,
                         allowNull: true,
                    },
                    completed_at: {
                         type: DataTypes.DATE,
                         allowNull: true,
                    },
               },
               {
                    sequelize,
                    tableName: "jobs",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          Jobs.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
          Jobs.belongsTo(models.Users!, {
               foreignKey: "user_id",
               targetKey: "user_id",
               constraints: true,
          });
     }
}

export { JobType, JobStatus };
export type { JobErrorEntry, JobMetadata };
export default Jobs;
