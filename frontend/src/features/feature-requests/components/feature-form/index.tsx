import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  TextInput,
  Textarea,
  Select,
  SimpleGrid,
  Group,
  Button,
  Text,
  Stack,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconStar,
  IconStarFilled,
  IconSend,
  IconBulb,
} from '@tabler/icons-react'
import type { Category } from '../../../../types/category'
import type { Status } from '../../../../types/status'
import type { ApiError } from '../../../../types/api'

export interface FeatureFormFields {
  title: string
  description: string
  rate: number
  category_id: string
  status_id?: string
}

interface FeatureFormProps {
  defaultValues?: Partial<FeatureFormFields>
  categories: Category[]
  statuses: Status[]
  isAdmin: boolean
  isLoadingCategories: boolean
  isLoadingStatuses: boolean
  isPending: boolean
  submitError: ApiError | null
  onSubmit: (data: FeatureFormFields) => void
}

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
}

function StarPicker({ value, onChange }: StarPickerProps) {
  return (
    <Group gap={4}>
      {[1, 2, 3, 4, 5].map((star) => (
        <ActionIcon
          key={star}
          variant="transparent"
          size="lg"
          aria-label={`Rate ${star}`}
          onClick={() => onChange(star)}
          style={{ color: star <= value ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-gray-4)' }}
        >
          {star <= value ? <IconStarFilled size={22} /> : <IconStar size={22} />}
        </ActionIcon>
      ))}
    </Group>
  )
}

export function FeatureForm({
  defaultValues,
  categories,
  statuses,
  isAdmin,
  isLoadingCategories,
  isLoadingStatuses,
  isPending,
  submitError,
  onSubmit,
}: FeatureFormProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<FeatureFormFields>({
    defaultValues: {
      title: '',
      description: '',
      rate: 3,
      category_id: '',
      status_id: '',
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

  const categoryData = categories.map((c) => ({
    value: String(c.id),
    label: c.name,
  }))

  const statusData = statuses.map((s) => ({
    value: String(s.id),
    label: s.name,
  }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="md">
        {/* Non-field submit error */}
        {submitError && !submitError.details && (
          <Text c="red" fz="sm" role="alert">
            {submitError.message}
          </Text>
        )}

        {/* Feature Title */}
        <TextInput
          label="Feature Title"
          withAsterisk
          placeholder="Enter a clear, concise title for your feature request"
          maxLength={100}
          description="Keep it short and descriptive (max 100 characters)"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required.' })}
        />

        {/* Description */}
        <Textarea
          label="Description"
          withAsterisk
          placeholder="Describe your feature request in detail. What problem does it solve? How would it benefit users?"
          rows={5}
          description="Be as detailed as possible to help our team understand your request"
          error={errors.description?.message}
          {...register('description', { required: 'Description is required.' })}
        />

        {/* Priority star picker */}
        <Stack gap={4}>
          <Text fz="sm" fw={500}>
            Priority <span aria-hidden="true" style={{ color: 'var(--mantine-color-red-6)' }}>*</span>
          </Text>
          <Controller
            name="rate"
            control={control}
            rules={{ required: 'Priority is required.', min: 1, max: 5 }}
            render={({ field }) => (
              <StarPicker value={field.value} onChange={field.onChange} />
            )}
          />
          <Text fz="xs" c="dimmed">
            Your self-assessed importance (1 = lowest, 5 = highest)
          </Text>
          {errors.rate && (
            <Text fz="xs" c="red" role="alert">
              {errors.rate.message}
            </Text>
          )}
        </Stack>

        {/* Category + Initial Status */}
        <SimpleGrid cols={2} spacing="md">
          <Controller
            name="category_id"
            control={control}
            rules={{ required: 'Category is required.' }}
            render={({ field }) => (
              <Select
                label="Category"
                withAsterisk
                placeholder={isLoadingCategories ? 'Loading…' : 'Select a category'}
                data={categoryData}
                disabled={isLoadingCategories}
                value={field.value || null}
                onChange={(val) => field.onChange(val ?? '')}
                error={errors.category_id?.message}
              />
            )}
          />
          {isAdmin ? (
            <Controller
              name="status_id"
              control={control}
              rules={{ required: 'Status is required.' }}
              render={({ field }) => (
                <Select
                  label="Initial Status"
                  withAsterisk
                  placeholder={isLoadingStatuses ? 'Loading…' : 'Select a status'}
                  data={statusData}
                  disabled={isLoadingStatuses}
                  value={field.value || null}
                  onChange={(val) => field.onChange(val ?? '')}
                  error={errors.status_id?.message}
                />
              )}
            />
          ) : null}
        </SimpleGrid>

        {/* Tips box */}
        <Paper
          p="md"
          radius="md"
          style={{
            backgroundColor: 'var(--mantine-color-indigo-0)',
            border: '1px solid var(--mantine-color-indigo-2)',
          }}
        >
          <Group gap="xs" mb="xs">
            <IconBulb size={16} color="var(--mantine-color-indigo-6)" />
            <Text fw={600} fz="sm" c="indigo">
              Tips for a great feature request
            </Text>
          </Group>
          <Stack gap={4}>
            {[
              'Be specific about the problem you\'re trying to solve',
              'Explain how this feature would benefit users',
              'Include any relevant examples or use cases',
              'Check if a similar request already exists',
            ].map((tip) => (
              <Text key={tip} fz="xs" c="indigo.7">
                • {tip}
              </Text>
            ))}
          </Stack>
        </Paper>

        {/* Buttons row */}
        <Group gap="sm">
          <Tooltip label="Coming soon">
            <Button variant="default" disabled>
              Save as Draft
            </Button>
          </Tooltip>
          <Button
            type="submit"
            color="indigo"
            style={{ flex: 1 }}
            leftSection={<IconSend size={16} />}
            loading={isPending}
          >
            Submit Feature Request
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
