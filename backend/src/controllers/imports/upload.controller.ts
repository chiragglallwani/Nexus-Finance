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
     const limit = _req.query.limit != null ? Number(_req.query.limit) : 50;
     const result = await uploadService.listJobs(limit);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function downloadUploadTemplate(req: Request, res: Response): Promise<void> {
     const { tenantType } = req.user;
     const result = await uploadService.getTemplateForTenant(tenantType);

     if (!result.data?.stream) {
          res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
          return;
     }

     const fileName = result.data.fileName;
     res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
     res.setHeader("Content-Type", "application/octet-stream");
     result.data.stream.pipe(res);
}
