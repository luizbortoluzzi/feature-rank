import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { updateCategory, type UpdateCategoryPayload } from '../../../services/categories'
import type { ApiError } from '../../../types/api'

interface UpdateCategoryArgs {
  id: number
  payload: UpdateCategoryPayload
}

interface UseUpdateCategoryResult {
  updateCategory: ReturnType<typeof useMutation<unknown, unknown, UpdateCategoryArgs>>['mutate']
  isPending: boolean
  error: ApiError | null
}

export function useUpdateCategory(): UseUpdateCategoryResult {
  const queryClient = useQueryClient()

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryArgs) => updateCategory(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })

  return {
    updateCategory: mutate,
    isPending,
    error: error ? (error as unknown as ApiError) : null,
  }
}
