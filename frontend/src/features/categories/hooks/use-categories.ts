import { useQuery } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { getCategories } from '../../../services/categories'
import type { Category } from '../../../types/category'
import type { ApiError } from '../../../types/api'

interface UseCategoriesResult {
  categories: Category[]
  isLoading: boolean
  isError: boolean
  error: ApiError | null
}

export function useCategories(): UseCategoriesResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: categoryKeys.all,
    queryFn: getCategories,
    staleTime: 1000 * 60 * 30,
  })

  return {
    categories: data ?? [],
    isLoading,
    isError,
    error: isError ? (error as unknown as ApiError) : null,
  }
}
