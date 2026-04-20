export enum ApiResponseStatus {
     SUCCESS = "success",
     ACCEPTED = "accepted",
     FAILURE = "failure",
     UNAUTHORIZED = "unauthorized",
     FORBIDDEN = "forbidden",
     CONFLICT = "conflict",
     NOT_FOUND = "not_found",
     BAD_REQUEST = "bad_request",
}

export const ApiResponseStatusToCodesMap: Record<ApiResponseStatus, number> = {
     [ApiResponseStatus.SUCCESS]: 200,
     [ApiResponseStatus.ACCEPTED]: 202,
     [ApiResponseStatus.FAILURE]: 500,
     [ApiResponseStatus.UNAUTHORIZED]: 401,
     [ApiResponseStatus.FORBIDDEN]: 403,
     [ApiResponseStatus.CONFLICT]: 409,
     [ApiResponseStatus.NOT_FOUND]: 404,
     [ApiResponseStatus.BAD_REQUEST]: 400,
};

export interface ServiceResponse<T = unknown> {
     status: ApiResponseStatus;
     message: string;
     data?: T;
     error?: string;
}
