import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { deleteFeature } from '../../../services/features'
import type { ApiError } from '../../../types/api'

interface UseDeleteFeatureResult {
  deleteFeature: (id: number) => void
  isPending: boolean
  isError: boolean
  error: ApiError | null
}

export function useDeleteFeature(): UseDeleteFeatureResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: number) => deleteFeature(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
      queryClient.removeQueries({ queryKey: featureKeys.detail(id) })
    },
  })

  return {
    deleteFeature: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? (mutation.error as unknown as ApiError) : null,
  }
}
