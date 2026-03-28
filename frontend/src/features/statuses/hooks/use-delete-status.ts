import { useMutation, useQueryClient } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { deleteStatus } from '../../../services/statuses'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/use-notify'

interface UseDeleteStatusResult {
  deleteStatus: ReturnType<typeof useMutation<void, ApiError, number>>['mutate']
  isPending: boolean
  deletingId: number | null
  isError: boolean
  error: ApiError | null
}

export function useDeleteStatus(): UseDeleteStatusResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const mutation = useMutation({
    mutationFn: (id: number) => deleteStatus(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: statusKeys.all })
      queryClient.removeQueries({ queryKey: statusKeys.detail(id) })
      notify.success('Status deleted.')
    },
    onError: (err: ApiError) => {
      notify.error('Failed to delete status', err)
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
