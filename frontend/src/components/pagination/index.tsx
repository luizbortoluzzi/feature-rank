import { Pagination as MantinePagination } from '@mantine/core'
import type { PaginationMeta } from '../../types/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.total_pages <= 1) return null

  return (
    <MantinePagination
      total={meta.total_pages}
      value={meta.page}
      onChange={onPageChange}
      size="sm"
      radius="md"
      aria-label="Pagination"
    />
  )
}
