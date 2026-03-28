import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { deleteFeature } from '../../../services/features'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/use-notify'

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
      notify.success(
        'Feature Request Successfully Deleted!',
        'The feature request has been removed.',
      )
    },
    onError: (err: ApiError) => {
      notify.error('Feature Request Delete Failed', err)
    },
  })

  return {
    deleteFeature: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
  }
}
