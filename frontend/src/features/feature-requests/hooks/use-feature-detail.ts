import { useQuery } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { getFeatureById } from '../../../services/features'
import type { FeatureRequest } from '../../../types/feature'
import type { ApiError } from '../../../types/api'

interface UseFeatureDetailResult {
  feature: FeatureRequest | null
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useFeatureDetail(id: number): UseFeatureDetailResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: featureKeys.detail(id),
    queryFn: () => getFeatureById(id),
  })

  return {
    feature: data ?? null,
    isLoading,
    isError,
    error: isError ? error : null,
  }
}
