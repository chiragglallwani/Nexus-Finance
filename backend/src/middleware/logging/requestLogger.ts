import { type NextFunction, type Request, type Response } from "express";
import logger from "../../config/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
     const startTime = Date.now();
     res.on("finish", () => {
          const duration = Date.now() - startTime;
          logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`, {
               ip: req.ip,
               userAgent: req.headers["user-agent"],
               referer: req.headers.referer,
               body: req.body,
          });
     });
     next();
};
