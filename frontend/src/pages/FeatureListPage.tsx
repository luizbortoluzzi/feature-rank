import { useState } from 'react'
import { Stack, Center } from '@mantine/core'
import { useCurrentUser } from '../app/AuthProvider'
import { useFeatureList } from '../features/feature-requests/hooks/use-feature-list'
import { useCastVote } from '../features/voting/hooks/use-cast-vote'
import { useRemoveVote } from '../features/voting/hooks/use-remove-vote'
import { useCategories } from '../features/categories/hooks/use-categories'
import { useStatuses } from '../features/statuses/hooks/use-statuses'
import { FeatureCard } from '../features/feature-requests/components/feature-card'
import { FeatureListFilters } from '../features/feature-requests/components/feature-list-filters'
import { Spinner } from '../components/spinner'
import { ErrorMessage } from '../components/error-message'
import { EmptyState } from '../components/empty-state'
import { Pagination } from '../components/pagination'

export function FeatureListPage() {
  const { user } = useCurrentUser()
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [statusId, setStatusId] = useState<number | undefined>(undefined)

  const params = { page, category_id: categoryId, status_id: statusId }

  const { features, meta, isLoading, isError, error } = useFeatureList(params)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses()
  const { castVote, isPending: isCastingVote } = useCastVote(params)
  const { removeVote, isPending: isRemovingVote } = useRemoveVote(params)

  const isVoting = isCastingVote || isRemovingVote
  const hasActiveFilters = categoryId !== undefined || statusId !== undefined

  function handleClearFilters() {
    setCategoryId(undefined)
    setStatusId(undefined)
    setPage(1)
  }

  function handleCategoryChange(id: number | undefined) {
    setCategoryId(id)
    setPage(1)
  }

  function handleStatusChange(id: number | undefined) {
    setStatusId(id)
    setPage(1)
  }

  return (
    <Stack gap="md">
      <FeatureListFilters
        categories={categories}
        statuses={statuses}
        selectedCategoryId={categoryId}
        selectedStatusId={statusId}
        onCategoryChange={handleCategoryChange}
        onStatusChange={handleStatusChange}
        onClearFilters={handleClearFilters}
        isLoadingCategories={isLoadingCategories}
        isLoadingStatuses={isLoadingStatuses}
      />

      {isLoading && (
        <Center py="xl">
          <Spinner size="lg" label="Loading feature requests…" />
        </Center>
      )}

      {isError && !isLoading && (
        <ErrorMessage error={error} />
      )}

      {!isLoading && !isError && features.length === 0 && (
        <EmptyState
          message={
            hasActiveFilters
              ? 'No features match the selected filters.'
              : 'No feature requests have been submitted yet.'
          }
          action={
            hasActiveFilters
              ? { label: 'Clear filters', onClick: handleClearFilters }
              : user
              ? { label: 'Submit the first feature request', href: '/features/new' }
              : undefined
          }
        />
      )}

      {!isLoading && !isError && features.length > 0 && (
        <Stack gap="sm">
          {features.map((feature) => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              isVoting={isVoting}
              onVote={() => {
                if (feature.has_voted) {
                  removeVote(feature.id)
                } else {
                  castVote(feature.id)
                }
              }}
            />
          ))}

          {meta && (
            <Pagination meta={meta} onPageChange={setPage} />
          )}
        </Stack>
      )}
    </Stack>
  )
}
