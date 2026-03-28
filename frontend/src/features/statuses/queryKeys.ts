import type { StatusListParams } from '../../services/statuses'

export const statusKeys = {
  all: ['statuses'] as const,
  list: (params: StatusListParams) => ['statuses', 'list', params] as const,
  detail: (id: number) => ['statuses', 'detail', id] as const,
}
