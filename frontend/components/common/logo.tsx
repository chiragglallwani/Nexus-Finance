'use client'
import { Wallet } from 'lucide-react'
import { cn } from '@/lib/utils'

const Logo = ({
  logoClassName,
  textClassName,
  classNames,
}: {
  logoClassName?: string
  textClassName?: string
  classNames?: string
}) => (
  <div className={cn('flex items-center gap-3', classNames)}>
    <div
      className={cn(
        'bg-primary shadow-primary/20 flex h-12 w-12 items-center justify-center rounded-lg shadow-lg',
        logoClassName
      )}
    >
      <Wallet className="text-on-primary fill-on-primary/20 h-7 w-7" />
    </div>
    <span
      className={cn(
        'text-on-surface text-3xl font-bold tracking-tighter',
        textClassName
      )}
    >
      Nexus Finance
    </span>
  </div>
)

export default Logo
