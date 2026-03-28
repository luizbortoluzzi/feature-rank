import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { updateCategory, type UpdateCategoryPayload } from '../../../services/categories'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/use-notify'

interface UpdateCategoryArgs {
  id: number
  payload: UpdateCategoryPayload
}

interface UseUpdateCategoryResult {
  updateCategory: ReturnType<typeof useMutation<unknown, ApiError, UpdateCategoryArgs>>['mutate']
  isPending: boolean
  error: ApiError | null
}

export function useUpdateCategory(): UseUpdateCategoryResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ id, payload }: UpdateCategoryArgs) => updateCategory(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      notify.success('Category Successfully Updated!', 'Category changes have been saved.')
    },
    onError: (err: ApiError) => {
      notify.error('Category Update Failed', err)
    },
  })

  return {
    updateCategory: mutate,
    isPending,
    error: error ?? null,
  }
}
