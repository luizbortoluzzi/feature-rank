import { useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { getCategoryList, type CategoryListParams } from '../../../services/categories'
import type { CategoryListItem } from '../../../types/category'
import type { PaginationMeta, ApiError } from '../../../types/api'

interface UseCategoryListResult {
  categories: CategoryListItem[]
  meta: PaginationMeta | null
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useCategoryList(params?: CategoryListParams): UseCategoryListResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategoryList(params),
  })

  return {
    categories: data?.items ?? [],
    meta: data?.meta ?? null,
    isLoading,
    isError,
    error: isError ? (error as unknown as ApiError) : null,
  }
}
