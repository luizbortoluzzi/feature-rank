import { Stack, Text, UnstyledButton } from '@mantine/core'
import { IconArrowUp, IconCheck } from '@tabler/icons-react'

interface VoteButtonProps {
  voteCount: number
  hasVoted: boolean
  isDisabled: boolean
  isLoading?: boolean
  /** When undefined the button renders in guest (non-interactive) mode */
  onVote?: () => void
}

export function VoteButton({ voteCount, hasVoted, isDisabled, isLoading, onVote }: VoteButtonProps) {
  const isGuest = onVote === undefined

  const sharedStyle: React.CSSProperties = {
    minWidth: 88,
    borderRadius: 'var(--mantine-radius-xl)',
    padding: '16px 12px',
    backgroundColor: hasVoted ? 'var(--mantine-color-indigo-0)' : 'var(--mantine-color-gray-0)',
    border: `1px solid ${hasVoted ? 'var(--mantine-color-indigo-3)' : 'var(--mantine-color-gray-2)'}`,
    transition: 'transform 140ms ease, background-color 140ms ease, border-color 140ms ease, box-shadow 140ms ease',
    boxShadow: hasVoted ? '0 8px 18px rgba(99, 102, 241, 0.10)' : '0 4px 12px rgba(30, 36, 53, 0.04)',
  }

  const inner = (
    <Stack align="center" gap={6}>
      {hasVoted ? (
        <IconCheck size={20} color="var(--mantine-color-indigo-6)" stroke={2.5} />
      ) : (
        <IconArrowUp size={20} color="var(--mantine-color-gray-6)" stroke={2.2} />
      )}

      <Text fw={800} lh={1} c={hasVoted ? 'indigo.7' : 'dark'} style={{ fontSize: 30 }}>
        {voteCount}
      </Text>

      <Text fz="xs" fw={600} c={hasVoted ? 'indigo.6' : 'dimmed'} lh={1}>
        votes
      </Text>
    </Stack>
  )

  if (isGuest) {
    return <div style={sharedStyle}>{inner}</div>
  }

  const label = hasVoted ? `Remove vote (${voteCount})` : `Vote (${voteCount})`

  return (
    <UnstyledButton
      onClick={onVote}
      disabled={isDisabled || isLoading}
      aria-pressed={hasVoted}
      aria-label={label}
      style={{
        ...sharedStyle,
        opacity: isLoading || (isDisabled && !hasVoted) ? 0.65 : 1,
        cursor: isDisabled || isLoading ? 'default' : 'pointer',
      }}
    >
      {inner}
    </UnstyledButton>
  )
}
