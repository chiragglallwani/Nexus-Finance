import { param, query } from "express-validator";

export const individualOpportunityCostValidator = [
     param("years")
          .notEmpty()
          .withMessage("years is required")
          .isInt({ min: 1, max: 100 })
          .withMessage("years must be an integer between 1 and 100")
          .toInt(),
     query("riskLeveLPct")
          .notEmpty()
          .withMessage("riskLeveLPct is required")
          .isFloat({ min: 0 })
          .withMessage("riskLeveLPct must be a non-negative number")
          .toFloat(),
];
