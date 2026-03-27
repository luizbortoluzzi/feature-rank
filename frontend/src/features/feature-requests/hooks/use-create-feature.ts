import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { createFeature, type CreateFeaturePayload } from '../../../services/features'
import type { FeatureRequest } from '../../../types/feature'
import type { ApiError } from '../../../types/api'

interface UseCreateFeatureResult {
  createFeature: ReturnType<typeof useMutation<FeatureRequest, ApiError, CreateFeaturePayload>>['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
  data: FeatureRequest | undefined
}

export function useCreateFeature(): UseCreateFeatureResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: CreateFeaturePayload) => createFeature(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
    },
  })

  return {
    createFeature: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
    data: mutation.data,
  }
}
