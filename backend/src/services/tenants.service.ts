import { type Transaction } from "sequelize";
import logger from "../config/logger";
import { ApiResponseStatus } from "../constants/apiResponse";
import Tenants, { type TenantType } from "../database/models/Tenants";

class TenantsService {
     async createTenant(
          email: string,
          name: string,
          type: TenantType,
          tax_rate?: number,
          risk_profile?: number,
          transactionargs?: Transaction,
     ) {
          const transaction = transactionargs || (await Tenants.sequelize!.transaction());
          try {
               logger.info("Creating tenant", {
                    email,
                    name,
                    type,
                    tax_rate,
                    risk_profile,
               });

               // todo: uncomment this code once user Module is setup
               // const user = await Users.findOne({
               //     where: {
               //         email,
               //     },
               //     transaction,
               // })
               // if (user) {
               //     if(!transactionargs){
               //         await transaction.rollback();
               //     }
               //     return {
               //         status: ApiResponseStatus.FAILURE,
               //         error: 'Failed to create tenant',
               //         message: 'User already exists with given email',
               //     }
               // }

               const tenant = await Tenants.findOne({
                    where: {
                         email,
                    },
                    transaction,
               });

               if (tenant) {
                    if (!transactionargs) {
                         await transaction.rollback();
                    }
                    return {
                         status: ApiResponseStatus.FAILURE,
                         error: "Failed to create tenant",
                         message: "Tenant already exists with given email",
                    };
               }

               await Tenants.create(
                    {
                         email,
                         name,
                         type,
                         tax_rate,
                         risk_profile,
                    },
                    { transaction },
               );
          } catch (error) {
               logger.error("Error creating tenant", {
                    error,
               });
               if (!transactionargs) {
                    await transaction.rollback();
               }
               return {
                    status: ApiResponseStatus.FAILURE,
                    error: "Failed to create tenant",
                    message: "Internal server error",
               };
          }
     }
}

export default new TenantsService();
