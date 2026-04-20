import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "jobs", schema: "nexus_finance" },
          {
               job_id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
               },
               tenant_id: {
                    type: DataTypes.UUID,
                    allowNull: false,
                    references: {
                         model: {
                              tableName: "tenants",
                              schema: "nexus_finance",
                         },
                         key: "tenant_id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
               },
               user_id: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    references: {
                         model: {
                              tableName: "users",
                              schema: "nexus_finance",
                         },
                         key: "user_id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
               },
               bullmq_job_id: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
               },
               type: {
                    type: DataTypes.ENUM("TRANSACTION_IMPORT", "ANALYSIS_RUN", "REPORT_GENERATION"),
                    allowNull: false,
               },
               status: {
                    type: DataTypes.ENUM(
                         "PENDING",
                         "QUEUED",
                         "PROCESSING",
                         "COMPLETED",
                         "FAILED",
                         "RETRYING",
                    ),
                    allowNull: false,
                    defaultValue: "PENDING",
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
               created_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
               },
               updated_at: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW,
               },
               deleted_at: {
                    type: DataTypes.DATE,
                    allowNull: true,
               },
          },
     );
};

export const down = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.dropTable({
          tableName: "jobs",
          schema: "nexus_finance",
     });
};
