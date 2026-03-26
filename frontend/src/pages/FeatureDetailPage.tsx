import { useParams, Link, useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../app/AuthProvider'
import { useFeatureDetail } from '../features/feature-requests/hooks/use-feature-detail'
import { useDeleteFeature } from '../features/feature-requests/hooks/use-delete-feature'
import { useCastVote } from '../features/voting/hooks/use-cast-vote'
import { useRemoveVote } from '../features/voting/hooks/use-remove-vote'
import { VoteButton } from '../features/voting/components/vote-button'
import { StatusBadge } from '../features/statuses/components/status-badge'
import { CategoryBadge } from '../features/categories/components/category-badge'
import { Spinner } from '../components/spinner'
import { ErrorMessage } from '../components/error-message'
import { Button } from '../components/button'
import { formatDate } from '../utils/formatDate'
import type { ApiError } from '../types/api'

export function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>()
  const featureId = Number(id)
  const { user } = useCurrentUser()
  const navigate = useNavigate()

  const emptyParams = {}
  const { feature, isLoading, isError, error } = useFeatureDetail(featureId)
  const { castVote, isPending: isCastingVote } = useCastVote(emptyParams)
  const { removeVote, isPending: isRemovingVote } = useRemoveVote(emptyParams)
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

  if (isLoading) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-12 flex justify-center">
        <Spinner size="lg" label="Loading feature request…" />
      </main>
    )
  }

  if (isError) {
    const apiError = error as ApiError | null
    if (apiError?.status === 404) {
      return (
        <main className="max-w-3xl mx-auto px-4 py-12">
          <div className="text-center">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Feature not found</h1>
            <p className="text-gray-500 mb-4">This feature request no longer exists.</p>
            <Link to="/" className="text-blue-600 hover:text-blue-700 underline text-sm">
              Back to feature list
            </Link>
          </div>
        </main>
      )
    }
    return (
      <main className="max-w-3xl mx-auto px-4 py-12">
        <ErrorMessage error={error} />
      </main>
    )
  }

  if (!feature) return null

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 underline">
          ← Back to feature list
        </Link>
      </nav>

      <article>
        <div className="flex items-start gap-6 mb-6">
          <div className="flex-shrink-0">
            <VoteButton
              hasVoted={feature.has_voted}
              voteCount={feature.vote_count}
              isPending={isVoting}
              isAuthenticated={!!user}
              isTerminal={feature.status.is_terminal}
              onVote={() => castVote(feature.id)}
              onUnvote={() => removeVote(feature.id)}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <StatusBadge status={feature.status} />
              <CategoryBadge category={feature.category} />
            </div>
            <p className="text-gray-700 whitespace-pre-wrap mb-4">{feature.description}</p>
            <p className="text-xs text-gray-400">
              By {feature.author.name} · {formatDate(feature.created_at)}
              {feature.updated_at !== feature.created_at && (
                <> · Updated {formatDate(feature.updated_at)}</>
              )}
            </p>
          </div>
        </div>

        {isDeleteError && deleteError && <ErrorMessage error={deleteError} />}

        {(canEdit || canDelete) && (
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            {canEdit && (
              <Link to={`/features/${feature.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            )}
            {canDelete && (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={isDeleting}
                disabled={isDeleting}
              >
                Delete
              </Button>
            )}
          </div>
        )}
      </article>
    </main>
  )
}
