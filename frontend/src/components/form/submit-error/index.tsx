import { Alert } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import type { ApiError } from '../../../types/api'

interface FormSubmitErrorProps {
  error: ApiError | { message: string; details?: Record<string, string[]> | null } | null
  title?: string
}

export function FormSubmitError({
  error,
  title = "Couldn't complete your request",
}: FormSubmitErrorProps) {
  if (!error || error.details) return null

  return (
    <Alert
      color="red"
      variant="light"
      radius="xl"
      icon={<IconAlertCircle size={18} />}
      title={title}
      role="alert"
    >
      {error.message}
    </Alert>
  )
}
