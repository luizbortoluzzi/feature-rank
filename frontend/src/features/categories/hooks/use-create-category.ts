import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { createCategory, type CreateCategoryPayload } from '../../../services/categories'
import type { CategoryListItem } from '../../../types/category'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/use-notify'

interface UseCreateCategoryResult {
  createCategory: ReturnType<
    typeof useMutation<CategoryListItem, ApiError, CreateCategoryPayload>
  >['mutate']
  isPending: boolean
  error: ApiError | null
}

export function useCreateCategory(): UseCreateCategoryResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const { mutate, isPending, error } = useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: (_data: CategoryListItem) => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      notify.success('Category created!')
    },
    onError: (err: ApiError) => {
      notify.error('Failed to create category', err)
    },
  })

  return {
    createCategory: mutate,
    isPending,
    error: error ?? null,
  }
}
