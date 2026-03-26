import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { authKeys } from '../features/auth/queryKeys'
import { getCurrentUser } from '../services/auth'
import type { AuthUser } from '../types/user'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: user = null, isLoading } = useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    retry: false,
  })

  return <AuthContext.Provider value={{ user, isLoading }}>{children}</AuthContext.Provider>
}

export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useCurrentUser must be used within AuthProvider')
  }
  return ctx
}
