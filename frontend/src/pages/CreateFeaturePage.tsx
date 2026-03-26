import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stack, Group, Box, Title, Text, Anchor, Paper, Center } from '@mantine/core'
import { IconPlus } from '@tabler/icons-react'
import { useCurrentUser } from '../app/AuthProvider'
import { useCreateFeature } from '../features/feature-requests/hooks/use-create-feature'
import { useCategories } from '../features/categories/hooks/use-categories'
import { useStatuses } from '../features/statuses/hooks/use-statuses'
import { FeatureForm, type FeatureFormFields } from '../features/feature-requests/components/feature-form'

export function CreateFeaturePage() {
  const navigate = useNavigate()
  const { user } = useCurrentUser()
  const { createFeature, isPending, isError, error, data } = useCreateFeature()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses()

  useEffect(() => {
    if (data) navigate(`/features/${data.id}`)
  }, [data, navigate])

  function handleSubmit(fields: FeatureFormFields) {
    const payload: { title: string; description: string; rate: number; category_id: number; status_id?: number } = {
      title: fields.title,
      description: fields.description,
      rate: fields.rate,
      category_id: Number(fields.category_id),
    }
    // Only include status_id for admins (forbidden for non-admin flows per frontend rules)
    if (user?.is_admin && fields.status_id) {
      payload.status_id = Number(fields.status_id)
    }
    createFeature(payload)
  }

  return (
    <Stack gap="lg">
      {/* Page header */}
      <Group justify="space-between" align="flex-start">
        <Group gap="sm" align="flex-start">
          <Box
            style={{
              width: 32, height: 32, borderRadius: 6,
              backgroundColor: 'var(--mantine-color-indigo-6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: 2,
            }}
          >
            <IconPlus size={18} color="white" />
          </Box>
          <Box>
            <Title order={2}>New Feature Request</Title>
            <Text c="dimmed" fz="sm" mt={2}>Submit your idea to our product team</Text>
          </Box>
        </Group>
        <Anchor
          component="button"
          fz="sm"
          c="dimmed"
          onClick={() => navigate('/features')}
          style={{ marginTop: 4 }}
        >
          ← Back to Board
        </Anchor>
      </Group>

      {/* Form */}
      <Center>
        <Paper withBorder radius="md" p="xl" maw={640} w="100%">
          <FeatureForm
            categories={categories}
            statuses={statuses}
            isAdmin={user?.is_admin ?? false}
            isLoadingCategories={isLoadingCategories}
            isLoadingStatuses={isLoadingStatuses}
            isPending={isPending}
            submitError={isError ? error : null}
            onSubmit={handleSubmit}
          />
        </Paper>
      </Center>
    </Stack>
  )
}
