import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

class BusinessTransactions extends BaseModel {
     declare business_transactions_id: string;
     declare user_id: string;
     declare merchant_name: string;
     declare amount: number;
     declare date: Date;
     declare category: string | null;
     declare account_source: string | null;
     declare tax_reserved: number | null;
     declare is_deductible: boolean;
     declare is_leakage: boolean;
     declare tenant_invoices_id: string | null;
     declare days_to_pay: number | null;

     static initModel(sequelize: Sequelize) {
          return BusinessTransactions.initWithTenant(
               {
                    business_transactions_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
                    },
                    user_id: {
                         type: DataTypes.UUID,
                         allowNull: false,
                         references: {
                              model: "users",
                              key: "user_id",
                         },
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
                              model: "tenant_invoices",
                              key: "tenant_invoices_id",
                         },
                    },
                    days_to_pay: {
                         type: DataTypes.INTEGER,
                         allowNull: true,
                    },
               },
               {
                    sequelize,
                    tableName: "business_transactions",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          BusinessTransactions.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
          BusinessTransactions.belongsTo(models.Users!, {
               foreignKey: "user_id",
               targetKey: "user_id",
               constraints: true,
          });
          BusinessTransactions.belongsTo(models.TenantInvoices!, {
               foreignKey: "tenant_invoices_id",
               targetKey: "tenant_invoices_id",
               constraints: true,
          });
     }
}

export default BusinessTransactions;
