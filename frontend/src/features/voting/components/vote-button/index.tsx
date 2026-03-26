import { Button } from '../../../../components/button'

interface VoteButtonProps {
  hasVoted: boolean
  voteCount: number
  isPending: boolean
  isAuthenticated: boolean
  isTerminal: boolean
  onVote: () => void
  onUnvote: () => void
}

export function VoteButton({
  hasVoted,
  voteCount,
  isPending,
  isAuthenticated,
  isTerminal,
  onVote,
  onUnvote,
}: VoteButtonProps) {
  const isDisabled = !isAuthenticated || isPending || isTerminal
  const label = hasVoted ? 'Remove vote' : 'Vote'
  const ariaLabel = isPending
    ? 'Vote action in progress…'
    : hasVoted
    ? `Remove vote (${voteCount} votes)`
    : `Vote (${voteCount} votes)`

  function handleClick() {
    if (hasVoted) {
      onUnvote()
    } else {
      onVote()
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="text-lg font-semibold text-gray-700">{voteCount}</span>
        <a
          href="/login"
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Log in to vote
        </a>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        variant={hasVoted ? 'primary' : 'secondary'}
        size="sm"
        onClick={handleClick}
        disabled={isDisabled}
        isLoading={isPending}
        aria-label={ariaLabel}
        aria-pressed={hasVoted}
      >
        {label}
      </Button>
      <span className="text-sm font-medium text-gray-700" aria-live="polite">
        {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
      </span>
    </div>
  )
}
