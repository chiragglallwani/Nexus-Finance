import { Router } from "express";
import { validate } from "../../middleware/validators/validate";
import {
     createInvoiceValidator,
     deleteInvoiceValidator,
     listInvoicesValidator,
} from "../../middleware/validators/invoiceValidator";
import {
     createInvoiceHandler,
     deleteInvoiceHandler,
     listInvoicesHandler,
} from "../../controllers/tenantInvoices/tenantInvoice.controller";

const router = Router();

router.get("/", listInvoicesValidator, validate, listInvoicesHandler);

router.post("/", createInvoiceValidator, validate, createInvoiceHandler);

router.delete("/:invoiceId", deleteInvoiceValidator, validate, deleteInvoiceHandler);

export default router;
