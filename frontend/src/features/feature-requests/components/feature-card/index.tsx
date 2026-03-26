import { Link } from 'react-router-dom'
import {
  Card,
  Group,
  Stack,
  Text,
  Avatar,
  ActionIcon,
  Rating,
  Box,
} from '@mantine/core'
import { IconArrowUp, IconClock } from '@tabler/icons-react'
import { StatusBadge } from '../../../statuses/components/status-badge'
import { CategoryBadge } from '../../../categories/components/category-badge'
import { formatDate } from '../../../../utils/formatDate'
import type { FeatureRequest } from '../../../../types/feature'

interface FeatureCardProps {
  feature: FeatureRequest
  onVote: () => void
  isVoting: boolean
}

export function FeatureCard({ feature, onVote, isVoting }: FeatureCardProps) {
  const authorInitials = feature.author.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const truncatedDescription =
    feature.description.length > 160
      ? feature.description.slice(0, 160) + '…'
      : feature.description

  return (
    <Card withBorder shadow="xs" radius="md" p="md">
      <Group align="flex-start" gap="md" wrap="nowrap">
        {/* Vote Widget */}
        <ActionIcon
          variant="subtle"
          color={feature.has_voted ? 'indigo' : 'gray'}
          size="xl"
          radius="md"
          onClick={onVote}
          disabled={isVoting}
          aria-label={
            isVoting
              ? 'Vote action in progress…'
              : feature.has_voted
              ? `Remove vote (${feature.vote_count} votes)`
              : `Vote (${feature.vote_count} votes)`
          }
          aria-pressed={feature.has_voted}
          style={{ flexShrink: 0, flexDirection: 'column', height: 'auto', padding: '8px 12px' }}
        >
          <Stack align="center" gap={2}>
            <IconArrowUp
              size={20}
              stroke={feature.has_voted ? 2.5 : 1.5}
            />
            <Text
              size="md"
              fw={700}
              c={feature.has_voted ? 'indigo' : 'dark'}
              lh={1}
              aria-live="polite"
            >
              {feature.vote_count}
            </Text>
            <Text size="xs" c="dimmed" lh={1}>
              votes
            </Text>
          </Stack>
        </ActionIcon>

        {/* Content */}
        <Box style={{ flex: 1, minWidth: 0 }}>
          <Group gap="xs" mb={6} wrap="nowrap" align="center">
            <CategoryBadge category={feature.category} />
            <StatusBadge status={feature.status} />
            <Box style={{ marginLeft: 'auto', flexShrink: 0 }}>
              <Rating value={feature.rate} readOnly size="xs" />
            </Box>
          </Group>

          <Text
            component={Link}
            to={`/features/${feature.id}`}
            fw={600}
            size="md"
            mb={4}
            style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
          >
            {feature.title}
          </Text>

          <Text size="sm" c="dimmed" lineClamp={2} mb={10}>
            {truncatedDescription}
          </Text>

          <Group gap="sm" align="center">
            <Avatar size="xs" radius="xl" color="indigo">
              {authorInitials}
            </Avatar>
            <Text size="xs" c="dimmed">
              {feature.author.name}
            </Text>
            <Group gap={4} align="center">
              <IconClock size={12} color="var(--mantine-color-dimmed)" />
              <Text size="xs" c="dimmed">
                {formatDate(feature.created_at)}
              </Text>
            </Group>
          </Group>
        </Box>
      </Group>
    </Card>
  )
}
