import { Group, Select, Button } from '@mantine/core'
import type { Category } from '../../../../types/category'
import type { Status } from '../../../../types/status'

interface FeatureListFiltersProps {
  categories: Category[]
  statuses: Status[]
  selectedCategoryId: number | undefined
  selectedStatusId: number | undefined
  isLoadingCategories: boolean
  isLoadingStatuses: boolean
  onCategoryChange: (categoryId: number | undefined) => void
  onStatusChange: (statusId: number | undefined) => void
  onClearFilters: () => void
}

export function FeatureListFilters({
  categories,
  statuses,
  selectedCategoryId,
  selectedStatusId,
  isLoadingCategories,
  isLoadingStatuses,
  onCategoryChange,
  onStatusChange,
  onClearFilters,
}: FeatureListFiltersProps) {
  const hasActiveFilters = selectedCategoryId !== undefined || selectedStatusId !== undefined
  const categoryData = [
    { value: '', label: 'All categories' },
    ...categories.map((c) => ({ value: String(c.id), label: c.name })),
  ]
  const statusData = [
    { value: '', label: 'All statuses' },
    ...statuses.map((s) => ({ value: String(s.id), label: s.name })),
  ]

  return (
    <Group gap="sm" mb="md" wrap="wrap">
      <Select
        placeholder="All categories"
        data={categoryData}
        value={selectedCategoryId !== undefined ? String(selectedCategoryId) : ''}
        onChange={(val) =>
          onCategoryChange(val && val !== '' ? Number(val) : undefined)
        }
        disabled={isLoadingCategories}
        radius="md"
        size="sm"
        style={{ minWidth: 160 }}
        clearable
      />
      <Select
        placeholder="All statuses"
        data={statusData}
        value={selectedStatusId !== undefined ? String(selectedStatusId) : ''}
        onChange={(val) =>
          onStatusChange(val && val !== '' ? Number(val) : undefined)
        }
        disabled={isLoadingStatuses}
        radius="md"
        size="sm"
        style={{ minWidth: 160 }}
        clearable
      />
      {hasActiveFilters && (
        <Button
          variant="subtle"
          color="gray"
          size="sm"
          radius="md"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      )}
    </Group>
  )
}
