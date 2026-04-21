'use client'

import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from 'lucide-react'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className={'toaster group'}
      richColors
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'cn-toast border border-outline-variant/30 text-on-surface shadow-[0_12px_30px_rgba(12,19,36,0.22)]',
        },
        style: {
          ['--success-bg' as string]: 'oklch(0.70 0.17 155)',
          ['--success-text' as string]: 'white',
          ['--success-border' as string]: 'oklch(0.62 0.16 155)',
          ['--error-bg' as string]: 'oklch(0.62 0.22 24)',
          ['--error-text' as string]: 'white',
          ['--error-border' as string]: 'oklch(0.55 0.20 24)',
          ['--warning-bg' as string]: 'oklch(0.78 0.16 86)',
          ['--warning-text' as string]: 'black',
          ['--warning-border' as string]: 'oklch(0.70 0.14 86)',
          ['--info-bg' as string]: 'oklch(0.62 0.14 240)',
          ['--info-text' as string]: 'white',
          ['--info-border' as string]: 'oklch(0.54 0.12 240)',
        } as React.CSSProperties,
      }}
      {...props}
    />
  )
}

export { Toaster }
