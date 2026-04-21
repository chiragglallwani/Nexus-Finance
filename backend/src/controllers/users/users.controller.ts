import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import usersService from "../../services/users.service";

export async function getUserNameHandler(req: Request, res: Response): Promise<void> {
     const result = await usersService.getUserName(req.user.userId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function updateUserNameHandler(req: Request, res: Response): Promise<void> {
     const { name } = req.body as { name: string };
     const result = await usersService.updateUserName(req.user.userId, name);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function getTenantNameHandler(req: Request, res: Response): Promise<void> {
     const result = await usersService.getTenantName(req.user.tenantId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function updateTenantNameHandler(req: Request, res: Response): Promise<void> {
     const { name } = req.body as { name: string };
     const result = await usersService.updateTenantName(req.user.tenantId, name);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
