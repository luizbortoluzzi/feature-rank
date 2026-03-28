import { notifications } from '@mantine/notifications'
import type { ApiError } from '../types/api'

export function useNotify() {
  function success(title: string, message?: string) {
    notifications.show({
      title,
      message,
      color: 'green',
      autoClose: 3000,
      withBorder: true,
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-green-0)',
          borderColor: 'var(--mantine-color-green-3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        },
        title: {
          color: 'var(--mantine-color-gray-9)',
          fontWeight: '600',
        },
        description: {
          color: 'var(--mantine-color-gray-6)',
        },
      },
    })
  }

  function error(title: string, apiError?: ApiError | null) {
    notifications.show({
      title,
      message: apiError?.message ?? 'Something went wrong. Please try again.',
      color: 'red',
      autoClose: 5000,
      withBorder: true,
      styles: {
        root: {
          backgroundColor: 'var(--mantine-color-red-0)',
          borderColor: 'var(--mantine-color-red-3)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        },
        title: {
          color: 'var(--mantine-color-gray-9)',
          fontWeight: '600',
        },
        description: {
          color: 'var(--mantine-color-gray-6)',
        },
      },
    })
  }

  return { success, error }
}
