import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import featuresService from "../../services/features.service";

export async function individualSafeToSpendHandler(req: Request, res: Response): Promise<void> {
     const result = await featuresService.individualSafeToSpend(req.user.tenantType);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function individualGhostTransactionsHandler(
     req: Request,
     res: Response,
): Promise<void> {
     const result = await featuresService.individualGhostTransactions(req.user.tenantType);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function individualOpportunityCostEngineHandler(
     req: Request,
     res: Response,
): Promise<void> {
     const years = Number(req.params.years);
     const riskLeveLPct = Number(req.query.riskLeveLPct);
     const result = await featuresService.individualOpportunityCostEngine(
          req.user.tenantType,
          riskLeveLPct,
          years,
     );
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function individualPeerBenchmarkingHandler(
     req: Request,
     res: Response,
): Promise<void> {
     const result = await featuresService.individualPeerBencmarking(
          req.user.tenantType,
          req.user.tenantId,
     );
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
