import { useEffect } from 'react'
import {
  Button,
  ColorInput,
  Group,
  Modal,
  Stack,
  Switch,
  Text,
  Textarea,
  TextInput,
} from '@mantine/core'
import { useForm } from 'react-hook-form'
import { IconPicker } from '../icon-picker'

export interface CategoryFormValues {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

interface CategoryFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (values: CategoryFormValues) => void
  defaultValues?: Partial<CategoryFormValues>
  title: string
  isPending: boolean
  submitError: { message: string; details?: Record<string, string[]> | null } | null
}

export function CategoryFormModal({
  isOpen,
  onClose,
  onSubmit,
  defaultValues,
  title,
  isPending,
  submitError,
}: CategoryFormModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    defaultValues: {
      name: '',
      description: '',
      icon: '',
      color: '#4C6EF5',
      is_active: true,
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        name: defaultValues?.name ?? '',
        description: defaultValues?.description ?? '',
        icon: defaultValues?.icon ?? '',
        color: defaultValues?.color ?? '#4C6EF5',
        is_active: defaultValues?.is_active ?? true,
      })
    }
  }, [isOpen, defaultValues, reset])

  const iconValue = watch('icon')
  const colorValue = watch('color')
  const isActiveValue = watch('is_active')

  return (
    <Modal opened={isOpen} onClose={onClose} title={title} size="md">
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack gap="sm">
          <TextInput
            label="Name"
            placeholder="e.g. Core Feature"
            required
            error={errors.name?.message ?? submitError?.details?.name?.[0]}
            {...register('name', { required: 'Name is required' })}
          />

          <Textarea
            label="Description"
            placeholder="Brief description of this category"
            rows={3}
            error={submitError?.details?.description?.[0]}
            {...register('description')}
          />

          <IconPicker
            value={iconValue}
            onChange={(val) => setValue('icon', val)}
            error={submitError?.details?.icon?.[0]}
          />

          <ColorInput
            label="Color"
            placeholder="#4C6EF5"
            value={colorValue}
            onChange={(val) => setValue('color', val)}
            error={submitError?.details?.color?.[0]}
          />

          <Switch
            label="Active"
            description="Inactive categories are hidden from feature submission forms"
            checked={isActiveValue}
            onChange={(e) => setValue('is_active', e.currentTarget.checked)}
          />

          {submitError && !submitError.details && (
            <Text c="red" fz="sm" role="alert">
              {submitError.message}
            </Text>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}
