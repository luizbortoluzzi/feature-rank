import { useQuery } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { getStatusList, type StatusListParams } from '../../../services/statuses'
import type { Status } from '../../../types/status'
import type { PaginationMeta, ApiError } from '../../../types/api'

interface UseStatusListResult {
  statuses: Status[]
  meta: PaginationMeta | null
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useStatusList(params: StatusListParams): UseStatusListResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: statusKeys.list(params),
    queryFn: () => getStatusList(params),
  })

  return {
    statuses: data?.items ?? [],
    meta: data?.meta ?? null,
    isLoading,
    isError,
    error: isError ? error : null,
  }
}
