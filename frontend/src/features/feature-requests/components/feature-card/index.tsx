import {
  Avatar,
  Group,
  Paper,
  Stack,
  Text,
  type MantineColor,
} from '@mantine/core'
import {
  IconClock,
  IconStarFilled,
} from '@tabler/icons-react'
import type { FeatureRequest } from '../../../../types/feature'
import { StatusBadge } from '../../../statuses/components/status-badge'
import { CategoryBadge } from '../../../categories/components/category-badge'
import { formatRelativeDate } from '../../../../utils/formatDate'
import { getInitials } from '../../../../utils/formatUser'
import { VoteButton } from '../../../../components/vote-button'
import { PRIORITY_CONFIG } from '../../../../constants/priority'

interface FeatureCardProps {
  feature: FeatureRequest
  isVoting: boolean
  onVote: () => void
}

function PriorityRating({ value }: { value: number }) {
  const config = PRIORITY_CONFIG[value] ?? PRIORITY_CONFIG[3]

  return (
    <Group gap={4} wrap="nowrap">
      <IconStarFilled size={14} color="var(--mantine-color-yellow-6)" />
      <Text fz="xs" fw={700} c="yellow.8">
        {value.toFixed(1)}
      </Text>
      <Text fz="xs" c="dimmed">
        {config.label}
      </Text>
    </Group>
  )
}

const AVATAR_COLORS: MantineColor[] = [
  'indigo',
  'violet',
  'grape',
  'blue',
  'teal',
  'green',
  'orange',
]

export function FeatureCard({ feature, isVoting, onVote }: FeatureCardProps) {
  const authorInitials = getInitials(feature.author.name)
  const avatarColor = AVATAR_COLORS[feature.author.id % AVATAR_COLORS.length]

  return (
    <Paper
      p="lg"
      radius="xl"
      withBorder
      style={{
        transition: 'transform 140ms ease, box-shadow 140ms ease, border-color 140ms ease',
      }}
    >
      <Group align="flex-start" gap="lg" wrap="nowrap">
        <VoteButton
          voteCount={feature.vote_count}
          hasVoted={feature.has_voted}
          isDisabled={isVoting}
          isLoading={isVoting}
          onVote={onVote}
        />

        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
            <Group gap={8}>
              <CategoryBadge category={feature.category} size="md" />
              <StatusBadge status={feature.status} size="md" />
            </Group>

            <PriorityRating value={feature.rate} />
          </Group>

          <Stack gap={6}>
            <Text fz="xl" fw={700} lh={1.3} c="dark" lineClamp={1}>
              {feature.title}
            </Text>

            <Text fz="sm" lh={1.55} c="gray.6" lineClamp={2}>
              {feature.description}
            </Text>
          </Stack>

          <Group justify="space-between" align="center" mt={4} gap="sm">
            <Group gap={8} wrap="nowrap">
              <Avatar
                size={32}
                radius="xl"
                color={avatarColor}
                src={feature.author.avatar_url ?? undefined}
              >
                {authorInitials}
              </Avatar>

              <Group gap={8} wrap="nowrap">
                <Text fz="sm" fw={600} c="gray.8" truncate>
                  {feature.author.name}
                </Text>
                <Text fz="sm" c="gray.4">
                  ·
                </Text>
                <Group gap={4} wrap="nowrap">
                  <IconClock size={14} color="var(--mantine-color-gray-5)" />
                  <Text fz="sm" c="gray.5">
                    Posted {formatRelativeDate(feature.created_at)}
                  </Text>
                </Group>
              </Group>
            </Group>
          </Group>
        </Stack>
      </Group>
    </Paper>
  )
}
