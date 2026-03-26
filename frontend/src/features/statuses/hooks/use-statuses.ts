import { useQuery } from '@tanstack/react-query'
import { statusKeys } from '../queryKeys'
import { getStatuses } from '../../../services/statuses'
import type { Status } from '../../../types/status'
import type { ApiError } from '../../../types/api'

interface UseStatusesResult {
  statuses: Status[]
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useStatuses(): UseStatusesResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: statusKeys.all,
    queryFn: getStatuses,
    staleTime: 1000 * 60 * 30,
  })

  return {
    statuses: data ?? [],
    isLoading,
    isError,
    error: isError ? (error as unknown as ApiError) : null,
  }
}
