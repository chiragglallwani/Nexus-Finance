import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "individual_transactions", schema: "nexus_finance" },
          {
               individual_transaction_id: {
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
               merchant_name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
               },
               merchant_cleaned: {
                    type: DataTypes.STRING(255),
                    allowNull: true,
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
               is_recurring: {
                    type: DataTypes.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
               },
               prev_amount: {
                    type: DataTypes.DECIMAL(12, 2),
                    allowNull: true,
               },
               price_creep_pct: {
                    type: DataTypes.DECIMAL(10, 2),
                    allowNull: true,
               },
               future_value: {
                    type: DataTypes.DECIMAL(15, 2),
                    allowNull: true,
               },
               future_year: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
               },
               vault_id: {
                    type: DataTypes.UUID,
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
          tableName: "individual_transactions",
          schema: "nexus_finance",
     });
};
