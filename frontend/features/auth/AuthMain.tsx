'use client'
import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  ArrowRight,
  AtSign,
  Building2,
  Eye,
  EyeOff,
  Lock,
  User,
} from 'lucide-react'
import { login, signup } from '@/services/auth/authService'
import { TenantType, loginSchema, signupSchema } from '@/models/types'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useUser } from '@/context/UserContext'

type AuthMode = 'login' | 'signup'
type AccountMode = TenantType.INDIVIDUAL | TenantType.BUSINESS

type AuthFormValues = {
  email: string
  password: string
  tenantType: TenantType
  tenantName?: string
  name?: string
}

const defaultValues: AuthFormValues = {
  email: '',
  password: '',
  tenantType: TenantType.INDIVIDUAL,
  tenantName: '',
  name: '',
}

function AuthMain() {
  const router = useRouter()
  const { refreshUser } = useUser()
  const [authType, setAuthType] = useState<AuthMode>('login')
  const [accountType, setAccountType] = useState<AccountMode>(
    TenantType.INDIVIDUAL
  )
  const [showPassword, setShowPassword] = useState(false)

  const schema = useMemo(() => {
    return authType === 'login' ? loginSchema : signupSchema
  }, [authType])

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  const onSubmit = async (values: AuthFormValues) => {
    if (authType === 'login') {
      const response = await login({
        email: values.email,
        password: values.password,
        tenantType: values.tenantType,
      })
      if (response.status === 'success') {
        toast.success(response.message || 'Login successful')
        router.push('/profile')
        refreshUser()
      } else {
        toast.error(response.message || 'Login failed')
      }
      return
    }

    const response = await signup({
      email: values.email,
      password: values.password,
      tenantType: values.tenantType,
      tenantName: values.tenantName || '',
      name: values.name || '',
    })
    if (response.status === 'success') {
      toast.success(response.message || 'Signup successful')
      router.push('/profile')
    } else {
      toast.error(response.message || 'Signup failed')
    }
  }

  return (
    <section className="items-cstart bg-background relative flex w-full justify-center p-6 sm:p-12 md:p-20 lg:w-1/2">
      {/* Subtle Ambient Glow */}
      <div className="bg-primary/10 absolute top-0 right-0 h-80 w-80 translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px]" />
      <div className="bg-primary-container/10 absolute bottom-0 left-0 h-96 w-96 -translate-x-1/2 translate-y-1/2 rounded-full blur-[140px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="z-10 w-full max-w-md space-y-8"
      >
        {/* Header */}
        <div className="text-center lg:text-left">
          <h2 className="text-on-surface mb-2 text-3xl font-bold">
            Welcome to the Vault
          </h2>
          <p className="text-on-surface-variant/80">
            Access your institutional dashboard and portfolio.
          </p>
        </div>

        {/* Form Card */}
        <div className="glass-card relative overflow-hidden rounded-[20px] p-8 shadow-2xl">
          {/* Login/Signup Tabs */}
          <div className="bg-surface-container-lowest/50 border-outline-variant/30 mb-8 flex rounded-xl border p-1">
            {(['login', 'signup'] as const).map((type) => (
              <button
                key={type}
                onClick={() => {
                  setAuthType(type)
                }}
                className={`relative flex-1 rounded-lg py-2.5 text-sm font-medium transition-all duration-300 ${
                  authType === type
                    ? 'text-on-primary'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {type === 'login' ? 'Login' : 'Sign Up'}
                {authType === type && (
                  <motion.div
                    layoutId="tab"
                    className="bg-primary shadow-primary/20 absolute inset-0 -z-10 rounded-lg shadow-lg"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            ))}
          </div>

          <form
            className="space-y-6"
            onSubmit={handleSubmit(onSubmit)}
            autoComplete="off"
          >
            {/* Account Type Selector */}
            <div className="space-y-2">
              <label className="text-on-surface-variant block px-1 text-[10px] font-semibold tracking-widest uppercase">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {([TenantType.INDIVIDUAL, TenantType.BUSINESS] as const).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setAccountType(type)
                        setValue('tenantType', type)
                      }}
                      className={`flex items-center justify-center gap-2.5 rounded-xl border px-4 py-3.5 transition-all duration-200 ${
                        accountType === type
                          ? 'bg-primary/10 border-primary text-primary shadow-primary/10 shadow-sm'
                          : 'bg-surface-container-highest/20 border-outline-variant/30 text-on-surface-variant hover:border-outline-variant/60'
                      }`}
                    >
                      {type === TenantType.INDIVIDUAL ? (
                        <User size={18} />
                      ) : (
                        <Building2 size={18} />
                      )}
                      <span className="text-sm font-bold capitalize">
                        {type}
                      </span>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Inputs */}
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-on-surface-variant block px-1 text-[10px] font-semibold tracking-widest uppercase"
                >
                  Institutional Email
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <AtSign
                      className="text-outline group-focus-within:text-primary transition-colors duration-200"
                      size={18}
                    />
                  </div>
                  <input
                    id="email"
                    {...register('email')}
                    type="email"
                    placeholder="name@nexus.finance"
                    className="bg-surface-container-lowest/80 border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:ring-primary/20 focus:border-primary block w-full rounded-xl border py-3.5 pr-4 pl-12 transition-all outline-none focus:ring-2"
                  />
                </div>
                {errors.email?.message && (
                  <p className="px-1 text-xs text-red-400">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <label
                    htmlFor="password"
                    className="text-on-surface-variant block text-[10px] font-semibold tracking-widest uppercase"
                  >
                    Access Key
                  </label>
                </div>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock
                      className="text-outline group-focus-within:text-primary transition-colors duration-200"
                      size={18}
                    />
                  </div>
                  <input
                    id="password"
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    className="bg-surface-container-lowest/80 border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:ring-primary/20 focus:border-primary block w-full rounded-xl border py-3.5 pr-12 pl-12 font-mono transition-all outline-none focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-outline hover:text-on-surface absolute inset-y-0 right-0 flex items-center pr-4 transition-colors duration-200"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="px-1 text-xs text-red-400">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {authType === 'signup' && (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="text-on-surface-variant block px-1 text-[10px] font-semibold tracking-widest uppercase"
                    >
                      Full Name
                    </label>
                    <input
                      id="name"
                      {...register('name')}
                      type="text"
                      placeholder="John Doe"
                      className="bg-surface-container-lowest/80 border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:ring-primary/20 focus:border-primary block w-full rounded-xl border px-4 py-3.5 transition-all outline-none focus:ring-2"
                    />
                    {errors.name?.message && (
                      <p className="px-1 text-xs text-red-400">
                        {errors.name.message}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="tenantName"
                      className="text-on-surface-variant block px-1 text-[10px] font-semibold tracking-widest uppercase"
                    >
                      Tenant Name
                    </label>
                    <input
                      id="tenantName"
                      {...register('tenantName')}
                      type="text"
                      placeholder="Nexus Holdings"
                      className="bg-surface-container-lowest/80 border-outline-variant/30 text-on-surface placeholder:text-outline/60 focus:ring-primary/20 focus:border-primary block w-full rounded-xl border px-4 py-3.5 transition-all outline-none focus:ring-2"
                    />
                    {errors.tenantName?.message && (
                      <p className="px-1 text-xs text-red-400">
                        {errors.tenantName.message}
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <input
              type="hidden"
              {...register('tenantType')}
              value={accountType}
            />

            {/* Main CTA */}
            <Button
              type="submit"
              disabled={isSubmitting}
              variant="submission"
              size="lg"
              className="w-full py-8 text-lg font-bold"
            >
              {isSubmitting
                ? 'Processing...'
                : authType === 'login'
                  ? 'Initialize Secure Session'
                  : 'Create Secure Account'}
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </form>
        </div>

        {/* Footer Links */}
        <footer className="text-on-surface-variant/60 text-center text-[11px] leading-relaxed">
          By accessing the Vault, you agree to our
          <button className="text-primary mx-1 hover:underline">
            Security Protocol
          </button>{' '}
          and
          <button className="text-primary mx-1 hover:underline">
            Data Mandates
          </button>
          .
        </footer>
      </motion.div>
    </section>
  )
}

export default AuthMain
