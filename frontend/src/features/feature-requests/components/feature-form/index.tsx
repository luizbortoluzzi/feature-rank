import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Alert,
  Badge,
  Button,
  Collapse,
  Group,
  Paper,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Textarea,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core'
import {
  IconAlertCircle,
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

const PRIORITY_LABELS: Record<number, { label: string; color: string; description: string }> = {
  1: { label: 'Very Low', color: 'gray', description: 'Nice to have, low urgency' },
  2: { label: 'Low', color: 'teal', description: 'Useful, but not time-sensitive' },
  3: { label: 'Medium', color: 'yellow', description: 'Meaningful improvement for users' },
  4: { label: 'High', color: 'orange', description: 'Important problem worth prioritizing' },
  5: { label: 'Critical', color: 'red', description: 'High-value issue with strong impact' },
}

function PriorityPicker({ value, onChange }: PriorityPickerProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value || 3
  const displayEntry = PRIORITY_LABELS[active] ?? PRIORITY_LABELS[3]

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
                  color: isActive
                    ? 'var(--mantine-color-indigo-5)'
                    : 'var(--mantine-color-gray-3)',
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

  useEffect(() => {
    if (submitError?.details) {
      Object.entries(submitError.details).forEach(([field, messages]) => {
        setError(field as keyof FeatureFormFields, { message: messages[0] })
      })
    }
  }, [submitError, setError])

  const titleValue = watch('title') ?? ''
  const descriptionValue = watch('description') ?? ''
  const titleLength = titleValue.length

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

  const titleCounterColor =
    titleLength > 90 ? 'red' : titleLength > 70 ? 'yellow.7' : 'dimmed'

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="lg">


        {submitError && !submitError.details && (
          <Alert
            color="red"
            variant="light"
            radius="xl"
            icon={<IconAlertCircle size={18} />}
            title="We couldn't submit your request"
          >
            {submitError.message}
          </Alert>
        )}

        <Stack gap="xs">
          <TextInput
            label="Feature title"
            description="Keep it short, specific, and easy to scan."
            withAsterisk
            placeholder="Enter a clear, concise title for your feature request"
            maxLength={100}
            size="md"
            error={errors.title?.message}
            {...register('title', { required: 'Title is required.' })}
          />

          <Group justify="space-between" px={8}>
            <Text fz="xs" c="dimmed">
              A strong title helps similar requests get discovered faster.
            </Text>
            <Text fz="xs" c={titleCounterColor}>
              {titleLength} / 100
            </Text>
          </Group>
        </Stack>

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

        <Stack gap="xs">
          <Textarea
            label="Description"
            description="Explain what problem this solves, who it helps, and why it matters."
            withAsterisk
            placeholder="Describe your feature request in detail. What problem does it solve? How would it benefit users?"
            rows={5}
            size="md"
            autosize
            minRows={5}
            maxRows={10}
            error={errors.description?.message}
            {...register('description', { required: 'Description is required.' })}
          />
          <Text fz="xs" c="dimmed" px={8}>
            The more context you provide, the easier it is to evaluate the request accurately.
          </Text>
        </Stack>

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
                  <Select
                    label="Category"
                    description="What area does this request belong to?"
                    withAsterisk
                    size="md"
                    placeholder={isLoadingCategories ? 'Loading…' : 'Select a category'}
                    data={categoryData}
                    disabled={isLoadingCategories}
                    value={field.value || null}
                    onChange={(value) => field.onChange(value ?? '')}
                    error={errors.category_id?.message}
                    searchable
                    nothingFoundMessage="No categories found"
                  />
                )}
              />

              {isAdmin && (
                <Controller
                  name="status_id"
                  control={control}
                  rules={{ required: 'Status is required.' }}
                  render={({ field }) => (
                    <Select
                      label="Initial status"
                      description="Choose how this request should start."
                      withAsterisk
                      size="md"
                      placeholder={isLoadingStatuses ? 'Loading…' : 'Select a status'}
                      data={statusData}
                      disabled={isLoadingStatuses}
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

        <Group justify="space-between" gap="sm">
          <Button
            variant="subtle"
            color="gray"
            onClick={onCancel}
            disabled={isPending}
            size="md"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="gradient"
            style={{ flex: 1 }}
            leftSection={<IconSend size={16} />}
            loading={isPending}
            size="md"
          >
            Submit Request
          </Button>
        </Group>
      </Stack>
    </form>
  )
}
