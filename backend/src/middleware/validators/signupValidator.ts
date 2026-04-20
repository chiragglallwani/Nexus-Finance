import { body } from "express-validator";

export const signupValidator = [
     body("tenantType")
          .trim()
          .notEmpty()
          .withMessage("tenantType is required")
          .isIn(["INDIVIDUAL", "BUSINESS"])
          .withMessage("Invalid tenant type"),

     body("tenantName")
          .trim()
          .notEmpty()
          .withMessage("tenantName is required")
          .isLength({ min: 2, max: 255 })
          .withMessage("tenantName must be between 2 and 255 characters"),

     body("name")
          .trim()
          .notEmpty()
          .withMessage("name is required")
          .isLength({ min: 2, max: 255 })
          .withMessage("name must be between 2 and 255 characters"),

     body("email")
          .trim()
          .notEmpty()
          .withMessage("email is required")
          .isEmail()
          .withMessage("email must be a valid email address")
          .normalizeEmail(),

     body("password")
          .notEmpty()
          .withMessage("password is required")
          .isLength({ min: 8 })
          .withMessage("password must be at least 8 characters")
          .matches(/[A-Z]/)
          .withMessage("password must contain at least one uppercase letter")
          .matches(/[a-z]/)
          .withMessage("password must contain at least one lowercase letter")
          .matches(/\d/)
          .withMessage("password must contain at least one number"),
];
