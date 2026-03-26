import { Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { ApiError } from '../../types/api'

interface ErrorMessageProps {
  error: ApiError | Error | null
  fallback?: string
}

function getDisplayMessage(error: ApiError | Error | null, fallback: string): string {
  if (!error) return fallback
  if ('code' in error) {
    const apiError = error as ApiError
    if (apiError.status === 403) return 'You do not have permission to perform this action.'
    if (apiError.status === 404) return 'The requested resource could not be found.'
    if (apiError.status === 500) return 'Something went wrong. Please try again later.'
    return apiError.message
  }
  return fallback
}

export function ErrorMessage({ error, fallback = 'Something went wrong. Please try again later.' }: ErrorMessageProps) {
  const message = getDisplayMessage(error, fallback)

  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      color="red"
      variant="light"
      radius="md"
      role="alert"
    >
      {message}
    </Alert>
  )
}
