import { body, param } from "express-validator";

export const createVaultValidator = [
     body("vault_name")
          .trim()
          .notEmpty()
          .withMessage("vault_name is required")
          .isLength({ min: 2, max: 100 })
          .withMessage("vault_name must be between 2 and 100 characters"),

     body("target_amount")
          .notEmpty()
          .withMessage("target_amount is required")
          .isFloat({ gt: 0 })
          .withMessage("target_amount must be a positive number"),

     body("deadline_date")
          .notEmpty()
          .withMessage("deadline_date is required")
          .isISO8601()
          .withMessage("deadline_date must be a valid date (YYYY-MM-DD)"),

     body("priority")
          .notEmpty()
          .withMessage("priority is required")
          .isInt({ min: 1, max: 5 })
          .withMessage("priority must be an integer between 1 and 5"),
];

export const deleteVaultValidator = [
     param("vaultId")
          .notEmpty()
          .withMessage("vaultId is required")
          .isUUID()
          .withMessage("vaultId must be a valid UUID"),
];
