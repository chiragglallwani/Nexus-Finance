import logger from "../config/logger";
import { ApiResponseStatus, type ServiceResponse } from "../constants/apiResponse";
import Jobs from "../database/models/Jobs";

class JobService {
     async getJobById(jobId: string): Promise<ServiceResponse> {
          try {
               const job = await Jobs.findByPk(jobId);
               if (!job) {
                    return {
                         status: ApiResponseStatus.NOT_FOUND,
                         message: "Job not found",
                    };
               }

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Job fetched successfully",
                    data: {
                         jobId: job.job_id,
                         status: job.status,
                         totalRows: job.total_rows,
                         processedRows: job.processed_rows,
                         failedRows: job.failed_rows,
                         progressPct: job.progressPct,
                         fileName: job.file_original_name,
                         startedAt: job.started_at,
                         completedAt: job.completed_at,
                         errorSummary: job.error_summary,
                    },
               };
          } catch (error) {
               logger.error("Error fetching job", {
                    error: error instanceof Error ? error.message : error,
                    jobId,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch job status",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }

     async getRecentJobs(limit = 50): Promise<ServiceResponse> {
          try {
               const jobs = await Jobs.findAll({
                    order: [["created_at", "DESC"]],
                    limit,
                    attributes: [
                         "job_id",
                         "type",
                         "status",
                         "file_original_name",
                         "total_rows",
                         "processed_rows",
                         "failed_rows",
                         "started_at",
                         "completed_at",
                         "created_at",
                    ],
               });

               return {
                    status: ApiResponseStatus.SUCCESS,
                    message: "Jobs fetched successfully",
                    data: jobs,
               };
          } catch (error) {
               logger.error("Error fetching jobs", {
                    error: error instanceof Error ? error.message : error,
               });
               return {
                    status: ApiResponseStatus.FAILURE,
                    message: "Failed to fetch jobs",
                    error: error instanceof Error ? error.message : "Internal server error",
               };
          }
     }
}

export default new JobService();
