import { Table, Group, Stack, Paper, Text, ActionIcon, Switch, Box } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { type DataTableColumn } from '../../../../components/data-table'
import { ResponsiveTable } from '../../../../components/responsive-table'
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
  const mobileCards = statuses.map((status) => (
    <Paper key={status.id} p="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="center">
          <Group gap="sm" wrap="nowrap">
            <Box
              style={{
                width: 32,
                height: 32,
                borderRadius: 6,
                backgroundColor: status.color,
                border: '1px solid var(--mantine-color-gray-2)',
                flexShrink: 0,
              }}
            />
            <Box>
              <Text fw={600} fz="sm">
                {status.name}
              </Text>
              <Text fz="xs" ff="monospace" c="dimmed">
                {status.color}
              </Text>
            </Box>
          </Group>
          <Switch
            checked={status.is_active}
            onChange={() => onToggleActive(status)}
            disabled={togglingId === status.id}
            color="indigo"
            aria-label={`Toggle active state for ${status.name}`}
          />
        </Group>

        {status.description && (
          <Text fz="xs" c="dimmed" lineClamp={2}>
            {status.description}
          </Text>
        )}

        <Group justify="space-between" align="center" mt={4}>
          <Text fz="xs" c="dimmed">
            <Text span fw={600} c="dark" fz="xs">
              {status.usage_count}
            </Text>{' '}
            features
          </Text>
          <Group gap={4}>
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
        </Group>
      </Stack>
    </Paper>
  ))

  const desktopRows = statuses.map((status) => (
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
              border: '1px solid var(--mantine-color-gray-2)',
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
            size="lg"
            onClick={() => onEdit(status)}
            aria-label={`Edit ${status.name}`}
          >
            <IconPencil size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            size="lg"
            onClick={() => onDelete(status)}
            loading={deletingId === status.id}
            aria-label={`Delete ${status.name}`}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ))

  return (
    <ResponsiveTable
      columns={COLUMNS}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="statuses"
      mobileCards={mobileCards}
      desktopRows={desktopRows}
    />
  )
}
