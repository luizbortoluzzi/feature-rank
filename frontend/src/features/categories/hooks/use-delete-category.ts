import { useMutation, useQueryClient } from '@tanstack/react-query'
import { categoryKeys } from '../queryKeys'
import { deleteCategory } from '../../../services/categories'

interface UseDeleteCategoryResult {
  deleteCategory: ReturnType<typeof useMutation<void, unknown, number>>['mutate']
  isPending: boolean
}

export function useDeleteCategory(): UseDeleteCategoryResult {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })

  return {
    deleteCategory: mutate,
    isPending,
  }
}
