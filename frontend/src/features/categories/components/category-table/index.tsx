import { ActionIcon, Badge, Box, Group, Paper, Stack, Table, Text } from '@mantine/core'
import { IconPencil, IconTrash } from '@tabler/icons-react'
import { DataTable, type DataTableColumn } from '../../../../components/data-table'
import { Pagination } from '../../../../components/pagination'
import { useIsMobile } from '../../../../hooks/use-is-mobile'
import { formatDate } from '../../../../utils/formatDate'
import type { PaginationMeta } from '../../../../types/api'
import type { CategoryListItem } from '../../../../types/category'
import { CategoryIcon } from '../category-icon'

const COLUMNS: DataTableColumn[] = [
  { key: 'name', label: 'Category Name' },
  { key: 'description', label: 'Description' },
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
    <Badge
      leftSection={
        <span
          style={{
            display: 'inline-block',
            width: 7,
            height: 7,
            borderRadius: '50%',
            backgroundColor: isActive ? '#2f9e44' : '#868e96',
          }}
        />
      }
      size="md"
      variant="light"
      radius="sm"
      style={{
        backgroundColor: isActive ? '#2f9e4418' : '#868e9618',
        color: isActive ? '#2f9e44' : '#868e96',
        textTransform: 'none',
        fontWeight: 500,
      }}
    >
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
  const isMobile = useIsMobile()

  if (isMobile) {
    return (
      <Stack gap="sm">
        {categories.map((category) => (
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
        ))}
        {meta && meta.total_pages > 1 && onPageChange && (
          <Group justify="center">
            <Pagination meta={meta} onPageChange={onPageChange} />
          </Group>
        )}
      </Stack>
    )
  }

  return (
    <DataTable
      columns={isAdmin ? COLUMNS : COLUMNS_NO_ACTIONS}
      meta={meta}
      onPageChange={onPageChange}
      itemLabel="categories"
    >
      {categories.map((category) => (
        <Table.Tr key={category.id}>
          <Table.Td>
            <Group gap="sm" wrap="nowrap">
              <CategoryIcon icon={category.icon} color={category.color} />
              <Text fw={500} fz="sm">
                {category.name}
              </Text>
            </Group>
          </Table.Td>

          <Table.Td>
            <Text fz="sm" c="dimmed" lineClamp={2}>
              {category.description || '—'}
            </Text>
          </Table.Td>

          <Table.Td>
            <Group gap={4} wrap="nowrap">
              <Text fw={500} fz="sm">
                {category.feature_count}
              </Text>
              <Text fz="sm" c="dimmed">
                requests
              </Text>
            </Group>
          </Table.Td>

          <Table.Td>
            <ActiveBadge isActive={category.is_active} />
          </Table.Td>

          <Table.Td>
            <Text fz="sm" c="dimmed">
              {formatDate(category.created_at)}
            </Text>
          </Table.Td>

          {isAdmin && (
            <Table.Td>
              <Group gap={4} wrap="nowrap">
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
      ))}
    </DataTable>
  )
}
