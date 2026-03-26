import { Group, Paper, Stack, Text, Title } from '@mantine/core'
import { IconArrowUp } from '@tabler/icons-react'
import type { FeatureRequestSummary } from '../../../../types/feature'
import { StatusBadge } from '../../../statuses/components/status-badge'
import { CategoryBadge } from '../../../categories/components/category-badge'

interface FeatureCardProps {
  feature: FeatureRequestSummary
  isVoting: boolean
  onVote: () => void
}

export function FeatureCard({ feature, isVoting, onVote }: FeatureCardProps) {
  return (
    <Paper p="md" radius="md" withBorder>
      <Group align="flex-start" gap="md" wrap="nowrap">
        {/* Vote Widget */}
        <Stack
          align="center"
          gap={2}
          style={{
            minWidth: 56,
            padding: '8px 4px',
            borderRadius: 'var(--mantine-radius-md)',
            cursor: 'pointer',
            backgroundColor: feature.has_voted
              ? 'var(--mantine-color-indigo-0)'
              : 'var(--mantine-color-gray-0)',
            border: `1px solid ${feature.has_voted ? 'var(--mantine-color-indigo-2)' : 'var(--mantine-color-gray-2)'}`,
            transition: 'background-color 0.15s',
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
          <IconArrowUp
            size={18}
            color={
              feature.has_voted
                ? 'var(--mantine-color-indigo-6)'
                : 'var(--mantine-color-gray-6)'
            }
            stroke={feature.has_voted ? 2.5 : 1.5}
          />
          <Text fw={700} fz="lg" lh={1} c={feature.has_voted ? 'indigo' : 'dark'}>
            {feature.vote_count}
          </Text>
          <Text fz="xs" c="dimmed" lh={1}>
            votes
          </Text>
        </Stack>

        {/* Content */}
        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Title order={4} lineClamp={1}>
            {feature.title}
          </Title>
          <Text fz="sm" c="dimmed" lineClamp={2}>
            {feature.description}
          </Text>
          <Group gap="xs" mt={4}>
            <StatusBadge status={feature.status} />
            <CategoryBadge category={feature.category} />
            <Text fz="xs" c="dimmed" ml="auto">
              by {feature.author.name}
            </Text>
          </Group>
        </Stack>
      </Group>
    </Paper>
  )
}
