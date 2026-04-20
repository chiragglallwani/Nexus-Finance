import { body } from "express-validator";

export const loginValidator = [
     body("tenantType")
          .trim()
          .notEmpty()
          .withMessage("tenantType is required")
          .isIn(["INDIVIDUAL", "BUSINESS"])
          .withMessage("Invalid tenant type"),

     body("email")
          .trim()
          .notEmpty()
          .withMessage("email is required")
          .isEmail()
          .withMessage("email must be a valid email address")
          .normalizeEmail(),

     body("password").notEmpty().withMessage("password is required"),
];
