import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../../../components/button'
import { ErrorMessage } from '../../../../components/error-message'
import { Spinner } from '../../../../components/spinner'
import type { Category } from '../../../../types/category'
import type { ApiError } from '../../../../types/api'

export interface FeatureFormFields {
  title: string
  description: string
  rate: number
  category_id: number
}

interface FeatureFormProps {
  defaultValues?: Partial<FeatureFormFields>
  categories: Category[]
  isLoadingCategories: boolean
  isPending: boolean
  submitError: ApiError | null
  onSubmit: (data: FeatureFormFields) => void
  submitLabel: string
}

export function FeatureForm({
  defaultValues,
  categories,
  isLoadingCategories,
  isPending,
  submitError,
  onSubmit,
  submitLabel,
}: FeatureFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FeatureFormFields>({
    defaultValues: {
      title: '',
      description: '',
      rate: 3,
      category_id: 0,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (submitError?.details) {
      Object.entries(submitError.details).forEach(([field, messages]) => {
        setError(field as keyof FeatureFormFields, { message: messages[0] })
      })
    }
  }, [submitError, setError])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {submitError && !submitError.details && <ErrorMessage error={submitError} />}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
          Title{' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="title"
          type="text"
          maxLength={200}
          aria-describedby={errors.title ? 'title-error' : undefined}
          {...register('title', { required: 'Title is required.' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.title && (
          <p id="title-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
          Description{' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <textarea
          id="description"
          rows={5}
          maxLength={2000}
          aria-describedby={errors.description ? 'description-error' : undefined}
          {...register('description', { required: 'Description is required.' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.description && (
          <p id="description-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.description.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
          Category{' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        {isLoadingCategories ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Spinner size="sm" label="Loading categories…" />
            <span>Loading categories…</span>
          </div>
        ) : (
          <select
            id="category_id"
            aria-describedby={errors.category_id ? 'category-error' : undefined}
            {...register('category_id', {
              required: 'Category is required.',
              validate: (v) => Number(v) > 0 || 'Please select a category.',
            })}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Select a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}
        {errors.category_id && (
          <p id="category-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.category_id.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-1">
          Priority (1–5){' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="rate"
          type="number"
          min={1}
          max={5}
          aria-describedby={errors.rate ? 'rate-error' : undefined}
          {...register('rate', {
            required: 'Rate is required.',
            min: { value: 1, message: 'Rate must be between 1 and 5.' },
            max: { value: 5, message: 'Rate must be between 1 and 5.' },
            valueAsNumber: true,
          })}
          className="w-32 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Your self-assessed importance of this feature (1 = lowest, 5 = highest).
        </p>
        {errors.rate && (
          <p id="rate-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.rate.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
          disabled={isPending}
          aria-label={isPending ? 'Submitting…' : submitLabel}
        >
          {isPending ? 'Submitting…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
