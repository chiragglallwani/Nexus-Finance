import { api } from '@/lib/axios'
import { Routes } from '@/utils/routes'
import { APIResponse, LoginForm, SignupForm, UserInfo } from '@/models/types'
import { AxiosError } from 'axios'

const defaultErrorResponse: APIResponse<void> = {
  status: 'failure',
  message: 'Something went wrong',
}

const normalizeAxiosError = (error: unknown): APIResponse<void> => {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data as APIResponse<void> | undefined
    if (responseData?.status && responseData?.message) {
      return responseData
    }
  }
  return defaultErrorResponse
}

export const login = async (form: LoginForm) => {
  try {
    const response = await api.post<APIResponse<void>>(Routes.login, form)
    return response.data
  } catch (error) {
    return normalizeAxiosError(error)
  }
}

export const signup = async (form: SignupForm) => {
  try {
    const response = await api.post<APIResponse<void>>(Routes.signup, form)
    return response.data
  } catch (error) {
    return normalizeAxiosError(error)
  }
}

export const logout = async () => {
  try {
    const response = await api.post<APIResponse<void>>(Routes.logout)
    return response.data
  } catch (error) {
    return normalizeAxiosError(error)
  }
}

export const me = async () => {
  try {
    const response = await api.get<APIResponse<UserInfo>>(Routes.me)
    return response.data
  } catch (error) {
    return normalizeAxiosError(error) as APIResponse<UserInfo>
  }
}
