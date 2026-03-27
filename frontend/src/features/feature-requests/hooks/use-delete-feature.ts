import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { deleteFeature } from '../../../services/features'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/useNotify'

interface UseDeleteFeatureResult {
  deleteFeature: ReturnType<typeof useMutation<void, ApiError, number>>['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
}

export function useDeleteFeature(): UseDeleteFeatureResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const mutation = useMutation({
    mutationFn: (id: number) => deleteFeature(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
      queryClient.removeQueries({ queryKey: featureKeys.detail(id) })
      notify.success('Feature request deleted.')
    },
    onError: (err: ApiError) => {
      notify.error('Failed to delete feature request', err)
    },
  })

  return {
    deleteFeature: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
  }
}
