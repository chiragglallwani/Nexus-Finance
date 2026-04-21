'use client'

import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
  getTenantBalance,
  getTenantName,
  getUserName,
  updateTenantName,
  updateUserName,
  upsertTenantBalance,
} from '@/services/profile/profileService'

const tenantDetailsSchema = z.object({
  fullName: z.string().min(1, 'Full Name is required'),
  tenantName: z.string().min(1, 'Tenant Name is required'),
  tenantBalance: z
    .number({ error: 'Tenant balance must be a number' })
    .finite('Tenant balance must be a valid number'),
})

type TenantDetailsForm = z.infer<typeof tenantDetailsSchema>

function TenantDetails() {
  const [isSavingUserName, setIsSavingUserName] = useState(false)
  const [isSavingTenantName, setIsSavingTenantName] = useState(false)
  const [isSavingBalance, setIsSavingBalance] = useState(false)

  const {
    register,
    formState: { errors },
    reset,
    trigger,
    getValues,
  } = useForm<TenantDetailsForm>({
    resolver: zodResolver(tenantDetailsSchema),
    defaultValues: {
      fullName: '',
      tenantName: '',
      tenantBalance: 0,
    },
  })

  useEffect(() => {
    const fetchData = async () => {
      const [user, tenantName, tenantBalance] = await Promise.allSettled([
        getUserName(),
        getTenantName(),
        getTenantBalance(),
      ])

      const fullName =
        user.status === 'fulfilled' &&
        user.value.status === 'success' &&
        user.value.data?.name
          ? user.value.data.name
          : ''
      const resolvedTenantName =
        tenantName.status === 'fulfilled' &&
        tenantName.value.status === 'success' &&
        tenantName.value.data?.name
          ? tenantName.value.data.name
          : ''
      const resolvedTenantBalance =
        tenantBalance.status === 'fulfilled' &&
        tenantBalance.value.status === 'success' &&
        typeof tenantBalance.value.data?.balance === 'number'
          ? tenantBalance.value.data.balance
          : 0

      reset({
        fullName,
        tenantName: resolvedTenantName,
        tenantBalance: resolvedTenantBalance,
      })
    }
    void fetchData()
  }, [reset])

  const handleFullNameBlur = async () => {
    const isValid = await trigger('fullName')
    if (!isValid) return
    const name = getValues('fullName').trim()

    setIsSavingUserName(true)
    const response = await updateUserName(name)
    setIsSavingUserName(false)

    if (response.status === 'success') {
      toast.success(response.message)
      return
    }
    toast.error(response.message)
  }

  const handleTenantNameBlur = async () => {
    const isValid = await trigger('tenantName')
    if (!isValid) return
    const name = getValues('tenantName').trim()

    setIsSavingTenantName(true)
    const response = await updateTenantName(name)
    setIsSavingTenantName(false)

    if (response.status === 'success') {
      toast.success(response.message)
      return
    }
    toast.error(response.message)
  }

  const handleTenantBalanceBlur = async () => {
    const isValid = await trigger('tenantBalance')
    if (!isValid) return
    const balance = getValues('tenantBalance')

    setIsSavingBalance(true)
    const response = await upsertTenantBalance(balance)
    setIsSavingBalance(false)

    if (response.status === 'success') {
      toast.success(response.message)
      return
    }
    toast.error(response.message)
  }

  return (
    <section className="surface-container-low flex flex-col gap-4 rounded-lg p-6">
      <h2 className="title-lg mb-4">Tenant Details</h2>

      <div>
        <label className="label-md text-muted-foreground" htmlFor="fullName">
          Full Name
        </label>
        <input
          id="fullName"
          className="border-border bg-background mt-1 w-full rounded-md border p-2"
          {...register('fullName')}
          onBlur={handleFullNameBlur}
        />
        {isSavingUserName && (
          <p className="text-muted-foreground mt-1 text-sm">Saving...</p>
        )}
        {errors.fullName?.message && (
          <p className="text-destructive mt-1 text-sm">
            {errors.fullName.message}
          </p>
        )}
      </div>
      <div>
        <label className="label-md text-muted-foreground" htmlFor="tenantName">
          Tenant Name
        </label>
        <input
          id="tenantName"
          className="border-border bg-background mt-1 w-full rounded-md border p-2"
          {...register('tenantName')}
          onBlur={handleTenantNameBlur}
        />
        {isSavingTenantName && (
          <p className="text-muted-foreground mt-1 text-sm">Saving...</p>
        )}
        {errors.tenantName?.message && (
          <p className="text-destructive mt-1 text-sm">
            {errors.tenantName.message}
          </p>
        )}
      </div>
      <div>
        <label
          className="label-md text-muted-foreground"
          htmlFor="tenantBalance"
        >
          Tenant Balance
        </label>
        <input
          id="tenantBalance"
          type="number"
          step="0.01"
          className="border-border bg-background mt-1 w-full rounded-md border p-2"
          {...register('tenantBalance', { valueAsNumber: true })}
          onBlur={handleTenantBalanceBlur}
        />
        {isSavingBalance && (
          <p className="text-muted-foreground mt-1 text-sm">Saving...</p>
        )}
        {errors.tenantBalance?.message && (
          <p className="text-destructive mt-1 text-sm">
            {errors.tenantBalance.message}
          </p>
        )}
      </div>
    </section>
  )
}

export default TenantDetails
