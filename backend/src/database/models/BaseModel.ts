import {
     Model,
     type InitOptions,
     DataTypes,
     type ModelAttributes,
     type ModelStatic,
     type DestroyOptions,
     type RestoreOptions,
     type UpdateOptions,
     type FindOptions,
     type CountOptions,
} from "sequelize";
import { getTenantId } from "../../utils/asyncStorage";

class BaseModel extends Model {
     declare tenant_id: string | undefined;
     declare createdAt: Date;
     declare updatedAt: Date;
     declare deletedAt: Date | null;

     static initWithTenant(
          attributes: ModelAttributes<BaseModel>,
          options: InitOptions<BaseModel>,
     ) {
          return this.init(
               {
                    tenant_id: {
                         type: DataTypes.STRING,
                         allowNull: true,
                         references: {
                              model: "tenants",
                         },
                         field: "tenant_id",
                    },
                    ...attributes,
               },
               {
                    ...options,
                    timestamps: true,
                    paranoid: true,
                    hooks: {
                         beforeCreate: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                              instance.createdAt = new Date();
                         },
                         beforeDestroy: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                              instance.deletedAt = new Date();
                         },
                         beforeRestore: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                         },

                         beforeUpdate: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                              instance.updatedAt = new Date();
                         },
                         beforeSave: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                         },
                         beforeUpsert: async (instance: BaseModel) => {
                              const tenantId = await getTenantId();
                              if (!instance.tenant_id) {
                                   instance.tenant_id = tenantId;
                              } else if (instance.tenant_id !== tenantId) {
                                   throw new Error("Tenant ID mismatch");
                              }
                         },
                         beforeBulkCreate: async (instances: BaseModel[]) => {
                              const tenantId = await getTenantId();
                              for (const instance of instances) {
                                   if (!instance.tenant_id) {
                                        instance.tenant_id = tenantId;
                                   } else if (instance.tenant_id !== tenantId) {
                                        throw new Error("Tenant ID mismatch");
                                   }
                              }
                         },
                         beforeBulkDestroy: async (options: DestroyOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeBulkRestore: async (options: RestoreOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeBulkUpdate: async (options: UpdateOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeFind: async (options: FindOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeFindAfterExpandIncludeAll: async (
                              options: FindOptions<BaseModel>,
                         ) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeFindAfterOptions: async (options: FindOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                         beforeCount: async (options: CountOptions<BaseModel>) => {
                              const tenantId = await getTenantId();
                              if (!options.where) {
                                   options.where = {};
                              }
                              (options.where as Record<string, unknown>).tenant_id = tenantId;
                         },
                    },
               },
          );
     }

     static associate(models: Record<string, ModelStatic<Model>>) {
          this.belongsTo(models.tenant!, {
               foreignKey: "tenant_id",
               targetKey: "tenant_id",
               constraints: false,
          });
     }
}

export default BaseModel;
