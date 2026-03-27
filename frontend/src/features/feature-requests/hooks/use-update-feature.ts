import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { updateFeature, type UpdateFeaturePayload } from '../../../services/features'
import type { FeatureRequest } from '../../../types/feature'
import type { ApiError } from '../../../types/api'

interface UpdateFeatureMutationArgs {
  id: number
  payload: UpdateFeaturePayload
}

interface UseUpdateFeatureResult {
  updateFeature: ReturnType<typeof useMutation<FeatureRequest, ApiError, UpdateFeatureMutationArgs>>['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
  data: FeatureRequest | undefined
}

export function useUpdateFeature(): UseUpdateFeatureResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, payload }: UpdateFeatureMutationArgs) => updateFeature(id, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
      queryClient.invalidateQueries({ queryKey: featureKeys.detail(data.id) })
    },
  })

  return {
    updateFeature: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
    data: mutation.data,
  }
}
