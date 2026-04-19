import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "tenant_invoices", schema: "nexus_finance" },
          {
               tenant_invoices_id: {
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
                    allowNull: false,
                    references: {
                         model: {
                              tableName: "users",
                              schema: "nexus_finance",
                         },
                         key: "user_id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "CASCADE",
               },
               name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
               },
               sent_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
               },
               due_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
               },
               actual_paid_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: true,
               },
               status: {
                    type: DataTypes.ENUM("PENDING", "PAID", "OVERDUE"),
                    allowNull: false,
                    defaultValue: "PENDING",
               },
               transaction_name_mapper: {
                    type: DataTypes.STRING(255),
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
          tableName: "tenant_invoices",
          schema: "nexus_finance",
     });
};
