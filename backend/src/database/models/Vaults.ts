import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

class Vaults extends BaseModel {
     declare vault_id: string;
     declare name: string;
     declare target_amount: number;
     declare deadline_date: Date;
     declare priority: number;

     static initModel(sequelize: Sequelize) {
          return Vaults.initWithTenant(
               {
                    vault_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
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
               },
               {
                    sequelize,
                    tableName: "vaults",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          Vaults.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
          Vaults.hasMany(models.IndividualTransactions!, {
               foreignKey: "vault_id",
               sourceKey: "vault_id",
               constraints: true,
          });
     }
}

export default Vaults;
