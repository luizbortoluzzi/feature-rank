import { useParams, useNavigate } from 'react-router-dom'
import {
  Grid,
  Paper,
  Group,
  Stack,
  Text,
  Title,
  Avatar,
  ActionIcon,
  Divider,
  Button,
} from '@mantine/core'
import { IconArrowLeft, IconShare2 } from '@tabler/icons-react'
import { useCurrentUser } from '../../app/AuthProvider'
import { useFeatureDetail } from '../../features/feature-requests/hooks/use-feature-detail'
import { useDeleteFeature } from '../../features/feature-requests/hooks/use-delete-feature'
import { useCastVote } from '../../features/voting/hooks/use-cast-vote'
import { useRemoveVote } from '../../features/voting/hooks/use-remove-vote'
import { StatusBadge } from '../../features/statuses/components/status-badge'
import { CategoryBadge } from '../../features/categories/components/category-badge'
import { PriorityBadge } from '../../features/feature-requests/components/priority-badge'
import { VoteButton } from '../../components/vote-button'
import { Spinner } from '../../components/spinner'
import { ErrorMessage } from '../../components/error-message'
import { formatDate, formatRelativeDate } from '../../utils/formatDate'
import { getInitials } from '../../utils/formatUser'
import { PAGE_MAX_WIDTH } from '../../constants/layout'

export function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const featureId = Number(id)
  const { user } = useCurrentUser()
  const navigate = useNavigate()

  const { feature, isLoading, isError, error } = useFeatureDetail(featureId)
  const { castVote, isPending: isCastingVote } = useCastVote()
  const { removeVote, isPending: isRemovingVote } = useRemoveVote()
  const {
    deleteFeature,
    isPending: isDeleting,
    isError: isDeleteError,
    error: deleteError,
  } = useDeleteFeature()

  const isVoting = isCastingVote || isRemovingVote
  const isOwner = user && feature && user.id === feature.author.id
  const canEdit = isOwner || user?.is_admin
  const canDelete = isOwner || user?.is_admin

  function handleDelete() {
    if (!feature) return
    deleteFeature(feature.id)
    navigate('/')
  }

  function handleShare() {
    void navigator.clipboard.writeText(window.location.href)
  }

  function handleVoteToggle() {
    if (!feature || isVoting || feature.status.is_terminal) return
    if (feature.has_voted) {
      removeVote(feature.id)
    } else {
      castVote(feature.id)
    }
  }

  if (isLoading) {
    return (
      <main
        style={{
          maxWidth: PAGE_MAX_WIDTH,
          margin: '0 auto',
          padding: '48px 16px',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Spinner size="lg" label="Loading feature request…" />
      </main>
    )
  }

  if (isError) {
    if (error?.status === 404) {
      return (
        <main style={{ maxWidth: PAGE_MAX_WIDTH, margin: '0 auto', padding: '48px 16px' }}>
          <Stack align="center" gap="sm">
            <Title order={2} fz="xl">
              Feature not found
            </Title>
            <Text c="dimmed" fz="sm">
              This feature request no longer exists.
            </Text>
            <Button variant="subtle" color="gray" size="sm" onClick={() => navigate('/features')}>
              Back to feature list
            </Button>
          </Stack>
        </main>
      )
    }
    return (
      <main style={{ maxWidth: PAGE_MAX_WIDTH, margin: '0 auto', padding: '48px 16px' }}>
        <ErrorMessage error={error} />
      </main>
    )
  }

  if (!feature) return null

  const authorInitials = getInitials(feature.author.name)
  const isVoteDisabled = isVoting || !!feature.status.is_terminal

  return (
    <main style={{ maxWidth: PAGE_MAX_WIDTH, margin: '0 auto', padding: '16px 0 48px' }}>
      {/* Page header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <Group align="flex-start" gap="sm">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="md"
            aria-label="Back to feature list"
            onClick={() => navigate('/features')}
            mt={2}
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Stack gap={2}>
            <Title order={2} fz="xl">
              {feature.title}
            </Title>
            <Text c="dimmed" fz="sm">
              Feature Request #FR-{feature.id}
            </Text>
          </Stack>
        </Group>

        <Group gap="sm" mt={2}>
          <Button
            variant="light"
            color="gray"
            size="sm"
            onClick={handleShare}
            aria-label="Share this feature request"
            leftSection={<IconShare2 size={14} />}
          >
            Share
          </Button>
          {canEdit && (
            <Button
              variant="light"
              color="gray"
              size="sm"
              onClick={() => navigate(`/features/${feature.id}/edit`)}
            >
              Edit
            </Button>
          )}
        </Group>
      </Group>

      {/* Two-column layout */}
      <Grid gutter="lg">
        {/* Main column */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder radius="md" p="lg">
            {/* Vote box + meta row */}
            <Group align="flex-start" gap="lg" mb="md">
              <VoteButton
                voteCount={feature.vote_count}
                hasVoted={feature.has_voted}
                isDisabled={isVoteDisabled}
                isLoading={isVoting}
                onVote={user ? handleVoteToggle : undefined}
              />

              {/* Meta: badges + author + timestamps */}
              <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
                <Group gap="xs" wrap="wrap">
                  <CategoryBadge category={feature.category} />
                  <StatusBadge status={feature.status} />
                  <PriorityBadge rate={feature.rate} />
                </Group>

                <Group gap="sm" wrap="nowrap">
                  <Avatar
                    size={32}
                    radius="xl"
                    color="indigo"
                    src={feature.author.avatar_url ?? undefined}
                  >
                    {authorInitials}
                  </Avatar>
                  <Stack gap={0}>
                    <Text fz="sm" fw={500}>
                      {feature.author.name}
                    </Text>
                    <Text fz="xs" c="dimmed">
                      Posted {formatRelativeDate(feature.created_at)}
                      {feature.updated_at !== feature.created_at && (
                        <> · Updated {formatRelativeDate(feature.updated_at)}</>
                      )}
                    </Text>
                  </Stack>
                </Group>
              </Stack>
            </Group>

            <Divider mb="md" />

            {/* Description */}
            <Text fz="sm" c="dark" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
              {feature.description}
            </Text>

            {/* Delete action */}
            {canDelete && (
              <>
                <Divider mt="lg" mb="md" />
                {isDeleteError && deleteError && <ErrorMessage error={deleteError} />}
                <Group justify="flex-end">
                  <Button
                    variant="filled"
                    color="red"
                    size="sm"
                    onClick={handleDelete}
                    loading={isDeleting}
                  >
                    Delete
                  </Button>
                </Group>
              </>
            )}
          </Paper>
        </Grid.Col>

        {/* Sidebar column */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="md">
            {/* Status & Details card */}
            <Paper withBorder radius="md" p="lg">
              <Title order={5} mb="md">
                Status &amp; Details
              </Title>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text fz="sm" c="dimmed">
                    Current Status
                  </Text>
                  <StatusBadge status={feature.status} />
                </Group>

                <Group justify="space-between" align="center">
                  <Text fz="sm" c="dimmed">
                    Priority
                  </Text>
                  <PriorityBadge rate={feature.rate} />
                </Group>

                <Group justify="space-between" align="center">
                  <Text fz="sm" c="dimmed">
                    Category
                  </Text>
                  <CategoryBadge category={feature.category} />
                </Group>

                <Divider />

                <Group justify="space-between" align="center">
                  <Text fz="sm" c="dimmed">
                    Posted
                  </Text>
                  <Text fz="sm">{formatDate(feature.created_at)}</Text>
                </Group>

                <Group justify="space-between" align="center">
                  <Text fz="sm" c="dimmed">
                    Last Updated
                  </Text>
                  <Text fz="sm">{formatDate(feature.updated_at)}</Text>
                </Group>
              </Stack>
            </Paper>

            {/* Engagement card */}
            <Paper withBorder radius="md" p="lg">
              <Title order={5} mb="md">
                Engagement
              </Title>
              <Group justify="space-between" align="center">
                <Text fz="sm" c="dimmed">
                  Votes
                </Text>
                <Text fz="sm" fw={600}>
                  {feature.vote_count}
                </Text>
              </Group>
            </Paper>
          </Stack>
        </Grid.Col>
      </Grid>
    </main>
  )
}
