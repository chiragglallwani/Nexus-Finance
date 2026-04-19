import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

class TenantBalance extends BaseModel {
     declare tenant_balance_id: string;
     declare balance: number;
     declare balance_date: Date;

     static initModel(sequelize: Sequelize) {
          return TenantBalance.initWithTenant(
               {
                    tenant_balance_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
                    },
                    balance: {
                         type: DataTypes.DECIMAL(12, 2),
                         allowNull: false,
                    },
                    balance_date: {
                         type: DataTypes.DATE,
                         allowNull: false,
                    },
               },
               {
                    sequelize,
                    tableName: "tenant_balance",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          TenantBalance.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
     }
}

export default TenantBalance;
