import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type FindOptions } from "sequelize";
import logger from "../../config/logger";
import { setAsyncStorage } from "../../utils/asyncStorage";
import Users from "../../database/models/Users";

interface AccessTokenPayload {
     userId: string;
     tenantId: string;
     email: string;
     tenantType: "INDIVIDUAL" | "BUSINESS";
     iat: number;
     exp: number;
}

interface AuthenticatedUser {
     userId: string;
     name: string;
     email: string;
     tenantId: string;
     tenantType: "INDIVIDUAL" | "BUSINESS";
}

declare module "sequelize" {
     interface FindOptions {
          hooks?: boolean;
     }
}

declare global {
     // eslint-disable-next-line @typescript-eslint/no-namespace
     namespace Express {
          interface Request {
               user: AuthenticatedUser;
          }
     }
}

function extractBearerToken(req: Request): string | null {
     const header = req.headers.authorization;
     if (header && header.startsWith("Bearer ")) {
          return header.slice(7);
     }

     const cookieToken = req.cookies?.accessToken as string | undefined;
     if (cookieToken) return cookieToken;

     return null;
}

export async function authMiddleware(
     req: Request,
     res: Response,
     next: NextFunction,
): Promise<void> {
     const token = extractBearerToken(req);

     if (!token) {
          res.status(401).json({
               status: "unauthorized",
               message: "Missing or malformed Authorization header",
          });
          return;
     }

     const secret = process.env.JWT_ACCESS_SECRET;
     if (!secret) {
          logger.error("JWT_ACCESS_SECRET is not configured");
          res.status(500).json({
               status: "failure",
               message: "Server authentication misconfiguration",
          });
          return;
     }

     let payload: AccessTokenPayload;
     try {
          payload = jwt.verify(token, secret) as AccessTokenPayload;
     } catch (err) {
          const isExpired = err instanceof jwt.TokenExpiredError;
          res.status(403).json({
               status: "unauthorized",
               message: isExpired ? "Token expired" : "Invalid token",
          });
          return;
     }

     if (!payload.tenantId || !payload.userId) {
          res.status(401).json({
               status: "unauthorized",
               message: "Token missing required claims",
          });
          return;
     }

     try {
          const userFindOptions: FindOptions = {
               where: { user_id: payload.userId },
               attributes: ["user_id", "name", "email", "tenant_id"],
               hooks: false,
          };

          const user = await Users.findOne(userFindOptions);

          if (!user) {
               logger.warn("JWT references non-existent user", {
                    userId: payload.userId,
                    tenantId: payload.tenantId,
               });
               res.status(403).json({
                    status: "forbidden",
                    message: "Access denied",
               });
               return;
          }

          if (user.tenant_id !== payload.tenantId) {
               logger.warn("JWT tenant mismatch", {
                    userId: payload.userId,
                    tokenTenantId: payload.tenantId,
                    userTenantId: user.tenant_id,
               });
               res.status(403).json({
                    status: "forbidden",
                    message: "Access denied",
               });
               return;
          }

          req.user = {
               userId: user.user_id,
               name: user.name,
               email: user.email,
               tenantId: payload.tenantId,
               tenantType: payload.tenantType,
          };

          setAsyncStorage({ tenantId: user.tenant_id });

          next();
     } catch (error) {
          logger.error("Auth middleware failed", {
               error: error instanceof Error ? error.message : error,
               userId: payload.userId,
               tenantId: payload.tenantId,
          });
          res.status(500).json({
               status: "failure",
               message: "Internal server error",
          });
     }
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
     const headerToken = req.headers["x-csrf-token"] as string | undefined;
     const cookieToken = req.cookies?.csrfToken as string | undefined;

     if (!headerToken || !cookieToken || headerToken !== cookieToken) {
          logger.warn("CSRF token mismatch", {
               ip: req.ip,
               url: req.originalUrl,
               headerToken,
               cookieToken,
          });
          res.status(403).json({ status: "forbidden", message: "CSRF token validation failed" });
          return;
     }

     next();
}

export type { AccessTokenPayload, AuthenticatedUser };
