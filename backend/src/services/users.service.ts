import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Tenants from "../database/models/Tenants";
import Users from "../database/models/Users";

class UsersService {
     async getUserName(userId: string): Promise<ServiceResponse<{ name: string }>> {
          try {
               const user = await Users.findOne({
                    where: { user_id: userId },
                    attributes: ["user_id", "name"],
               });

               if (!user) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "User not found",
                    };
               }

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "User name fetched successfully",
                    data: { name: user.name },
               };
          } catch (error) {
               logger.error("Get user name failed", {
                    error: error instanceof Error ? error.message : error,
                    userId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch user name",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async updateUserName(
          userId: string,
          name: string,
     ): Promise<ServiceResponse<{ name: string }>> {
          try {
               const user = await Users.findOne({
                    where: { user_id: userId },
                    attributes: ["user_id", "name"],
               });

               if (!user) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "User not found",
                    };
               }

               user.name = name;
               await user.save();

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "User name updated successfully",
                    data: { name: user.name },
               };
          } catch (error) {
               logger.error("Update user name failed", {
                    error: error instanceof Error ? error.message : error,
                    userId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to update user name",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async getTenantName(tenantId: string): Promise<ServiceResponse<{ name: string }>> {
          try {
               const tenant = await Tenants.findOne({
                    where: { tenant_id: tenantId },
                    attributes: ["tenant_id", "name"],
               });

               if (!tenant) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Tenant not found",
                    };
               }

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Tenant name fetched successfully",
                    data: { name: tenant.name },
               };
          } catch (error) {
               logger.error("Get tenant name failed", {
                    error: error instanceof Error ? error.message : error,
                    tenantId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch tenant name",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async updateTenantName(
          tenantId: string,
          name: string,
     ): Promise<ServiceResponse<{ name: string }>> {
          try {
               const tenant = await Tenants.findOne({
                    where: { tenant_id: tenantId },
                    attributes: ["tenant_id", "name"],
               });

               if (!tenant) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Tenant not found",
                    };
               }

               tenant.name = name;
               await tenant.save();

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Tenant name updated successfully",
                    data: { name: tenant.name },
               };
          } catch (error) {
               logger.error("Update tenant name failed", {
                    error: error instanceof Error ? error.message : error,
                    tenantId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to update tenant name",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new UsersService();
