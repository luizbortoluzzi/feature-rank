import { useState, useEffect } from 'react'
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
  Divider,
  Collapse,
  Badge,
} from '@mantine/core'
import {
  IconStar,
  IconStarFilled,
  IconSend,
  IconBulb,
  IconChevronDown,
  IconChevronUp,
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

interface StarPickerProps {
  value: number
  onChange: (value: number) => void
}

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Very Low', color: 'gray' },
  2: { label: 'Low', color: 'teal' },
  3: { label: 'Medium', color: 'yellow' },
  4: { label: 'High', color: 'orange' },
  5: { label: 'Critical', color: 'red' },
}

function StarPicker({ value, onChange }: StarPickerProps) {
  const [hovered, setHovered] = useState(0)
  const active = hovered || value
  const displayEntry = PRIORITY_LABELS[hovered || value] ?? PRIORITY_LABELS[3]

  return (
    <Stack gap={4}>
      <Group gap="xs" align="center">
        <Group gap={2}>
          {[1, 2, 3, 4, 5].map((star) => (
            <ActionIcon
              key={star}
              variant="transparent"
              size="lg"
              aria-label={`Rate ${star}`}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              style={{
                color:
                  star <= active ? 'var(--mantine-color-yellow-5)' : 'var(--mantine-color-gray-3)',
                transition: 'color 100ms ease, transform 100ms ease',
                transform: star <= active ? 'scale(1.15)' : 'scale(1)',
              }}
            >
              {star <= active ? <IconStarFilled size={22} /> : <IconStar size={22} />}
            </ActionIcon>
          ))}
        </Group>
        <Badge color={displayEntry.color} variant="light" size="sm">
          {displayEntry.label}
        </Badge>
      </Group>
      <Group justify="space-between" px={8}>
        <Text fz="xs" c="dimmed">
          Your self-assessed importance (1 = lowest, 5 = highest)
        </Text>
      </Group>
    </Stack>
  )
}

const DIVIDER_STYLES = {
  label: {
    fontWeight: 600 as const,
    fontSize: 'var(--mantine-font-size-xs)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    color: 'var(--mantine-color-dimmed)',
  },
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
  const [tipsOpen, setTipsOpen] = useState(false)

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

  const titleLength = watch('title').length

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
        {/* Required fields note */}

        {/* Non-field submit error */}
        {submitError && !submitError.details && (
          <Text c="red" fz="sm" role="alert">
            {submitError.message}
          </Text>
        )}

        {/* Feature Title + character counter */}
        <Stack gap={4}>
          <TextInput
            label="Feature Title"
            withAsterisk
            placeholder="Enter a clear, concise title for your feature request"
            maxLength={100}
            error={errors.title?.message}
            {...register('title', { required: 'Title is required.' })}
          />
          <Group justify="space-between" px={8}>
            <Text fz="xs" c="dimmed">
              Keep it short and descriptive
            </Text>
            <Text fz="xs" c={titleLength > 90 ? 'red' : 'dimmed'}>
              {titleLength} / 100
            </Text>
          </Group>
        </Stack>

        {/* Description */}
        <Stack gap={4}>
          <Textarea
            label="Description"
            withAsterisk
            placeholder="Describe your feature request in detail. What problem does it solve? How would it benefit users?"
            rows={5}
            error={errors.description?.message}
            {...register('description', { required: 'Description is required.' })}
          />
          <Group justify="space-between" px={8}>
            <Text fz="xs" c="dimmed">
              Be as detailed as possible to help our team understand your request
            </Text>
          </Group>
        </Stack>

        {/* ── Classification ───────────────── */}
        <Divider label="Classification" labelPosition="left" styles={DIVIDER_STYLES} />

        {/* Priority */}
        <Stack gap={4}>
          <Text fz="sm" fw={500}>
            Priority{' '}
            <span aria-hidden="true" style={{ color: 'var(--mantine-color-red-6)' }}>
              *
            </span>
          </Text>
          <Controller
            name="rate"
            control={control}
            rules={{ required: 'Priority is required.', min: 1, max: 5 }}
            render={({ field }) => <StarPicker value={field.value} onChange={field.onChange} />}
          />
          {errors.rate && (
            <Text fz="xs" c="red" role="alert">
              {errors.rate.message}
            </Text>
          )}
        </Stack>

        {/* Category — full width for non-admin, two columns for admin */}
        <SimpleGrid cols={isAdmin ? 2 : 1} spacing="md">
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
          {isAdmin && (
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
          )}
        </SimpleGrid>

        {/* Collapsible tips */}
        <Stack gap={0}>
          <Button
            variant="subtle"
            color="indigo"
            size="xs"
            leftSection={<IconBulb size={14} />}
            rightSection={tipsOpen ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            onClick={() => setTipsOpen((o) => !o)}
            justify="space-between"
            fullWidth
            styles={{
              root: {
                borderRadius: 'var(--mantine-radius-md)',
                backgroundColor: 'var(--mantine-color-indigo-0)',
                border: '1px solid var(--mantine-color-indigo-2)',
              },
              inner: { width: '100%' },
            }}
          >
            Tips or a Great Feature Request
          </Button>
          <Collapse in={tipsOpen}>
            <Paper
              p="md"
              radius="md"
              mt={4}
              style={{
                backgroundColor: 'var(--mantine-color-indigo-0)',
                border: '1px solid var(--mantine-color-indigo-2)',
              }}
            >
              <Stack gap={4}>
                {[
                  "Be specific about the problem you're trying to solve",
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
          </Collapse>
        </Stack>
        <Text fz="xs" c="dimmed" ta="right">
          <span style={{ color: 'var(--mantine-color-red-6)' }}>*</span> Required fields
        </Text>
        {/* Buttons */}
        <Group gap="sm">
          <Button variant="outline" color="gray" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
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
