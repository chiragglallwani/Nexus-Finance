'use client'

import { useState } from 'react'
import { ChevronDown, UserRound } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Logo from './logo'
import { Button } from '@/components/ui/button'
import { logout } from '@/services/auth/authService'
import { useUser } from '@/context/UserContext'
import { SidebarTrigger } from '@/components/ui/sidebar'

export default function AppHeader() {
  const router = useRouter()
  const { clearUser } = useUser()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    clearUser()
    router.replace('/auth')
  }

  return (
    <header className="border-outline-variant/20 flex h-16 items-center justify-between border-b bg-slate-950/60 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger />
        <Logo
          logoClassName="w-8 h-8"
          textClassName="text-xl"
          classNames="text-xl"
        />
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="bg-surface-container-low hover:bg-surface-container-high flex items-center gap-2 rounded-lg px-3 py-2 transition-colors"
        >
          <UserRound size={16} />
          <span className="hidden text-sm font-medium sm:inline">Profile</span>
          <ChevronDown size={14} />
        </button>

        {open && (
          <div className="border-outline-variant/20 bg-surface-bright absolute right-0 z-50 mt-2 w-44 rounded-lg border p-1 shadow-[0_20px_40px_rgba(12,19,36,0.12)]">
            <button
              type="button"
              className="hover:bg-surface-container-low w-full rounded-md px-3 py-2 text-left text-sm"
              onClick={() => {
                setOpen(false)
                router.push('/profile')
              }}
            >
              Profile
            </button>
            <Button
              type="button"
              variant="ghost"
              className="hover:bg-surface-container-low w-full justify-start rounded-md px-3 py-2 text-sm"
              disabled={loggingOut}
              onClick={handleLogout}
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
