import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { deleteStatus } from '../../../services/statuses'
import type { ApiError } from '../../../types/api'

interface UseDeleteStatusResult {
  deleteStatus: ReturnType<typeof useMutation<void, ApiError, number>>['mutate']
  isPending: boolean
  deletingId: number | null
  isError: boolean
  error: ApiError | null
}

export function useDeleteStatus(): UseDeleteStatusResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => deleteStatus(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all })
      queryClient.removeQueries({ queryKey: statusKeys.detail(id) })
    },
  })

  return {
    deleteStatus: mutation.mutate,
    isPending: mutation.isPending,
    deletingId: mutation.isPending ? mutation.variables : null,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
  }
}
