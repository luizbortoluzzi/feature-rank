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
          borderColor: 'var(--mantine-color-green-4)',
        },
        title: { color: 'var(--mantine-color-green-8)' },
        description: { color: 'var(--mantine-color-green-7)' },
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
          borderColor: 'var(--mantine-color-red-4)',
        },
        title: { color: 'var(--mantine-color-red-8)' },
        description: { color: 'var(--mantine-color-red-7)' },
      },
    })
  }

  return { success, error }
}
