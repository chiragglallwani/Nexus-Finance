import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import authService from "../../services/auth.service";

export async function signupHandler(req: Request, res: Response): Promise<void> {
     const { tenantType, tenantName, name, email, password } = req.body;
     const result = await authService.signup({ tenantType, tenantName, name, email, password });
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function loginHandler(req: Request, res: Response): Promise<void> {
     const { tenantType, email, password } = req.body;
     const result = await authService.login({ tenantType, email, password }, res);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
