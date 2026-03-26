import { Group, Text, Pagination as MantinePagination } from '@mantine/core'
import type { PaginationMeta } from '../../types/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
}

export function Pagination({ meta, onPageChange }: PaginationProps) {
  if (meta.total_pages <= 1) return null

  return (
    <Group justify="space-between" py="md">
      <Text size="sm" c="dimmed">
        Page {meta.page} of {meta.total_pages} ({meta.total} total)
      </Text>
      <MantinePagination
        total={meta.total_pages}
        value={meta.page}
        onChange={onPageChange}
        size="sm"
        radius="md"
        aria-label="Pagination"
      />
    </Group>
  )
}
