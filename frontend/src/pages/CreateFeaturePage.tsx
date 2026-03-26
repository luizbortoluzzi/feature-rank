import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCreateFeature } from '../features/feature-requests/hooks/use-create-feature'
import { useCategories } from '../features/categories/hooks/use-categories'
import {
  FeatureForm,
  type FeatureFormFields,
} from '../features/feature-requests/components/feature-form'
import { ErrorMessage } from '../components/error-message'

export function CreateFeaturePage() {
  const navigate = useNavigate()
  const { createFeature, isPending, isError, error, data } = useCreateFeature()
  const { categories, isLoading: isLoadingCategories } = useCategories()

  useEffect(() => {
    if (data) {
      navigate(`/features/${data.id}`)
    }
  }, [data, navigate])

  function handleSubmit(fields: FeatureFormFields) {
    createFeature({
      title: fields.title,
      description: fields.description,
      rate: fields.rate,
      category_id: Number(fields.category_id),
    })
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-6">
        <Link to="/" className="text-sm text-blue-600 hover:text-blue-700 underline">
          ← Back to feature list
        </Link>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit Feature Request</h1>

      {isError && error && !error.details && <ErrorMessage error={error} />}

      <FeatureForm
        categories={categories}
        isLoadingCategories={isLoadingCategories}
        isPending={isPending}
        submitError={isError ? error : null}
        onSubmit={handleSubmit}
        submitLabel="Submit Feature"
      />
    </main>
  )
}
