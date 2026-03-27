import { useQuery } from '@tanstack/react-query'
import { featureKeys } from '../queryKeys'
import { getFeatureList, type FeatureListParams } from '../../../services/features'
import type { FeatureRequestSummary } from '../../../types/feature'
import type { PaginationMeta, ApiError } from '../../../types/api'

interface UseFeatureListResult {
  features: FeatureRequestSummary[]
  meta: PaginationMeta | null
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useFeatureList(params: FeatureListParams): UseFeatureListResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: featureKeys.list(params),
    queryFn: () => getFeatureList(params),
  })

  return {
    features: data?.items ?? [],
    meta: data?.meta ?? null,
    isLoading,
    isError,
    error: isError ? error : null,
  }
}
