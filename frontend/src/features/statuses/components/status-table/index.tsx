import { Table, Group, Text, ActionIcon, Switch, Box } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { DataTable, type DataTableColumn } from '../../../../components/data-table'
import type { Status } from '../../../../types/status'
import type { PaginationMeta } from '../../../../types/api'

interface StatusTableProps {
  statuses: Status[]
  onEdit: (status: Status) => void
  onDelete: (status: Status) => void
  onToggleActive: (status: Status) => void
  deletingId: number | null
  togglingId: number | null
  meta?: PaginationMeta | null
  onPageChange?: (page: number) => void
}

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Status Name' },
  { key: 'color', label: 'Color' },
  { key: 'description', label: 'Description' },
  { key: 'usage_count', label: 'Usage Count' },
  { key: 'active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

export function StatusTable({
  statuses,
  onEdit,
  onDelete,
  onToggleActive,
  deletingId,
  togglingId,
  meta,
  onPageChange,
}: StatusTableProps) {
  return (
    <DataTable columns={COLUMNS} meta={meta} onPageChange={onPageChange} itemLabel="statuses">
      {statuses.map((status) => (
        <Table.Tr key={status.id}>
          <Table.Td>
            <Group gap="xs">
              <Box
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: status.color,
                  flexShrink: 0,
                }}
              />
              <Text size="sm" fw={500}>
                {status.name}
              </Text>
            </Group>
          </Table.Td>

          <Table.Td>
            <Group gap="xs">
              <Box
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 4,
                  backgroundColor: status.color,
                  border: '1px solid rgba(0,0,0,0.1)',
                  flexShrink: 0,
                }}
              />
              <Text size="sm" ff="monospace" c="dimmed">
                {status.color}
              </Text>
            </Group>
          </Table.Td>

          <Table.Td>
            <Text size="sm" c={status.description ? undefined : 'dimmed'}>
              {status.description || '—'}
            </Text>
          </Table.Td>

          <Table.Td>
            <Group gap={4} align="baseline">
              <Text size="sm" fw={600}>
                {status.usage_count}
              </Text>
              <Text size="xs" c="dimmed">
                features
              </Text>
            </Group>
          </Table.Td>

          <Table.Td>
            <Switch
              checked={status.is_active}
              onChange={() => onToggleActive(status)}
              disabled={togglingId === status.id}
              color="indigo"
              aria-label={`Toggle active state for ${status.name}`}
            />
          </Table.Td>

          <Table.Td>
            <Group gap="xs">
              <ActionIcon
                variant="subtle"
                color="gray"
                size="md"
                onClick={() => onEdit(status)}
                aria-label={`Edit ${status.name}`}
              >
                <IconPencil size={16} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="md"
                onClick={() => onDelete(status)}
                loading={deletingId === status.id}
                aria-label={`Delete ${status.name}`}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Table.Td>
        </Table.Tr>
      ))}
    </DataTable>
  )
}
