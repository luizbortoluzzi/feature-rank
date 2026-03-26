import { apiClient } from './api'
import type { AuthUser } from '../types/user'

export interface LoginPayload {
  username: string
  password: string
}

export interface TokenResponse {
  access: string
  refresh: string
}

export async function login(payload: LoginPayload): Promise<TokenResponse> {
  const response = await apiClient.post('/api/auth/token/', payload)
  return response.data
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get('/api/users/me/')
  return response.data.data
}
