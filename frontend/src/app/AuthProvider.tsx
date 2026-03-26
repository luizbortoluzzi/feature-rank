import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { authKeys } from '../features/auth/queryKeys'
import { bootstrapAuth, getCurrentUser, logout as logoutFn } from '../services/auth'
import { clearAccessToken } from '../services/auth-token'
import type { AuthUser } from '../types/user'

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  logout: () => Promise<void>
  /** Call immediately after a successful login to activate the user session. */
  onLoginSuccess: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [hasToken, setHasToken] = useState(false)
  // Guard against React StrictMode double-firing the bootstrap effect.
  const bootstrapped = useRef(false)

  useEffect(() => {
    if (bootstrapped.current) return
    bootstrapped.current = true

    bootstrapAuth().then((token) => {
      setHasToken(!!token)
      setIsBootstrapping(false)
    })
  }, [])

  // Cross-tab logout sync
  useEffect(() => {
    const channel = new BroadcastChannel('auth')
    channel.onmessage = (event: MessageEvent<{ type: string }>) => {
      if (event.data.type === 'logout') {
        clearAccessToken()
        setHasToken(false)
        queryClient.clear()
      }
    }
    return () => channel.close()
  }, [queryClient])

  const { data: user = null, isLoading: isLoadingUser } = useQuery({
    queryKey: authKeys.me(),
    queryFn: getCurrentUser,
    enabled: !isBootstrapping && hasToken,
    retry: false,
  })

  function onLoginSuccess() {
    // Called by useLogin after credentials are validated and the access token
    // is stored in memory. Activates the /users/me/ query so ProtectedRoute
    // sees the user before attempting navigation.
    setHasToken(true)
  }

  async function logout() {
    await logoutFn()
    setHasToken(false)
    queryClient.clear()
  }

  const isLoading = isBootstrapping || (hasToken && isLoadingUser)

  return (
    <AuthContext.Provider value={{ user, isLoading, logout, onLoginSuccess }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCurrentUser(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useCurrentUser must be used within AuthProvider')
  return ctx
}
