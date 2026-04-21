import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { UserProvider } from '@/context/UserContext'
import AppShell from '@/components/common/AppShell'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'Nexus Finance',
  description: 'Your financial command center',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={cn('dark h-full', 'antialiased', 'font-sans', inter.variable)}
    >
      <body className="flex min-h-full flex-col">
        <UserProvider>
          <AppShell>{children}</AppShell>
        </UserProvider>
        <Toaster />
      </body>
    </html>
  )
}
