import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

enum TransactionType {
     INFLOW = "INFLOW",
     OUTFLOW = "OUTFLOW",
}

class IndividualTransactions extends BaseModel {
     declare id: string;
     declare merchant_name: string;
     declare merchant_cleaned: string | null;
     declare amount: number;
     declare date: Date;
     declare category: string | null;
     declare transaction_type: TransactionType | null;
     declare is_recurring: boolean;
     declare prev_amount: number | null;
     declare price_creep_pct: number | null;
     declare future_value: number | null;
     declare future_year: number | null;
     declare vault_id: string | null;

     static initModel(sequelize: Sequelize) {
          return IndividualTransactions.initWithTenant(
               {
                    individual_transaction_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
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
                         type: DataTypes.DECIMAL(5, 2),
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
                    transaction_type: {
                         type: DataTypes.ENUM(...Object.values(TransactionType)),
                         allowNull: true,
                    },
                    vault_id: {
                         type: DataTypes.UUID,
                         allowNull: true,
                    },
               },
               {
                    sequelize,
                    tableName: "individual_transactions",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          IndividualTransactions.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
          IndividualTransactions.belongsTo(models.Vaults!, {
               foreignKey: "vault_id",
               targetKey: "vault_id",
               constraints: true,
          });
     }
}

export { TransactionType };
export default IndividualTransactions;
