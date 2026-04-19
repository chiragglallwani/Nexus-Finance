import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "tenant_balance", schema: "nexus_finance" },
          {
               tenant_balance_id: {
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
               balance: {
                    type: DataTypes.DECIMAL(12, 2),
                    allowNull: false,
               },
               balance_date: {
                    type: DataTypes.DATE,
                    allowNull: false,
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
          tableName: "tenant_balance",
          schema: "nexus_finance",
     });
};
