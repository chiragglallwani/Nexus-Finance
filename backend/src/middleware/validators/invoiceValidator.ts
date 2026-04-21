import { body, param, query } from "express-validator";

export const createInvoiceValidator = [
     body("name")
          .trim()
          .notEmpty()
          .withMessage("name is required")
          .isLength({ min: 1, max: 255 })
          .withMessage("name must be between 1 and 255 characters"),

     body("sent_date")
          .notEmpty()
          .withMessage("sent_date is required")
          .isISO8601()
          .withMessage("sent_date must be a valid date"),

     body("due_date")
          .notEmpty()
          .withMessage("due_date is required")
          .isISO8601()
          .withMessage("due_date must be a valid date"),

     body("actual_paid_date")
          .optional({ nullable: true })
          .isISO8601()
          .withMessage("actual_paid_date must be a valid date"),

     body("status")
          .optional()
          .isIn(["PENDING", "PAID", "OVERDUE"])
          .withMessage("status must be PENDING, PAID, or OVERDUE"),

     body("transaction_name_mapper")
          .optional({ nullable: true })
          .trim()
          .isLength({ max: 255 })
          .withMessage("transaction_name_mapper must be at most 255 characters"),
];

export const listInvoicesValidator = [
     query("page")
          .optional()
          .isInt({ min: 1 })
          .withMessage("page must be a positive integer")
          .toInt(),

     query("limit")
          .optional()
          .isInt({ min: 1, max: 100 })
          .withMessage("limit must be between 1 and 100")
          .toInt(),
];

export const deleteInvoiceValidator = [
     param("invoiceId")
          .notEmpty()
          .withMessage("invoiceId is required")
          .isUUID()
          .withMessage("invoiceId must be a valid UUID"),
];
