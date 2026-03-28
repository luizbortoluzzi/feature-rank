import { useEffect } from 'react'
import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

interface ErrorWithDetails {
  details?: Record<string, string[]> | null
}

export function useServerFieldErrors<T extends FieldValues>(
  submitError: ErrorWithDetails | null,
  setError: UseFormSetError<T>,
): void {
  useEffect(() => {
    if (submitError?.details) {
      Object.entries(submitError.details).forEach(([field, messages]) => {
        setError(field as Path<T>, { message: messages[0] })
      })
    }
  }, [submitError, setError])
}
