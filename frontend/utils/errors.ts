import { APIResponse } from '@/models/types'
import { AxiosError } from 'axios'

const defaultErrorResponse: APIResponse<void> = {
  status: 'failure',
  message: 'Something went wrong',
}

export const normalizeAxiosError = (error: unknown): APIResponse<void> => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as APIResponse<void> | undefined
    if (responseData?.status && responseData?.message) {
      return responseData
    }
  }
  return defaultErrorResponse
}
