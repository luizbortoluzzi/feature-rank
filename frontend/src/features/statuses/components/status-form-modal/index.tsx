import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  NumberInput,
  ColorInput,
  Switch,
  Group,
  Button,
  Text,
} from '@mantine/core'
import type { ApiError } from '../../../../types/api'

export interface StatusFormFields {
  name: string
  color: string
  description: string
  sort_order: number
  is_terminal: boolean
  is_active: boolean
}

interface StatusFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: StatusFormFields) => void
  defaultValues?: Partial<StatusFormFields>
  isPending: boolean
  submitError: ApiError | null
  mode: 'create' | 'edit'
}

export function StatusFormModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  isPending,
  submitError,
  mode,
}: StatusFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm<StatusFormFields>({
    defaultValues: {
      name: '',
      color: '#6B7280',
      description: '',
      sort_order: 0,
      is_terminal: false,
      is_active: true,
      ...defaultValues,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        color: '#6B7280',
        description: '',
        sort_order: 0,
        is_terminal: false,
        is_active: true,
        ...defaultValues,
      })
    }
  }, [isOpen, defaultValues, reset])

  useEffect(() => {
    if (submitError?.details) {
      Object.entries(submitError.details).forEach(([field, messages]) => {
        setError(field as keyof StatusFormFields, { message: messages[0] })
      })
    }
  }, [submitError, setError])

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'New Status' : 'Edit Status'}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="md">
          {submitError && !submitError.details && (
            <Text c="red" fz="sm" role="alert">
              {submitError.message}
            </Text>
          )}

          <TextInput
            label="Name"
            withAsterisk
            placeholder="e.g. In Progress"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required.' })}
          />

          <Controller
            name="color"
            control={control}
            rules={{ required: 'Color is required.' }}
            render={({ field }) => (
              <ColorInput
                label="Color"
                withAsterisk
                placeholder="#6B7280"
                format="hex"
                value={field.value}
                onChange={field.onChange}
                error={errors.color?.message}
              />
            )}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of this status"
            rows={3}
            error={errors.description?.message}
            {...register('description')}
          />

          <Controller
            name="sort_order"
            control={control}
            rules={{ required: 'Sort order is required.', min: { value: 0, message: 'Must be 0 or greater.' } }}
            render={({ field }) => (
              <NumberInput
                label="Sort Order"
                withAsterisk
                placeholder="0"
                min={0}
                value={field.value}
                onChange={(val) => field.onChange(typeof val === 'number' ? val : 0)}
                error={errors.sort_order?.message}
              />
            )}
          />

          <Group gap="xl">
            <Controller
              name="is_terminal"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Terminal state"
                  description="Mark as a final lifecycle state"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  color="indigo"
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <Switch
                  label="Active"
                  description="Show in active status filters"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                  color="indigo"
                />
              )}
            />
          </Group>

          <Group justify="flex-end" gap="sm" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" color="indigo" loading={isPending}>
              {mode === 'create' ? 'Create Status' : 'Save Changes'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
