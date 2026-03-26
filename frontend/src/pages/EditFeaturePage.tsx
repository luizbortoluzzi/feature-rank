import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useFeatureDetail } from '../features/feature-requests/hooks/use-feature-detail'
import { useUpdateFeature } from '../features/feature-requests/hooks/use-update-feature'
import { useCategories } from '../features/categories/hooks/use-categories'
import { useStatuses } from '../features/statuses/hooks/use-statuses'
import { useCurrentUser } from '../app/AuthProvider'
import {
  FeatureForm,
  type FeatureFormFields,
} from '../features/feature-requests/components/feature-form'
import { Spinner } from '../components/spinner'
import { ErrorMessage } from '../components/error-message'
import type { ApiError } from '../types/api'

export function EditFeaturePage() {
  const { id } = useParams<{ id: string }>()
  const featureId = Number(id)
  const navigate = useNavigate()
  const { user } = useCurrentUser()

  const {
    feature,
    isLoading: isLoadingFeature,
    isError: isFeatureError,
    error: featureError,
  } = useFeatureDetail(featureId)
  const { updateFeature, isPending, isError, error, data } = useUpdateFeature()
  const { categories, isLoading: isLoadingCategories } = useCategories()
  const { statuses, isLoading: isLoadingStatuses } = useStatuses()

  useEffect(() => {
    if (data) {
      navigate(`/features/${data.id}`)
    }
  }, [data, navigate])

  function handleSubmit(fields: FeatureFormFields) {
    updateFeature({
      id: featureId,
      payload: {
        title: fields.title,
        description: fields.description,
        rate: fields.rate,
        category_id: Number(fields.category_id),
      },
    })
  }

  if (isLoadingFeature) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 flex justify-center">
        <Spinner size="lg" label="Loading feature request…" />
      </main>
    )
  }

  if (isFeatureError) {
    const apiError = featureError as ApiError | null
    if (apiError?.status === 404) {
      return (
        <main className="max-w-2xl mx-auto px-4 py-12">
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
      <main className="max-w-2xl mx-auto px-4 py-12">
        <ErrorMessage error={featureError} />
      </main>
    )
  }

  if (!feature) return null

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link
          to={`/features/${feature.id}`}
          className="text-sm text-blue-600 hover:text-blue-700 underline"
        >
          ← Back to feature
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Feature Request</h1>

      <FeatureForm
        defaultValues={{
          title: feature.title,
          description: feature.description,
          rate: feature.rate,
          category_id: String(feature.category.id),
        }}
        categories={categories}
        statuses={statuses}
        isAdmin={user?.is_admin ?? false}
        isLoadingCategories={isLoadingCategories}
        isLoadingStatuses={isLoadingStatuses}
        isPending={isPending}
        submitError={isError ? error : null}
        onSubmit={handleSubmit}
      />
    </main>
  )
}
