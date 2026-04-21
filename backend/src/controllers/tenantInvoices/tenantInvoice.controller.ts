import { type Request, type Response } from "express";
import { ApiResponseStatusToCodesMap } from "../../constants/apiResponse";
import { type InvoiceStatus } from "../../database/models/TenantInvoices";
import tenantInvoiceService from "../../services/tenantInvoice.service";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export async function listInvoicesHandler(req: Request, res: Response): Promise<void> {
     const page = req.query.page != null ? Number(req.query.page) : DEFAULT_PAGE;
     const limit = req.query.limit != null ? Number(req.query.limit) : DEFAULT_LIMIT;
     const result = await tenantInvoiceService.listInvoices({ page, limit });
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function createInvoiceHandler(req: Request, res: Response): Promise<void> {
     const { name, sent_date, due_date, actual_paid_date, status, transaction_name_mapper } =
          req.body;
     const { userId } = req.user;

     const result = await tenantInvoiceService.createInvoice({
          userId,
          name,
          sentDate: sent_date,
          dueDate: due_date,
          ...(actual_paid_date !== undefined && { actualPaidDate: actual_paid_date }),
          ...(status !== undefined && { status: status as InvoiceStatus }),
          ...(transaction_name_mapper !== undefined && {
               transactionNameMapper: transaction_name_mapper,
          }),
     });
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}

export async function deleteInvoiceHandler(req: Request, res: Response): Promise<void> {
     const invoiceId = req.params.invoiceId as string;
     const result = await tenantInvoiceService.deleteInvoice(invoiceId);
     res.status(ApiResponseStatusToCodesMap[result.status]).json(result);
}
