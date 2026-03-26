import { type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useCurrentUser } from './AuthProvider'

interface ProtectedRouteProps {
  children: ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useCurrentUser()

  if (isLoading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
