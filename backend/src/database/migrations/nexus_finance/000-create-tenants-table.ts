import { type QueryInterface, DataTypes } from "sequelize";
import { TenantType } from "../../models/Tenants";

export const up = async ({ context: queryInterface }: { context: QueryInterface }) => {
     await queryInterface.createTable(
          { tableName: "tenants", schema: "nexus_finance" },
          {
               tenant_id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true,
                    allowNull: false,
               },
               email: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
                    unique: true,
               },
               name: {
                    type: DataTypes.STRING(255),
                    allowNull: false,
               },
               type: {
                    type: DataTypes.ENUM(...Object.values(TenantType)),
                    allowNull: false,
               },
               tax_rate: {
                    type: DataTypes.INTEGER,
                    allowNull: true,
               },
               risk_profile: {
                    type: DataTypes.DECIMAL(5, 2),
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
          tableName: "tenants",
          schema: "nexus_finance",
     });
};
