import { useParams, useNavigate } from 'react-router-dom'
import { Stack, Box, Title, Text, Anchor, Center } from '@mantine/core'
import { useFeatureDetail } from '../features/feature-requests/hooks/use-feature-detail'
import { useUpdateFeature } from '../features/feature-requests/hooks/use-update-feature'
import { useCategories } from '../features/categories/hooks/use-categories'
import { useStatuses } from '../features/statuses/hooks/use-statuses'
import { useCurrentUser } from '../app/AuthProvider'
import {
  FeatureForm,
  type FeatureFormFields,
} from '../features/feature-requests/components/feature-form'
import { Spinner } from '../components/spinner'
import { ErrorMessage } from '../components/error-message'

export function EditFeaturePage() {
  const { id } = useParams<{ id: string }>()
  const featureId = Number(id)
  const navigate = useNavigate()
  const { user } = useCurrentUser()

  const {
    feature,
    isLoading: isLoadingFeature,
    isError: isFeatureError,
    error: featureError,
  } = useFeatureDetail(featureId)
  const { updateFeature, isPending, isError, error } = useUpdateFeature()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses()

  function handleSubmit(fields: FeatureFormFields) {
    updateFeature(
      {
        id: featureId,
        payload: {
          title: fields.title,
          description: fields.description,
          rate: fields.rate,
          category_id: Number(fields.category_id),
        },
      },
      { onSuccess: (updated) => navigate(`/features/${updated.id}`) },
    )
  }

  if (isLoadingFeature) {
    return (
      <Center py="xl">
        <Spinner size="lg" label="Loading feature request…" />
      </Center>
    )
  }

  if (isFeatureError) {
    if (featureError?.status === 404) {
      return (
        <Stack align="center" gap="sm" py="xl">
          <Title order={3}>Feature not found</Title>
          <Text c="dimmed" fz="sm">This feature request no longer exists.</Text>
          <Anchor fz="sm" onClick={() => navigate('/features')}>Back to feature list</Anchor>
        </Stack>
      )
    }
    return <ErrorMessage error={featureError} />
  }

  if (!feature) return null

  const canEdit = user && (user.id === feature.author.id || user.is_admin)
  if (!canEdit) {
    return (
      <Stack align="center" gap="sm" py="xl">
        <Title order={3}>Access denied</Title>
        <Text c="dimmed" fz="sm">You don't have permission to edit this feature request.</Text>
        <Anchor fz="sm" onClick={() => navigate(`/features/${feature.id}`)}>Back to feature</Anchor>
      </Stack>
    )
  }

  return (
    <Box maw={672} mx="auto">
      <Stack gap="lg">
        <Box>
          <Anchor fz="sm" onClick={() => navigate(`/features/${feature.id}`)}>
            ← Back to feature
          </Anchor>
        </Box>

        <Title order={2}>Edit Feature Request</Title>

        <FeatureForm
          defaultValues={{
            title: feature.title,
            description: feature.description,
            rate: feature.rate,
            category_id: String(feature.category.id),
          }}
          categories={categories}
          statuses={statuses}
          isAdmin={user?.is_admin ?? false}
          isLoadingCategories={isLoadingCategories}
          isLoadingStatuses={isLoadingStatuses}
          isPending={isPending}
          submitError={isError ? error : null}
          onSubmit={handleSubmit}
        />
      </Stack>
    </Box>
  )
}
