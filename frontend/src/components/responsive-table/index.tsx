import { type ReactNode } from 'react'
import { Group, Stack } from '@mantine/core'
import { useIsMobile } from '../../hooks/use-is-mobile'
import { DataTable, type DataTableColumn } from '../data-table'
import { Pagination } from '../pagination'
import type { PaginationMeta } from '../../types/api'

interface ResponsiveTableProps {
  columns: DataTableColumn[]
  meta?: PaginationMeta | null
  onPageChange?: (page: number) => void
  itemLabel?: string
  desktopRows: ReactNode
  mobileCards: ReactNode
}

export function ResponsiveTable({
  columns,
  meta,
  onPageChange,
  itemLabel,
  desktopRows,
  mobileCards,
}: ResponsiveTableProps) {
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Stack gap="sm">
        {mobileCards}
        {meta && meta.total_pages > 1 && onPageChange && (
          <Group justify="center">
            <Pagination meta={meta} onPageChange={onPageChange} />
          </Group>
        )}
      </Stack>
    )
  }

  return (
    <DataTable columns={columns} meta={meta} onPageChange={onPageChange} itemLabel={itemLabel}>
      {desktopRows}
    </DataTable>
  )
}
