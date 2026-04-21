import { body } from "express-validator";

export const updateNameValidator = [
     body("name")
          .trim()
          .notEmpty()
          .withMessage("name is required")
          .isLength({ min: 2, max: 255 })
          .withMessage("name must be between 2 and 255 characters"),
];
