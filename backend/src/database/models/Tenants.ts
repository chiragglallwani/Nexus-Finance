import { DataTypes, type ModelStatic, Model, type Sequelize } from "sequelize";

enum TenantType {
     INDIVIDUAL = "INDIVIDUAL",
     BUSINESS = "BUSINESS",
}

class Tenants extends Model {
     declare tenant_id: string;
     declare email: string;
     declare name: string;
     declare type: TenantType;
     declare tax_rate: number | null;
     declare risk_profile: number | null;
     declare createdAt: Date;
     declare updatedAt: Date;
     declare deletedAt: Date | null;

     static initModel(sequelize: Sequelize) {
          return Tenants.init(
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
                         type: DataTypes.DECIMAL,
                         allowNull: true,
                    },
               },
               {
                    sequelize,
                    tableName: "tenant_profiles",
                    schema: "nexus_finance",
                    timestamps: true,
                    paranoid: true,
                    underscored: true,
               },
          );
     }

     static associate(models: Record<string, ModelStatic<Model>>) {
          Tenants.hasMany(models.BaseModel!, {
               foreignKey: "tenant_id",
               sourceKey: "tenant_id",
               constraints: false,
          });
     }
}

export { TenantType };
export default Tenants;
