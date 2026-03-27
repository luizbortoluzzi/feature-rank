import { Table, Group, Text, ActionIcon, Switch, Box } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import type { Status } from '../../../../types/status'

interface StatusTableProps {
  statuses: Status[]
  onEdit: (status: Status) => void
  onDelete: (status: Status) => void
  onToggleActive: (status: Status) => void
  deletingId: number | null
  togglingId: number | null
}

export function StatusTable({
  statuses,
  onEdit,
  onDelete,
  onToggleActive,
  deletingId,
  togglingId,
}: StatusTableProps) {
  return (
    <Table highlightOnHover withTableBorder withColumnBorders={false}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Status Name
          </Table.Th>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Color
          </Table.Th>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Description
          </Table.Th>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Usage Count
          </Table.Th>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Active
          </Table.Th>
          <Table.Th style={{ textTransform: 'uppercase', fontSize: 11, letterSpacing: '0.05em', color: '#6B7280' }}>
            Actions
          </Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {statuses.map((status) => (
          <Table.Tr key={status.id}>
            {/* STATUS NAME */}
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

            {/* COLOR */}
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

            {/* DESCRIPTION */}
            <Table.Td>
              <Text size="sm" c={status.description ? undefined : 'dimmed'}>
                {status.description || '—'}
              </Text>
            </Table.Td>

            {/* USAGE COUNT */}
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

            {/* ACTIVE */}
            <Table.Td>
              <Switch
                checked={status.is_active}
                onChange={() => onToggleActive(status)}
                disabled={togglingId === status.id}
                color="indigo"
                aria-label={`Toggle active state for ${status.name}`}
              />
            </Table.Td>

            {/* ACTIONS */}
            <Table.Td>
              <Group gap="xs">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  size="sm"
                  onClick={() => onEdit(status)}
                  aria-label={`Edit ${status.name}`}
                >
                  <IconPencil size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={() => onDelete(status)}
                  loading={deletingId === status.id}
                  aria-label={`Delete ${status.name}`}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}
