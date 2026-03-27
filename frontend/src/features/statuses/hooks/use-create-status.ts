import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { createStatus, type CreateStatusPayload } from '../../../services/statuses'
import type { Status } from '../../../types/status'
import type { ApiError } from '../../../types/api'

interface UseCreateStatusResult {
  createStatus: ReturnType<typeof useMutation<Status, ApiError, CreateStatusPayload>>['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
  data: Status | undefined
}

export function useCreateStatus(): UseCreateStatusResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: CreateStatusPayload) => createStatus(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all })
    },
  })

  return {
    createStatus: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
    data: mutation.data,
  }
}
