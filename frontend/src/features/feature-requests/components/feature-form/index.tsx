import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  IconBulb,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconSend,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react'
import type { Category } from '../../../../types/category'
import type { Status } from '../../../../types/status'
import type { ApiError } from '../../../../types/api'
import { PRIORITY_CONFIG } from '../../../../constants/priority'
import { FormTextInput } from '../../../../components/form/text-input'
import { FormTextarea } from '../../../../components/form/textarea'
import { FormSelect } from '../../../../components/form/select'
import { FormSubmitError } from '../../../../components/form/submit-error'
import { FormActions } from '../../../../components/form/actions'
import { useServerFieldErrors } from '../../../../hooks/use-server-field-errors'

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
  onCancel: () => void
}

interface PriorityPickerProps {
  value: number
  onChange: (value: number) => void
}

function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value || 3
  const displayEntry = PRIORITY_CONFIG[active] ?? PRIORITY_CONFIG[3]

  return (
    <Stack gap="xs">
      <Group gap="sm" align="center" wrap="nowrap">
        <Group gap={4}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isActive = star <= active

            return (
              <UnstyledButton
                key={star}
                aria-label={`Set priority to ${star}`}
                onClick={() => onChange(star)}
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 'var(--mantine-radius-full)',
                  color: isActive ? 'var(--mantine-color-indigo-5)' : 'var(--mantine-color-gray-3)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  transition: 'color 120ms ease, transform 120ms ease',
                }}
              >
                {isActive ? <IconStarFilled size={22} /> : <IconStar size={22} />}
              </UnstyledButton>
            )
          })}
        </Group>

        <Badge color={displayEntry.color} variant="light" radius="xl" size="md">
          {displayEntry.label}
        </Badge>
      </Group>

      <Text fz="xs" c="dimmed">
        {displayEntry.description}. Your self-assessed importance from 1 to 5.
      </Text>
    </Stack>
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
  onCancel,
}: FeatureFormProps) {
  const [tipsOpen, setTipsOpen] = useState(true)

  const {
    register,
    handleSubmit,
    control,
    setError,
    watch,
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

  useServerFieldErrors(submitError, setError)

  const titleValue = watch('title') ?? ''
  const descriptionValue = watch('description') ?? ''

  useEffect(() => {
    if (descriptionValue.trim().length > 0) {
      setTipsOpen(false)
    }
  }, [descriptionValue])

  const categoryData = categories.map((category) => ({
    value: String(category.id),
    label: category.name,
  }))

  const statusData = statuses.map((status) => ({
    value: String(status.id),
    label: status.name,
  }))

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="lg">
        <FormSubmitError error={submitError} title="We couldn't submit your request" />

        <FormTextInput
          label="Feature title"
          description="Keep it short, specific, and easy to scan."
          withAsterisk
          placeholder="Enter a clear, concise title for your feature request"
          charLimit={100}
          charCount={titleValue.length}
          helperText="A strong title helps similar requests get discovered faster."
          error={errors.title?.message}
          {...register('title', { required: 'Title is required.' })}
        />

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text fw={600} fz="sm">
              Tips for a great request
            </Text>

            <Button
              variant="subtle"
              color="indigo"
              size="compact-sm"
              leftSection={<IconBulb size={14} />}
              rightSection={tipsOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
              onClick={() => setTipsOpen((opened) => !opened)}
            >
              {tipsOpen ? 'Hide tips' : 'Show tips'}
            </Button>
          </Group>

          <Collapse in={tipsOpen}>
            <Paper
              p="md"
              radius="xl"
              style={{
                backgroundColor: 'var(--mantine-color-indigo-0)',
                border: '1px solid var(--mantine-color-indigo-2)',
              }}
            >
              <Stack gap="xs">
                {[
                  "Be specific about the problem you're trying to solve",
                  'Explain how this feature would benefit users',
                  'Include examples, workflows, or concrete use cases',
                  'Mention limitations in the current experience',
                ].map((tip) => (
                  <Group key={tip} gap="xs" align="flex-start" wrap="nowrap">
                    <ThemeIcon size={18} radius="xl" variant="light" color="indigo">
                      <IconInfoCircle size={12} />
                    </ThemeIcon>
                    <Text fz="sm" c="indigo.8">
                      {tip}
                    </Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          </Collapse>
        </Stack>

        <FormTextarea
          label="Description"
          description="Explain what problem this solves, who it helps, and why it matters."
          withAsterisk
          placeholder="Describe your feature request in detail. What problem does it solve? How would it benefit users?"
          helperText="The more context you provide, the easier it is to evaluate the request accurately."
          error={errors.description?.message}
          {...register('description', { required: 'Description is required.' })}
        />

        <Paper
          p="md"
          radius="xl"
          withBorder
          style={{
            backgroundColor: 'var(--mantine-color-white)',
          }}
        >
          <Stack gap="md">
            <Text fz="sm" fw={700} c="dark">
              How should we classify this request?
            </Text>

            <Stack gap="xs">
              <Text fz="sm" fw={600}>
                Priority{' '}
                <span aria-hidden="true" style={{ color: 'var(--mantine-color-red-6)' }}>
                  *
                </span>
              </Text>

              <Controller
                name="rate"
                control={control}
                rules={{ required: 'Priority is required.', min: 1, max: 5 }}
                render={({ field }) => (
                  <PriorityPicker value={field.value} onChange={field.onChange} />
                )}
              />

              {errors.rate && (
                <Text fz="xs" c="red" role="alert">
                  {errors.rate.message}
                </Text>
              )}
            </Stack>

            <SimpleGrid cols={isAdmin ? 2 : 1} spacing="md">
              <Controller
                name="category_id"
                control={control}
                rules={{ required: 'Category is required.' }}
                render={({ field }) => (
                  <FormSelect
                    label="Category"
                    description="What area does this request belong to?"
                    withAsterisk
                    data={categoryData}
                    isLoading={isLoadingCategories}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? '')}
                    error={errors.category_id?.message}
                  />
                )}
              />

              {isAdmin && (
                <Controller
                  name="status_id"
                  control={control}
                  rules={{ required: 'Status is required.' }}
                  render={({ field }) => (
                    <FormSelect
                      label="Initial status"
                      description="Choose how this request should start."
                      withAsterisk
                      data={statusData}
                      isLoading={isLoadingStatuses}
                      value={field.value || null}
                      onChange={(value) => field.onChange(value ?? '')}
                      error={errors.status_id?.message}
                    />
                  )}
                />
              )}
            </SimpleGrid>
          </Stack>
        </Paper>

        <Text fz="xs" c="dimmed" ta="right">
          <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span> Required fields
        </Text>

        <FormActions
          layout="page"
          onCancel={onCancel}
          isPending={isPending}
          submitLabel="Submit Request"
          submitIcon={<IconSend size={16} />}
        />
      </Stack>
    </form>
  )
}
