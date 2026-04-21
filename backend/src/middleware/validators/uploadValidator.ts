import { param, query } from "express-validator";

export const getUploadStatusValidator = [
     param("jobId")
          .notEmpty()
          .withMessage("jobId is required")
          .isUUID()
          .withMessage("jobId must be a valid UUID"),
];

export const listUploadJobsValidator = [
     query("limit")
          .optional()
          .isInt({ min: 1, max: 100 })
          .withMessage("limit must be an integer between 1 and 100")
          .toInt(),
];
