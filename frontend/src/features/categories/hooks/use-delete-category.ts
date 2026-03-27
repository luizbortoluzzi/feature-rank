import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { deleteCategory } from '../../../services/categories'
import type { ApiError } from '../../../types/api'
import { useNotify } from '../../../hooks/useNotify'

interface UseDeleteCategoryResult {
  deleteCategory: ReturnType<typeof useMutation<void, unknown, number>>['mutate']
  isPending: boolean
}

export function useDeleteCategory(): UseDeleteCategoryResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
      notify.success('Category deleted.')
    },
    onError: (err: unknown) => {
      notify.error('Failed to delete category', err as ApiError)
    },
  })

  return {
    deleteCategory: mutate,
    isPending,
  }
}
