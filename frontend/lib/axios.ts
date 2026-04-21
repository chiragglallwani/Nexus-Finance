// lib/axios.ts
import axios, { type AxiosResponse } from 'axios'
import { Routes } from '@/utils/routes'

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Required for HttpOnly Cookies
})

export const getCookieValue = (key: string): string | null => {
  if (typeof document === 'undefined') return null
  const cookies = document.cookie ? document.cookie.split('; ') : []
  const match = cookies.find((cookie) => cookie.startsWith(`${key}=`))
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null
}

api.interceptors.request.use((config) => {
  const csrfToken = getCookieValue('csrfToken')
  if (csrfToken) {
    config.headers.set('x-csrf-token', csrfToken)
  }
  return config
})

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 403 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        await api.post(Routes.refresh, {}, { withCredentials: true })
        return api(originalRequest)
      } catch (refreshError) {
        const status = (refreshError as { response?: { status?: number } })
          ?.response?.status
        if (status === 403) {
          window.location.href = '/auth'
        }
        return Promise.reject(refreshError)
      }
    }
    return Promise.reject(error)
  }
)
