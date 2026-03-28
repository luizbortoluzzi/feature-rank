import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { createFeature, type CreateFeaturePayload } from '../../../services/features'
import type { FeatureRequest } from '../../../types/feature'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/use-notify'

interface UseCreateFeatureResult {
  createFeature: ReturnType<
    typeof useMutation<FeatureRequest, ApiError, CreateFeaturePayload>
  >['mutate']
  isPending: boolean
  isError: boolean
  error: ApiError | null
  data: FeatureRequest | undefined
}

export function useCreateFeature(): UseCreateFeatureResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const mutation = useMutation({
    mutationFn: (payload: CreateFeaturePayload) => createFeature(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: featureKeys.all })
      notify.success('Feature request submitted!', 'Your request has been added to the board.')
    },
    onError: (err: ApiError) => {
      notify.error('Failed to submit feature request', err)
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
