'use client'

import * as React from 'react'
import { PanelLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type SidebarContextValue = {
  open: boolean
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within SidebarProvider')
  }
  return context
}

export function SidebarProvider({
  children,
  defaultOpen = true,
}: {
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = React.useState(defaultOpen)
  const toggleSidebar = React.useCallback(() => setOpen((prev) => !prev), [])

  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar }}>
      <div className="min-h-screen w-full">{children}</div>
    </SidebarContext.Provider>
  )
}

export function Sidebar({
  className,
  children,
}: React.HTMLAttributes<HTMLElement>) {
  const { open, setOpen } = useSidebar()

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar backdrop"
          className="bg-muted/40 fixed inset-0 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          'border-outline-variant/20 fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] w-60 border-r bg-slate-900/40 p-4 transition-transform duration-200 md:static md:z-auto md:h-[calc(100vh-4rem)]',
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
          className
        )}
      >
        {children}
      </aside>
    </>
  )
}

export function SidebarTrigger({ className }: { className?: string }) {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('md:hidden', className)}
      onClick={toggleSidebar}
      aria-label="Toggle sidebar"
    >
      <PanelLeft className="h-5 w-5" />
    </Button>
  )
}

export function SidebarInset({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 p-4 md:p-6', className)}>{children}</div>
}

export function SidebarHeader({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)}>{children}</div>
}

export function SidebarContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-2', className)}>{children}</div>
}

export function SidebarGroup({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)}>{children}</div>
}

export function SidebarGroupLabel({
  className,
  children,
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-muted-foreground px-2 py-1 text-xs tracking-wide uppercase',
        className
      )}
    >
      {children}
    </p>
  )
}

export function SidebarGroupContent({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-1', className)}>{children}</div>
}

export function SidebarMenu({
  className,
  children,
}: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn('space-y-1', className)}>{children}</ul>
}

export function SidebarMenuItem({
  className,
  children,
}: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)}>{children}</li>
}

export function SidebarMenuButton({
  className,
  isActive = false,
  children,
}: React.HTMLAttributes<HTMLDivElement> & { isActive?: boolean }) {
  return (
    <div
      className={cn(
        'w-full rounded-lg px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-foreground hover:bg-surface-container-high',
        className
      )}
    >
      {children}
    </div>
  )
}
