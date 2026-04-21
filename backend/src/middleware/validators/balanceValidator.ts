import { body } from "express-validator";

export const upsertBalanceValidator = [
     body("balance")
          .notEmpty()
          .withMessage("balance is required")
          .isFloat({ min: 0 })
          .withMessage("balance must be a non-negative number"),
];
