import type { Category } from '../../../../types/category'
import type { Status } from '../../../../types/status'

interface FeatureListFiltersProps {
  categories: Category[]
  statuses: Status[]
  selectedCategoryId: number | undefined
  selectedStatusId: number | undefined
  onCategoryChange: (id: number | undefined) => void
  onStatusChange: (id: number | undefined) => void
  onClearFilters: () => void
  isLoadingCategories: boolean
  isLoadingStatuses: boolean
}

export function FeatureListFilters({
  categories,
  statuses,
  selectedCategoryId,
  selectedStatusId,
  onCategoryChange,
  onStatusChange,
  onClearFilters,
  isLoadingCategories,
  isLoadingStatuses,
}: FeatureListFiltersProps) {
  const hasActiveFilters = selectedCategoryId !== undefined || selectedStatusId !== undefined

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">
      <div>
        <label htmlFor="filter-category" className="sr-only">
          Filter by category
        </label>
        <select
          id="filter-category"
          value={selectedCategoryId ?? ''}
          onChange={(e) =>
            onCategoryChange(e.target.value !== '' ? Number(e.target.value) : undefined)
          }
          disabled={isLoadingCategories}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="filter-status" className="sr-only">
          Filter by status
        </label>
        <select
          id="filter-status"
          value={selectedStatusId ?? ''}
          onChange={(e) =>
            onStatusChange(e.target.value !== '' ? Number(e.target.value) : undefined)
          }
          disabled={isLoadingStatuses}
          className="text-sm border border-gray-200 rounded-md px-3 py-1.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
