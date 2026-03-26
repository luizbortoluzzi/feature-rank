import axios, { type AxiosError } from 'axios'
import type { ApiError } from '../types/api'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const data = error.response?.data as { error?: ApiError } | undefined
    const apiError: ApiError = data?.error ?? {
      code: 'unknown_error',
      message: 'An unexpected error occurred.',
      details: null,
    }
    return Promise.reject(apiError)
  },
)
