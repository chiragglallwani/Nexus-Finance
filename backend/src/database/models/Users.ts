import { DataTypes, type ModelStatic, type Sequelize } from "sequelize";
import BaseModel from "./BaseModel";

class Users extends BaseModel {
     declare user_id: string;
     declare email: string;
     declare name: string;
     declare password: string;

     static initModel(sequelize: Sequelize) {
          return Users.initWithTenant(
               {
                    user_id: {
                         type: DataTypes.UUID,
                         defaultValue: DataTypes.UUIDV4,
                         primaryKey: true,
                         allowNull: false,
                    },
                    email: {
                         type: DataTypes.STRING(255),
                         allowNull: false,
                    },
                    name: {
                         type: DataTypes.STRING(255),
                         allowNull: false,
                    },
                    password: {
                         type: DataTypes.STRING(255),
                         allowNull: false,
                    },
               },
               {
                    sequelize,
                    tableName: "users",
                    schema: "nexus_finance",
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<BaseModel>>) {
          Users.belongsTo(models.Tenants!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: true,
          });
     }
}

export default Users;
