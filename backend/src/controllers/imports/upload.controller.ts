import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import uploadService from "../../services/upload.service";

export async function uploadTransactions(req: Request, res: Response): Promise<void> {
     const { tenantId, userId } = req.user;
     const result = await uploadService.uploadTransactions(req.file, tenantId, userId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function getUploadStatus(req: Request, res: Response): Promise<void> {
     const jobId = req.params.jobId as string;
     const result = await uploadService.getUploadStatus(jobId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function listJobs(_req: Request, res: Response): Promise<void> {
     const result = await uploadService.listJobs();
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
