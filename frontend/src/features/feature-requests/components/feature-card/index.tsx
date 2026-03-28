import {
  Avatar,
  Box,
  Group,
  Paper,
  Stack,
  Text,
  UnstyledButton,
  type MantineColor,
} from '@mantine/core'
import {
  IconArrowUp,
  IconCheck,
  IconClock,
  IconDots,
  IconStarFilled,
} from '@tabler/icons-react'
import type { FeatureRequest } from '../../../../types/feature'
import { StatusBadge } from '../../../statuses/components/status-badge'
import { CategoryBadge } from '../../../categories/components/category-badge'
import { formatRelativeDate } from '../../../../utils/formatDate'

interface FeatureCardProps {
  feature: FeatureRequest
  isVoting: boolean
  onVote: () => void
}

function PriorityRating({ value }: { value: number }) {
  return (
    <Group gap={4} wrap="nowrap">
      <IconStarFilled size={14} color="var(--mantine-color-yellow-6)" />
      <Text fz="xs" fw={700} c="yellow.8">
        {value.toFixed(1)}
      </Text>
      <Text fz="xs" c="dimmed">
        Priority
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
  const authorInitials = feature.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const avatarColor = AVATAR_COLORS[feature.author.id % AVATAR_COLORS.length]

  const voteLabel = feature.has_voted
    ? `Remove vote (${feature.vote_count})`
    : `Vote (${feature.vote_count})`

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
        <UnstyledButton
          onClick={onVote}
          disabled={isVoting}
          aria-pressed={feature.has_voted}
          aria-label={voteLabel}
          style={{
            minWidth: 88,
            borderRadius: 'var(--mantine-radius-xl)',
            padding: '16px 12px',
            backgroundColor: feature.has_voted
              ? 'var(--mantine-color-indigo-0)'
              : 'var(--mantine-color-gray-0)',
            border: `1px solid ${
              feature.has_voted
                ? 'var(--mantine-color-indigo-3)'
                : 'var(--mantine-color-gray-2)'
            }`,
            opacity: isVoting ? 0.65 : 1,
            cursor: isVoting ? 'default' : 'pointer',
            transition:
              'transform 140ms ease, background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
            boxShadow: feature.has_voted
              ? '0 8px 18px rgba(99, 102, 241, 0.10)'
              : '0 4px 12px rgba(30, 36, 53, 0.04)',
          }}
        >
          <Stack align="center" gap={6}>
            {feature.has_voted ? (
              <IconCheck size={20} color="var(--mantine-color-indigo-6)" stroke={2.5} />
            ) : (
              <IconArrowUp size={20} color="var(--mantine-color-gray-6)" stroke={2.2} />
            )}

            <Text
              fw={800}
              lh={1}
              c={feature.has_voted ? 'indigo.7' : 'dark'}
              style={{ fontSize: 30 }}
            >
              {feature.vote_count}
            </Text>

            <Text fz="xs" fw={600} c={feature.has_voted ? 'indigo.6' : 'dimmed'} lh={1}>
              votes
            </Text>
          </Stack>
        </UnstyledButton>

        <Stack gap="sm" style={{ flex: 1, minWidth: 0 }}>
          <Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
            <Group gap={8}>
              <CategoryBadge category={feature.category} size="md" />
              <StatusBadge status={feature.status} size="md" />
            </Group>

            <Group gap={10} wrap="nowrap">
              <PriorityRating value={feature.rate} />
              <Box
                component="button"
                type="button"
                aria-label="More actions"
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '999px',
                  border: '1px solid var(--mantine-color-gray-2)',
                  background: 'var(--mantine-color-white)',
                  color: 'var(--mantine-color-gray-6)',
                  cursor: 'pointer',
                }}
              >
                <IconDots size={16} />
              </Box>
            </Group>
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
