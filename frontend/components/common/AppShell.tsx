'use client'

import { usePathname } from 'next/navigation'
import AppHeader from './AppHeader'
import AppSidebar from './AppSidebar'
import { useUser } from '@/context/UserContext'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user, loading } = useUser()

  if (pathname.startsWith('/auth')) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="text-muted-foreground grid min-h-screen place-items-center">
        Loading...
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen>
      <div className="bg-background min-h-screen">
        <AppHeader />
        <div className="flex">
          <AppSidebar user={user} />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  )
}
