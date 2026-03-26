import { apiClient } from './api'
import { clearAccessToken, setAccessToken } from './auth-token'
import type { AuthUser } from '../types/user'

export interface LoginPayload {
  username: string
  password: string
}

/**
 * Exchange credentials for tokens.
 * Backend returns access token in body; sets refresh cookie automatically.
 */
export async function login(payload: LoginPayload): Promise<void> {
  const response = await apiClient.post<{ access: string }>('/api/v1/auth/token/', payload)
  setAccessToken(response.data.access)
}

/**
 * Call on app start and after page reload.
 * Uses the HttpOnly refresh cookie to silently obtain a new access token.
 * Returns the access token on success, null if not authenticated.
 */
export async function bootstrapAuth(): Promise<string | null> {
  try {
    const response = await apiClient.post<{ access: string }>('/api/v1/auth/token/refresh/', {})
    setAccessToken(response.data.access)
    return response.data.access
  } catch {
    return null
  }
}

/**
 * Logout: tell backend to blacklist the refresh token + clear the cookie.
 * Clears in-memory access token regardless of backend response.
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/api/v1/auth/logout/')
  } finally {
    clearAccessToken()
    new BroadcastChannel('auth').postMessage({ type: 'logout' })
  }
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<{ data: AuthUser }>('/api/v1/users/me/')
  return response.data.data
}
