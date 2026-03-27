import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { updateStatus, type UpdateStatusPayload } from '../../../services/statuses'
import type { Status } from '../../../types/status'
import type { ApiError } from '../../../types/api'

interface UpdateStatusMutationArgs {
  id: number
  payload: UpdateStatusPayload
}

interface UseUpdateStatusResult {
  updateStatus: ReturnType<typeof useMutation<Status, ApiError, UpdateStatusMutationArgs>>['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
  data: Status | undefined
}

export function useUpdateStatus(): UseUpdateStatusResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, payload }: UpdateStatusMutationArgs) => updateStatus(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all })
      queryClient.invalidateQueries({ queryKey: statusKeys.detail(data.id) })
    },
  })

  return {
    updateStatus: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
    data: mutation.data,
  }
}
