import { type ReactNode } from 'react'
import { Table, Box, Group, Text } from '@mantine/core'
import { Pagination } from '../pagination'
import type { PaginationMeta } from '../../types/api'

export interface DataTableColumn {
  key: string
  label: string
}

interface DataTableProps {
  columns: DataTableColumn[]
  children: ReactNode
  meta?: PaginationMeta | null
  onPageChange?: (page: number) => void
  itemLabel?: string
}

export function DataTable({
  columns,
  children,
  meta,
  onPageChange,
  itemLabel = 'items',
}: DataTableProps) {
  const startItem = meta ? (meta.page - 1) * meta.limit + 1 : 0
  const endItem = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  return (
    <Box
      style={{
        border: '1px solid var(--mantine-color-gray-3)',
        borderRadius: 'var(--mantine-radius-md)',
        overflow: 'hidden',
        backgroundColor: 'var(--mantine-color-body)',
        boxShadow: 'var(--mantine-shadow-sm)',
      }}
    >
      <Table highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {columns.map((col) => (
              <Table.Th key={col.key}>
                <Text fz="xs" fw={600} tt="uppercase" c="dimmed">
                  {col.label}
                </Text>
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{children}</Table.Tbody>
      </Table>

      {meta && onPageChange && (
        <Box px="md" py="sm" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
          <Group justify="space-between" align="center">
            <Text fz="sm" c="dimmed">
              Showing {startItem}–{endItem} of {meta.total} {itemLabel}
            </Text>
            <Pagination meta={meta} onPageChange={onPageChange} />
          </Group>
        </Box>
      )}
    </Box>
  )
}
