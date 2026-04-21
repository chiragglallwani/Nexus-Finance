import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import TenantBalance from "../database/models/TenantBalance";

interface UpsertBalanceInput {
     balance: number;
     tenantId: string;
}

class TenantBalanceService {
     async getLatestBalance(): Promise<ServiceResponse> {
          try {
               const balance = await TenantBalance.findOne({
                    order: [["balance_date", "DESC"]],
               });

               if (!balance) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "No balance record found for this tenant",
                    };
               }

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Balance fetched successfully",
                    data: {
                         tenantBalanceId: balance.tenant_balance_id,
                         balance: Number(balance.balance),
                         balanceDate: balance.balance_date,
                    },
               };
          } catch (error) {
               logger.error("Error fetching balance", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch balance",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async upsertBalance(input: UpsertBalanceInput): Promise<ServiceResponse> {
          const { balance, tenantId } = input;
          const now = new Date();

          try {
               const existing = await TenantBalance.findOne({
                    order: [["balance_date", "DESC"]],
               });

               if (existing) {
                    existing.balance = balance;
                    existing.balance_date = now;
                    await existing.save();

                    logger.info("Balance updated", {
                         tenantBalanceId: existing.tenant_balance_id,
                         tenantId,
                    });

                    return {
                         status: ApiResponseStatus.SUCCESS,
                         message: "Balance updated successfully",
                         data: {
                              tenantBalanceId: existing.tenant_balance_id,
                              balance: Number(existing.balance),
                              balanceDate: existing.balance_date,
                         },
                    };
               }

               const created = await TenantBalance.create({
                    balance,
                    balance_date: now,
                    tenant_id: tenantId,
               });

               logger.info("Balance created", {
                    tenantBalanceId: created.tenant_balance_id,
                    tenantId,
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Balance created successfully",
                    data: {
                         tenantBalanceId: created.tenant_balance_id,
                         balance: Number(created.balance),
                         balanceDate: created.balance_date,
                    },
               };
          } catch (error) {
               logger.error("Error upserting balance", {
                    error: error instanceof Error ? error.message : error,
                    tenantId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to save balance",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new TenantBalanceService();
