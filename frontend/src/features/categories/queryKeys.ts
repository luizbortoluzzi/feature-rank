import type { CategoryListParams } from '../../services/categories'

export const categoryKeys = {
  all: ['categories'] as const,
  list: (params?: CategoryListParams) => ['categories', 'list', params] as const,
}
