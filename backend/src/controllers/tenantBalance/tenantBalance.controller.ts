import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import tenantBalanceService from "../../services/tenantBalance.service";

export async function getLatestBalanceHandler(_req: Request, res: Response): Promise<void> {
     const result = await tenantBalanceService.getLatestBalance();
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function upsertBalanceHandler(req: Request, res: Response): Promise<void> {
     const { balance } = req.body;
     const { tenantId } = req.user;
     const result = await tenantBalanceService.upsertBalance({ balance, tenantId });
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
