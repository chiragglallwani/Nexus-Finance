import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

enum InvoiceStatus {
     PENDING = "PENDING",
     PAID = "PAID",
     OVERDUE = "OVERDUE",
}

class TenantInvoices extends BaseModel {
     declare tenant_invoices_id: string;
     declare user_id: string;
     declare name: string;
     declare sent_date: Date;
     declare due_date: Date;
     declare actual_paid_date: Date | null;
     declare status: InvoiceStatus;
     declare transaction_name_mapper: string | null;

     static initModel(sequelize: Sequelize) {
          return TenantInvoices.initWithTenant(
               {
                    tenant_invoices_id: {
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
                         type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
                         allowNull: false,
                         defaultValue: InvoiceStatus.PENDING,
                    },
                    transaction_name_mapper: {
                         type: DataTypes.STRING(255),
                         allowNull: true,
                    },
               },
               {
                    sequelize,
                    tableName: "tenant_invoices",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          TenantInvoices.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
          TenantInvoices.belongsTo(models.Users!, {
               foreignKey: "user_id",
               targetKey: "user_id",
               constraints: true,
          });
          TenantInvoices.hasMany(models.BusinessTransactions!, {
               foreignKey: "tenant_invoices_id",
               sourceKey: "tenant_invoices_id",
               constraints: true,
          });
     }
}

export { InvoiceStatus };
export default TenantInvoices;
