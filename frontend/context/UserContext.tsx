'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { me } from '@/services/auth/authService'
import type { UserInfo } from '@/models/types'

interface UserContextValue {
  user: UserInfo | null
  loading: boolean
  refreshUser: () => Promise<void>
  clearUser: () => void
}

const UserContext = createContext<UserContextValue | undefined>(undefined)
const STORAGE_KEY = 'nexus_user_info'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(() => {
    if (typeof window === 'undefined') return null
    const cached = localStorage.getItem(STORAGE_KEY)
    if (!cached) return null
    try {
      return JSON.parse(cached) as UserInfo
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
  })
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    setLoading(true)
    const response = await me()
    if (response.status === 'success' && response.data) {
      setUser(response.data)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data))
    } else {
      setUser(null)
      localStorage.removeItem(STORAGE_KEY)
    }
    setLoading(false)
  }, [])

  const clearUser = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refreshUser()
  }, [refreshUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshUser,
      clearUser,
    }),
    [user, loading, refreshUser, clearUser]
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}

export function useUser() {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within UserProvider')
  }
  return context
}
