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

export async function refreshHandler(req: Request, res: Response): Promise<void> {
     const refreshToken = req.cookies?.refreshToken as string | undefined;
     const accessTokenCookie = req.cookies?.accessToken as string | undefined;
     const accessTokenHeader = req.headers.authorization?.startsWith("Bearer ")
          ? req.headers.authorization.slice(7)
          : undefined;
     const accessToken = accessTokenHeader || accessTokenCookie;

     const result = await authService.refreshSession(refreshToken, accessToken, res);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function logoutHandler(_req: Request, res: Response): Promise<void> {
     const result = authService.logout(res);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
