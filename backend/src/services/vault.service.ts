import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Vaults from "../database/models/Vaults";
import TenantBalance from "../database/models/TenantBalance";

const MAX_VAULTS = 5;

interface CreateVaultInput {
     vaultName: string;
     targetAmount: number;
     deadlineDate: string;
     priority: number;
     tenantId: string;
}

class VaultService {
     async createVault(input: CreateVaultInput): Promise<ServiceResponse> {
          const { vaultName, targetAmount, deadlineDate, priority, tenantId } = input;

          try {
               const existingCount = await Vaults.count();
               if (existingCount >= MAX_VAULTS) {
                    return {
                         status: ApiResponseStatus.BAD_REQUEST,
                         message: `Maximum of ${MAX_VAULTS} vaults allowed per tenant`,
                    };
               }

               const existingPriority = await Vaults.findOne({
                    where: { priority },
                    attributes: ["vault_id"],
               });
               if (existingPriority) {
                    return {
                         status: ApiResponseStatus.CONFLICT,
                         message: `A vault with priority ${priority} already exists`,
                    };
               }

               const vault = await Vaults.create({
                    name: vaultName,
                    target_amount: targetAmount,
                    deadline_date: deadlineDate,
                    priority,
                    tenant_id: tenantId,
               });

               logger.info("Vault created", { vaultId: vault.vault_id, tenantId });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Vault created successfully",
                    data: {
                         vaultId: vault.vault_id,
                         name: vault.name,
                         targetAmount: vault.target_amount,
                         deadlineDate: vault.deadline_date,
                         priority: vault.priority,
                    },
               };
          } catch (error) {
               logger.error("Error creating vault", {
                    error: error instanceof Error ? error.message : error,
                    tenantId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to create vault",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async listVaults(): Promise<ServiceResponse> {
          try {
               const vaults = await Vaults.findAll({
                    order: [["priority", "ASC"]],
               });

               if (vaults.length === 0) {
                    return {
                         status: ApiResponseStatus.SUCCESS,
                         message: "No vaults found",
                         data: [],
                    };
               }

               const latestBalance = await TenantBalance.findOne({
                    order: [["balance_date", "DESC"]],
                    attributes: ["balance"],
               });

               const balance = latestBalance ? Number(latestBalance.balance) : 0;
               const totalVaults = vaults.length;
               const totalWeight = (totalVaults * (totalVaults + 1)) / 2;

               const allocations = vaults.map((vault, index) => {
                    const weight = totalVaults - index;
                    const fractionalShare = weight / totalWeight;
                    const assignedAmount = balance * fractionalShare;
                    const finalAmount = Math.min(assignedAmount, Number(vault.target_amount));
                    const completionPct =
                         Number(vault.target_amount) > 0
                              ? +((finalAmount / Number(vault.target_amount)) * 100).toFixed(2)
                              : 0;

                    return {
                         vaultId: vault.vault_id,
                         name: vault.name,
                         priority: vault.priority,
                         targetAmount: Number(vault.target_amount),
                         deadlineDate: vault.deadline_date,
                         sharePercentage: +(fractionalShare * 100).toFixed(2),
                         currentAllocation: +finalAmount.toFixed(2),
                         completionPct,
                         status:
                              finalAmount >= Number(vault.target_amount) ? "Completed" : "Saving",
                    };
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Vaults fetched successfully",
                    data: {
                         vaults: allocations,
                         totalBalance: balance,
                    },
               };
          } catch (error) {
               logger.error("Error fetching vaults", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch vaults",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async deleteVault(vaultId: string): Promise<ServiceResponse> {
          try {
               const vault = await Vaults.findByPk(vaultId);
               if (!vault) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Vault not found",
                    };
               }

               await vault.destroy();

               logger.info("Vault deleted", { vaultId });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Vault deleted successfully",
               };
          } catch (error) {
               logger.error("Error deleting vault", {
                    error: error instanceof Error ? error.message : error,
                    vaultId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to delete vault",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new VaultService();
