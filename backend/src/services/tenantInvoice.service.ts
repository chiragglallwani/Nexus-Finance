import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import TenantInvoices, { InvoiceStatus } from "../database/models/TenantInvoices";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

interface CreateInvoiceInput {
     userId: string;
     name: string;
     sentDate: string;
     dueDate: string;
     actualPaidDate?: string | null;
     status?: InvoiceStatus;
     transactionNameMapper?: string | null;
}

interface ListInvoicesInput {
     page: number;
     limit: number;
}

class TenantInvoiceService {
     async listInvoices(input: ListInvoicesInput): Promise<ServiceResponse> {
          const page = input.page > 0 ? input.page : DEFAULT_PAGE;
          const limit =
               input.limit > 0 && input.limit <= 100 ? input.limit : DEFAULT_LIMIT;
          const offset = (page - 1) * limit;

          try {
               const { rows, count } = await TenantInvoices.findAndCountAll({
                    limit,
                    offset,
                    order: [["createdAt", "DESC"]],
               });

               const totalPages = Math.ceil(count / limit) || 1;

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Invoices fetched successfully",
                    data: {
                         invoices: rows.map((inv) => ({
                              tenantInvoicesId: inv.tenant_invoices_id,
                              userId: inv.user_id,
                              name: inv.name,
                              sentDate: inv.sent_date,
                              dueDate: inv.due_date,
                              actualPaidDate: inv.actual_paid_date,
                              status: inv.status,
                              transactionNameMapper: inv.transaction_name_mapper,
                              createdAt: inv.createdAt,
                              updatedAt: inv.updatedAt,
                         })),
                         pagination: {
                              page,
                              limit,
                              total: count,
                              totalPages,
                         },
                    },
               };
          } catch (error) {
               logger.error("Error listing invoices", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to list invoices",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async createInvoice(input: CreateInvoiceInput): Promise<ServiceResponse> {
          const {
               userId,
               name,
               sentDate,
               dueDate,
               actualPaidDate,
               status,
               transactionNameMapper,
          } = input;

          try {
               const invoice = await TenantInvoices.create({
                    user_id: userId,
                    name,
                    sent_date: sentDate,
                    due_date: dueDate,
                    actual_paid_date: actualPaidDate ?? null,
                    status: status ?? InvoiceStatus.PENDING,
                    transaction_name_mapper: transactionNameMapper ?? null,
               });

               logger.info("Invoice created", {
                    tenantInvoicesId: invoice.tenant_invoices_id,
                    userId,
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Invoice created successfully",
                    data: {
                         tenantInvoicesId: invoice.tenant_invoices_id,
                         userId: invoice.user_id,
                         name: invoice.name,
                         sentDate: invoice.sent_date,
                         dueDate: invoice.due_date,
                         actualPaidDate: invoice.actual_paid_date,
                         status: invoice.status,
                         transactionNameMapper: invoice.transaction_name_mapper,
                    },
               };
          } catch (error) {
               logger.error("Error creating invoice", {
                    error: error instanceof Error ? error.message : error,
                    userId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to create invoice",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async deleteInvoice(invoiceId: string): Promise<ServiceResponse> {
          try {
               const invoice = await TenantInvoices.findByPk(invoiceId);
               if (!invoice) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Invoice not found",
                    };
               }

               await invoice.destroy();

               logger.info("Invoice deleted", { tenantInvoicesId: invoiceId });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Invoice deleted successfully",
               };
          } catch (error) {
               logger.error("Error deleting invoice", {
                    error: error instanceof Error ? error.message : error,
                    invoiceId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to delete invoice",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new TenantInvoiceService();
