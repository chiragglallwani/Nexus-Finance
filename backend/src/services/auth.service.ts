import crypto from "crypto";
import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { type Response } from "express";
import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Tenants, { type TenantType } from "../database/models/Tenants";
import Users from "../database/models/Users";
import { runWithTenantContext } from "../utils/asyncStorage";

const IS_PRODUCTION = process.env.NODE_ENV === "production";

declare module "sequelize" {
     interface FindOptions {
          hooks?: boolean;
     }
}

interface SignupInput {
     tenantType: TenantType;
     tenantName: string;
     name: string;
     email: string;
     password: string;
}

interface LoginInput {
     tenantType: TenantType;
     email: string;
     password: string;
}

interface RefreshTokenPayload {
     userId: string;
     tenantId: string;
     iat: number;
     exp: number;
}

interface TokenSet {
     accessToken: string;
     refreshToken: string;
     csrfToken: string;
}

class AuthService {
     async signup(input: SignupInput): Promise<ServiceResponse> {
          const { tenantType, tenantName, name, email, password } = input;
          const transaction = await Tenants.sequelize!.transaction();

          try {
               const existingTenant = await Tenants.findOne({
                    where: { email },
                    transaction,
               });
               if (existingTenant) {
                    await transaction.rollback();
                    return {
                         status: ApiResponseStatus.CONFLICT,
                         message: "Tenant already exists with this email",
                    };
               }

               const existingUser = await Users.findOne({
                    where: { email },
                    attributes: ["user_id"],
                    transaction,
                    hooks: false,
               });
               if (existingUser) {
                    await transaction.rollback();
                    return {
                         status: ApiResponseStatus.CONFLICT,
                         message: "Account already exists with this email",
                    };
               }

               const tenant = await Tenants.create(
                    { email, name: tenantName, type: tenantType },
                    { transaction },
               );

               const hashedPassword = await argon2.hash(password);

               await runWithTenantContext(tenant.tenant_id, async () => {
                    await Users.create(
                         {
                              email,
                              name,
                              password: hashedPassword,
                              tenant_id: tenant.tenant_id,
                         },
                         { transaction },
                    );
               });

               await transaction.commit();

               logger.info("Signup successful", {
                    tenantId: tenant.tenant_id,
                    email,
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Account created successfully",
               };
          } catch (error) {
               await transaction.rollback();
               logger.error("Signup failed", {
                    error: error instanceof Error ? error.message : error,
                    email,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Signup failed",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async login(input: LoginInput, res: Response): Promise<ServiceResponse> {
          const { tenantType, email, password } = input;

          try {
               const user = await Users.findOne({
                    where: { email },
                    attributes: ["user_id", "email", "password", "tenant_id"],
                    hooks: false,
               });

               if (!user) {
                    return {
                         status: ApiResponseStatus.UNAUTHORIZED,
                         message: "Invalid email or password",
                    };
               }

               const validPassword = await argon2.verify(user.password, password);
               if (!validPassword) {
                    return {
                         status: ApiResponseStatus.UNAUTHORIZED,
                         message: "Invalid email or password",
                    };
               }

               const tenant = await Tenants.findOne({
                    where: { tenant_id: user.tenant_id! },
                    attributes: ["tenant_id", "type"],
               });

               if (!tenant || tenant.type !== tenantType) {
                    return {
                         status: ApiResponseStatus.UNAUTHORIZED,
                         message: "Invalid tenant type for this account",
                    };
               }

               const tokens = this.generateTokens(
                    user.user_id,
                    user.tenant_id!,
                    user.email,
                    tenantType,
               );

               this.setAuthCookiesAndHeaders(res, tokens);

               logger.info("Login successful", {
                    userId: user.user_id,
                    tenantId: user.tenant_id!,
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Login successful",
               };
          } catch (error) {
               logger.error("Login failed", {
                    error: error instanceof Error ? error.message : error,
                    email,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Login failed",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async refreshSession(
          refreshToken: string | undefined,
          accessToken: string | undefined,
          res: Response,
     ): Promise<ServiceResponse> {
          if (!refreshToken) {
               return {
                    status: ApiResponseStatus.UNAUTHORIZED,
                    message: "Refresh token is required",
               };
          }

          const accessSecret = process.env.JWT_ACCESS_SECRET;
          const refreshSecret = process.env.JWT_REFRESH_SECRET;
          if (!accessSecret || !refreshSecret) {
               logger.error("JWT secrets are not configured");
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Server authentication misconfiguration",
               };
          }

          if (accessToken) {
               try {
                    jwt.verify(accessToken, accessSecret);
                    return {
                         status: ApiResponseStatus.BAD_REQUEST,
                         message: "Access token is still valid",
                    };
               } catch (error) {
                    if (!(error instanceof jwt.TokenExpiredError)) {
                         return {
                              status: ApiResponseStatus.UNAUTHORIZED,
                              message: "Invalid access token",
                         };
                    }
               }
          }

          let refreshPayload: RefreshTokenPayload;
          try {
               refreshPayload = jwt.verify(refreshToken, refreshSecret) as RefreshTokenPayload;
          } catch {
               return {
                    status: ApiResponseStatus.UNAUTHORIZED,
                    message: "Invalid or expired refresh token",
               };
          }

          try {
               const user = await Users.findOne({
                    where: { user_id: refreshPayload.userId },
                    attributes: ["user_id", "email", "tenant_id"],
                    hooks: false,
               });
               if (!user || user.tenant_id !== refreshPayload.tenantId) {
                    return {
                         status: ApiResponseStatus.FORBIDDEN,
                         message: "Access denied",
                    };
               }

               const tenant = await Tenants.findOne({
                    where: { tenant_id: user.tenant_id },
                    attributes: ["tenant_id", "type"],
               });
               if (!tenant) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Tenant not found",
                    };
               }

               const tokens = this.generateTokens(
                    user.user_id,
                    user.tenant_id!,
                    user.email,
                    tenant.type as TenantType,
               );
               this.setAuthCookiesAndHeaders(res, tokens);

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Session refreshed successfully",
               };
          } catch (error) {
               logger.error("Refresh session failed", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to refresh session",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     logout(res: Response): ServiceResponse {
          const cookieOptions = {
               httpOnly: true as const,
               secure: IS_PRODUCTION,
               sameSite: "strict" as const,
          };

          res.clearCookie("accessToken", cookieOptions);
          res.clearCookie("refreshToken", cookieOptions);
          res.clearCookie("csrfToken", {
               httpOnly: false,
               secure: IS_PRODUCTION,
               sameSite: "strict",
          });

          res.removeHeader("Authorization");
          res.removeHeader("x-csrf-token");

          return {
               status: ApiResponseStatus.SUCCESS,
               message: "Logged out successfully",
          };
     }

     private setAuthCookiesAndHeaders(res: Response, tokens: TokenSet): void {
          const { accessToken, refreshToken, csrfToken } = tokens;

          res.setHeader("Authorization", `Bearer ${accessToken}`);
          res.setHeader("x-csrf-token", csrfToken);

          res.cookie("accessToken", accessToken, {
               httpOnly: true,
               secure: IS_PRODUCTION,
               sameSite: "strict",
               maxAge: 15 * 60 * 1000,
          });
          res.cookie("refreshToken", refreshToken, {
               httpOnly: true,
               secure: IS_PRODUCTION,
               sameSite: "strict",
               maxAge: 7 * 24 * 60 * 60 * 1000,
          });
          res.cookie("csrfToken", csrfToken, {
               httpOnly: false,
               secure: IS_PRODUCTION,
               sameSite: "strict",
               maxAge: 7 * 24 * 60 * 60 * 1000,
          });
     }

     private generateTokens(
          userId: string,
          tenantId: string,
          email: string,
          tenantType: TenantType,
     ): TokenSet {
          const accessSecret = process.env.JWT_ACCESS_SECRET!;
          const refreshSecret = process.env.JWT_REFRESH_SECRET!;
          const accessExpirySeconds = this.parseExpiryToSeconds(
               process.env.JWT_ACCESS_EXPIRY || "15m",
          );
          const refreshExpirySeconds = this.parseExpiryToSeconds(
               process.env.JWT_REFRESH_EXPIRY || "7d",
          );

          const accessToken = jwt.sign({ userId, tenantId, email, tenantType }, accessSecret, {
               expiresIn: accessExpirySeconds,
          });

          const refreshToken = jwt.sign({ userId, tenantId }, refreshSecret, {
               expiresIn: refreshExpirySeconds,
          });

          const csrfToken = crypto.randomBytes(32).toString("hex");

          return { accessToken, refreshToken, csrfToken };
     }

     private parseExpiryToSeconds(value: string): number {
          const match = value.match(/^(\d+)(s|m|h|d)$/);
          if (!match || !match[1] || !match[2]) return 900;
          const num = parseInt(match[1]);
          const unit: string = match[2];
          const multipliers: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
          return num * (multipliers[unit] ?? 60);
     }
}

export default new AuthService();
