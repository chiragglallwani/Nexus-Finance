import { type ValidationError, validationResult } from "express-validator";
import logger from "../../config/logger.js";
import { type NextFunction, type Request, type Response } from "express";

export const validate = (req: Request, res: Response, next: NextFunction) => {
     const errors = validationResult(req);
     logger.info("Validation result", {
          path: req.path,
          hasErrors: !errors.isEmpty(),
          validationMessages: errors.array().map((err: { msg: string }) => err.msg),
     });
     if (!errors.isEmpty()) {
          logger.warn("Validation failed", {
               path: req.path,
               errors: errors.array(),
          });
          return res.status(400).json({
               status: "failure",
               errors: errors.array().map((err: ValidationError) => ({
                    type: err.type,
                    message: err.msg,
               })),
          });
     }
     next();
};
