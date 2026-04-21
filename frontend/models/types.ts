import { z } from 'zod'

export interface APIResponse<T> {
  status: string
  message: string
  data?: T
  error?: string
}

export enum TenantType {
  INDIVIDUAL = 'INDIVIDUAL',
  BUSINESS = 'BUSINESS',
}

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  tenantType: z.enum([TenantType.INDIVIDUAL, TenantType.BUSINESS]),
})

export const signupSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain one uppercase letter')
    .regex(/[a-z]/, 'Password must contain one lowercase letter')
    .regex(/\d/, 'Password must contain one number'),
  tenantType: z.enum([TenantType.INDIVIDUAL, TenantType.BUSINESS]),
  tenantName: z.string().min(2, 'Tenant name is required'),
  name: z.string().min(2, 'Name is required'),
})

export type LoginForm = z.infer<typeof loginSchema>

export type SignupForm = z.infer<typeof signupSchema>

export interface UserInfo {
  userId: string
  name: string
  email: string
  tenantId: string
  tenantType: TenantType
}
