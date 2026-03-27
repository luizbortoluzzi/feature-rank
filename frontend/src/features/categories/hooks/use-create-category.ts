import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { createCategory, type CreateCategoryPayload } from '../../../services/categories'
import type { CategoryListItem } from '../../../types/category'
import type { ApiError } from '../../../types/api'

interface UseCreateCategoryResult {
  createCategory: ReturnType<typeof useMutation<CategoryListItem, ApiError, CreateCategoryPayload>>['mutate']
  isPending: boolean
  error: ApiError | null
}

export function useCreateCategory(): UseCreateCategoryResult {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: (_data: CategoryListItem) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })

  return {
    createCategory: mutate,
    isPending,
    error: error ?? null,
  }
}
