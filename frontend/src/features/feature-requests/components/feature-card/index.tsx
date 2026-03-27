import { Group, Paper, Stack, Text, Title, Avatar } from '@mantine/core'
import { IconArrowUp, IconCheck, IconStar, IconStarFilled, IconClock } from '@tabler/icons-react'
import type { FeatureRequest } from '../../../../types/feature'
import { StatusBadge } from '../../../statuses/components/status-badge'
import { CategoryBadge } from '../../../categories/components/category-badge'
import { formatRelativeDate } from '../../../../utils/formatDate'

interface FeatureCardProps {
  feature: FeatureRequest
  isVoting: boolean
  onVote: () => void
}

function StarRating({ value }: { value: number }) {
  return (
    <Group gap={2}>
      {[1, 2, 3, 4, 5].map((i) =>
        i <= value ? (
          <IconStarFilled key={i} size={18} color="var(--mantine-color-yellow-5)" />
        ) : (
          <IconStar key={i} size={18} color="var(--mantine-color-gray-3)" />
        ),
      )}
    </Group>
  )
}

const AVATAR_COLORS = ['indigo', 'violet', 'grape', 'blue', 'teal', 'green', 'orange']

export function FeatureCard({ feature, isVoting, onVote }: FeatureCardProps) {
  const authorInitials = feature.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = AVATAR_COLORS[feature.author.id % AVATAR_COLORS.length]

  return (
    <Paper p="md" radius="md" withBorder>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {/* Vote Widget */}
        <Stack
          align="center"
          gap={4}
          style={{
            minWidth: 80,
            padding: '14px 10px',
            borderRadius: 'var(--mantine-radius-md)',
            cursor: isVoting ? 'default' : 'pointer',
            backgroundColor: feature.has_voted
              ? 'var(--mantine-color-green-1)'
              : 'var(--mantine-color-gray-0)',
            border: `1px solid ${feature.has_voted ? 'var(--mantine-color-green-4)' : 'var(--mantine-color-gray-2)'}`,
            transition: 'background-color 0.15s, border-color 0.15s',
            opacity: isVoting ? 0.6 : 1,
            pointerEvents: isVoting ? 'none' : 'auto',
          }}
          onClick={onVote}
          role="button"
          aria-pressed={feature.has_voted}
          aria-label={
            feature.has_voted
              ? `Remove vote (${feature.vote_count})`
              : `Vote (${feature.vote_count})`
          }
        >
          {feature.has_voted ? (
            <IconCheck size={22} color="var(--mantine-color-green-6)" stroke={2.5} />
          ) : (
            <IconArrowUp size={22} color="var(--mantine-color-gray-5)" stroke={2} />
          )}
          <Text
            fw={700}
            lh={1}
            c={feature.has_voted ? 'green' : 'dark'}
            style={{ fontSize: 32 }}
          >
            {feature.vote_count}
          </Text>
          <Text fz="xs" c="dimmed" lh={1}>
            votes
          </Text>
        </Stack>

        {/* Card content */}
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          {/* Badges + Star rating */}
          <Group justify="space-between" align="center">
            <Group gap="xs">
              <CategoryBadge category={feature.category} size="lg" />
              <StatusBadge status={feature.status} size="lg" />
            </Group>
            <StarRating value={feature.rate} />
          </Group>

          {/* Title */}
          <Title order={4} lineClamp={1} mt={2}>
            {feature.title}
          </Title>

          {/* Description */}
          <Text fz="sm" c="dimmed" lineClamp={2}>
            {feature.description}
          </Text>

          {/* Footer */}
          <Group gap="md" mt={4}>
            <Group gap={6} wrap="nowrap">
              <Avatar size={32} radius="xl" color={avatarColor} src={feature.author.avatar_url ?? undefined}>
                {authorInitials}
              </Avatar>
              <Text fz="sm" fw={500}>
                {feature.author.name}
              </Text>
            </Group>
            <Group gap={4} wrap="nowrap">
              <IconClock size={14} color="var(--mantine-color-gray-5)" />
              <Text fz="xs" c="dimmed">
                Posted {formatRelativeDate(feature.created_at)}
              </Text>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  )
}
