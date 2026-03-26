import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Group, Title, Text, TextInput, Button, Box, Center } from '@mantine/core'
import { IconSearch, IconPlus } from '@tabler/icons-react'
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
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const [page, setPage] = useState(1)
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined)
  const [statusId, setStatusId] = useState<number | undefined>(undefined)
  const [search, setSearch] = useState('')

  const params = {
    page,
    category_id: categoryId,
    status_id: statusId,
    search: search || undefined,
  }

  const { features, meta, isLoading, isError, error } = useFeatureList(params)
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses()
  const { castVote, isPending: isCastingVote } = useCastVote(params)
  const { removeVote, isPending: isRemovingVote } = useRemoveVote(params)

  const isVoting = isCastingVote || isRemovingVote
  const hasActiveFilters = categoryId !== undefined || statusId !== undefined || search !== ''

  function handleClearFilters() {
    setCategoryId(undefined)
    setStatusId(undefined)
    setSearch('')
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

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  return (
    <Stack gap="md">
      {/* Page header */}
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Feature Rank List</Title>
          <Text c="dimmed" fz="sm" mt={2}>
            Browse and vote on feature requests
          </Text>
        </Box>
        <Group gap="sm">
          <TextInput
            placeholder="Search features..."
            leftSection={<IconSearch size={16} />}
            radius="md"
            size="sm"
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ minWidth: 220 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            color="indigo"
            onClick={() => navigate('/features/new')}
          >
            New Request
          </Button>
        </Group>
      </Group>

      {/* Filters */}
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

      {isError && !isLoading && <ErrorMessage error={error} />}

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

          {meta && <Pagination meta={meta} onPageChange={setPage} />}
        </Stack>
      )}
    </Stack>
  )
}
