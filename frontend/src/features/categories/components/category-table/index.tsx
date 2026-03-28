import { ActionIcon, Badge, Box, Group, Paper, Stack, Table, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { type DataTableColumn } from '../../../../components/data-table'
import { ResponsiveTable } from '../../../../components/responsive-table'
import { formatDate } from '../../../../utils/formatDate'
import type { PaginationMeta } from '../../../../types/api'
import type { CategoryListItem } from '../../../../types/category'
import { CategoryIcon } from '../category-icon'

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Category' },
  { key: 'features', label: 'Features' },
  { key: 'status', label: 'Status' },
  { key: 'created', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const COLUMNS_NO_ACTIONS: DataTableColumn[] = COLUMNS.slice(0, -1)

interface CategoryTableProps {
  categories: CategoryListItem[]
  onEdit: (category: CategoryListItem) => void
  onDelete: (category: CategoryListItem) => void
  isAdmin: boolean
  meta?: PaginationMeta | null
  onPageChange?: (page: number) => void
}

function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge size="lg" variant="light" color={isActive ? 'green' : 'gray'} radius="sm">
      {isActive ? 'Active' : 'Inactive'}
    </Badge>
  )
}

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  isAdmin,
  meta,
  onPageChange,
}: CategoryTableProps) {
  const mobileCards = categories.map((category) => (
    <Paper key={category.id} p="md" radius="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between" wrap="nowrap" align="flex-start">
          <Group gap="sm" wrap="nowrap">
            <CategoryIcon icon={category.icon} color={category.color} />
            <Box>
              <Text fw={600} fz="sm">
                {category.name}
              </Text>
              <Text fz="xs" c="dimmed">
                {category.feature_count} requests
              </Text>
            </Box>
          </Group>
          <ActiveBadge isActive={category.is_active} />
        </Group>

        {category.description && (
          <Text fz="xs" c="dimmed" lineClamp={2}>
            {category.description}
          </Text>
        )}

        {isAdmin && (
          <Group justify="flex-end" gap={4} mt={4}>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="md"
              aria-label={`Edit ${category.name}`}
              onClick={() => onEdit(category)}
            >
              <IconPencil size={16} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="md"
              aria-label={`Delete ${category.name}`}
              onClick={() => onDelete(category)}
            >
              <IconTrash size={16} />
            </ActionIcon>
          </Group>
        )}
      </Stack>
    </Paper>
  ))

  const desktopRows = categories.map((category) => (
    <Table.Tr key={category.id}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <CategoryIcon icon={category.icon} color={category.color} />
          <Box>
            <Text fw={600} fz="sm" lh={1.3}>
              {category.name}
            </Text>
            {category.description ? (
              <Text fz="xs" c="dimmed" lineClamp={1} lh={1.4}>
                {category.description}
              </Text>
            ) : (
              <Text fz="xs" c="dimmed" fs="italic" lh={1.4}>
                No description
              </Text>
            )}
          </Box>
        </Group>
      </Table.Td>

      <Table.Td>
        <Text fw={600} fz="sm" lh={1.2}>
          {category.feature_count}
        </Text>
        <Text fz="xs" c="dimmed" lh={1.2}>
          requests
        </Text>
      </Table.Td>

      <Table.Td>
        <ActiveBadge isActive={category.is_active} />
      </Table.Td>

      <Table.Td>
        <Text fz="xs" c="dimmed">
          {formatDate(category.created_at)}
        </Text>
      </Table.Td>

      {isAdmin && (
        <Table.Td>
          <Group gap={6} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={`Edit ${category.name}`}
              onClick={() => onEdit(category)}
            >
              <IconPencil size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              aria-label={`Delete ${category.name}`}
              onClick={() => onDelete(category)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  ))

  return (
    <ResponsiveTable
      columns={isAdmin ? COLUMNS : COLUMNS_NO_ACTIONS}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="categories"
      mobileCards={mobileCards}
      desktopRows={desktopRows}
    />
  )
}
