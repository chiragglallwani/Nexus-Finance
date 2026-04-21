import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import vaultService from "../../services/vault.service";

export async function createVaultHandler(req: Request, res: Response): Promise<void> {
     const { vault_name, target_amount, deadline_date, priority } = req.body;
     const { tenantId } = req.user;
     const result = await vaultService.createVault({
          vaultName: vault_name,
          targetAmount: target_amount,
          deadlineDate: deadline_date,
          priority,
          tenantId,
     });
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function listVaultsHandler(_req: Request, res: Response): Promise<void> {
     const result = await vaultService.listVaults();
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function deleteVaultHandler(req: Request, res: Response): Promise<void> {
     const vaultId = req.params.vaultId as string;
     const result = await vaultService.deleteVault(vaultId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
