import { type QueryInterface, DataTypes } from "sequelize";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "vaults", schema: "nexus_finance" },
          {
               vault_id: {
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
               name: {
                    type: DataTypes.STRING(100),
                    allowNull: false,
               },
               target_amount: {
                    type: DataTypes.DECIMAL(12, 2),
                    allowNull: false,
               },
               deadline_date: {
                    type: DataTypes.DATEONLY,
                    allowNull: false,
               },
               priority: {
                    type: DataTypes.INTEGER,
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
          tableName: "vaults",
          schema: "nexus_finance",
     });
};
