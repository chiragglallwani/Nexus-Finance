import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "business_transactions", schema: "nexus_finance" },
          {
               business_transactions_id: {
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
               merchant_name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
               },
               amount: {
                    type: DataTypes.DECIMAL(12, 2),
                    allowNull: false,
               },
               date: {
                    type: DataTypes.DATE,
                    allowNull: false,
               },
               category: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
               },
               account_source: {
                    type: DataTypes.STRING(100),
                    allowNull: true,
               },
               tax_reserved: {
                    type: DataTypes.DECIMAL(12, 2),
                    allowNull: true,
               },
               is_deductible: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
               },
               is_leakage: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
               },
               tenant_invoices_id: {
                    type: DataTypes.UUID,
                    allowNull: true,
                    references: {
                         model: {
                              tableName: "tenant_invoices",
                              schema: "nexus_finance",
                         },
                         key: "tenant_invoices_id",
                    },
                    onUpdate: "CASCADE",
                    onDelete: "SET NULL",
               },
               days_to_pay: {
                    type: DataTypes.INTEGER,
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
          tableName: "business_transactions",
          schema: "nexus_finance",
     });
};
