import { api } from '@/lib/axios'
import type { APIResponse } from '@/models/types'
import { Routes } from '@/utils/routes'

interface NamePayload {
  name: string
}

interface BalancePayload {
  tenantBalanceId: string
  balance: number
  balanceDate: string
}

const fallbackError = <T>(message: string): APIResponse<T> => ({
  status: 'failure',
  message,
})

export const getUserName = async (): Promise<APIResponse<NamePayload>> => {
  try {
    const response = await api.get<APIResponse<NamePayload>>(Routes.userName)
    return response.data
  } catch {
    return fallbackError<NamePayload>('Failed to fetch user name')
  }
}

export const getTenantName = async (): Promise<APIResponse<NamePayload>> => {
  try {
    const response = await api.get<APIResponse<NamePayload>>(
      Routes.userTenantName
    )
    return response.data
  } catch {
    return fallbackError<NamePayload>('Failed to fetch tenant name')
  }
}

export const getTenantBalance = async (): Promise<
  APIResponse<BalancePayload>
> => {
  try {
    const response = await api.get<APIResponse<BalancePayload>>(
      Routes.tenantBalance
    )
    return response.data
  } catch {
    return fallbackError<BalancePayload>('Failed to fetch tenant balance')
  }
}

export const updateUserName = async (
  name: string
): Promise<APIResponse<NamePayload>> => {
  try {
    const response = await api.patch<APIResponse<NamePayload>>(
      Routes.userName,
      { name }
    )
    return response.data
  } catch {
    return fallbackError<NamePayload>('Failed to update user name')
  }
}

export const updateTenantName = async (
  name: string
): Promise<APIResponse<NamePayload>> => {
  try {
    const response = await api.patch<APIResponse<NamePayload>>(
      Routes.userTenantName,
      { name }
    )
    return response.data
  } catch {
    return fallbackError<NamePayload>('Failed to update tenant name')
  }
}

export const upsertTenantBalance = async (
  balance: number
): Promise<APIResponse<BalancePayload>> => {
  try {
    const response = await api.post<APIResponse<BalancePayload>>(
      `${Routes.tenantBalance}/upsert`,
      { balance }
    )
    return response.data
  } catch {
    return fallbackError<BalancePayload>('Failed to update tenant balance')
  }
}
