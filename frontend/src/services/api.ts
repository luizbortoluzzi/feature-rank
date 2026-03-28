import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '../types/api'
import { clearAccessToken, getAccessToken, setAccessToken } from './auth-token'
import { redirectToLogin } from './navigation'

// Extend config type to track retry state
interface RetryConfig extends InternalAxiosRequestConfig {
  _retry?: boolean
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send refresh cookie on every request
})

// --- Token refresh queue ---
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

function drainQueue(token: string): void {
  refreshQueue.forEach((cb) => cb(token))
  refreshQueue = []
}

function abortQueue(): void {
  refreshQueue = []
}

// --- Interceptors ---
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined

    if (error.response?.status === 401 && originalRequest) {
      // No access token present = bootstrap/public call failing — just reject
      if (!getAccessToken() && !originalRequest._retry) {
        return Promise.reject(buildApiError(error))
      }

      // Already retried — give up, logout
      if (originalRequest._retry) {
        clearAccessToken()
        new BroadcastChannel('auth').postMessage({ type: 'logout' })
        redirectToLogin()
        return Promise.reject(buildApiError(error))
      }

      // Another refresh already in flight — queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push((newToken) => {
            if (!originalRequest.headers) {
              reject(buildApiError(error))
              return
            }
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      // First 401 — attempt refresh
      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post<{ access: string }>(
          `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'}/api/v1/auth/token/refresh/`,
          {},
          { withCredentials: true },
        )
        setAccessToken(data.access)
        drainQueue(data.access)
        isRefreshing = false
        originalRequest.headers.Authorization = `Bearer ${data.access}`
        return apiClient(originalRequest)
      } catch {
        isRefreshing = false
        abortQueue()
        clearAccessToken()
        new BroadcastChannel('auth').postMessage({ type: 'logout' })
        redirectToLogin()
        return Promise.reject(buildApiError(error))
      }
    }

    return Promise.reject(buildApiError(error))
  },
)

function buildApiError(error: AxiosError): ApiError {
  const data = error.response?.data as { error?: Omit<ApiError, 'status'> } | undefined
  return {
    ...(data?.error ?? {
      code: 'unknown_error',
      message: 'An unexpected error occurred.',
      details: null,
    }),
    status: error.response?.status,
  }
}
