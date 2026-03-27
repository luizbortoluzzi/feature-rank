import { Button, ColorInput, Group, Modal, Stack, Switch, Text, Textarea, TextInput } from '@mantine/core'
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
  opened: boolean
  onClose: () => void
  onSubmit: (values: CategoryFormValues) => void
  initialValues?: Partial<CategoryFormValues>
  title: string
  isPending: boolean
  submitError: { message: string; details?: Record<string, string[]> | null } | null
}

export function CategoryFormModal({
  opened,
  onClose,
  onSubmit,
  initialValues,
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
      name: initialValues?.name ?? '',
      description: initialValues?.description ?? '',
      icon: initialValues?.icon ?? '',
      color: initialValues?.color ?? '#4C6EF5',
      is_active: initialValues?.is_active ?? true,
    },
  })

  const iconValue = watch('icon')
  const colorValue = watch('color')
  const isActiveValue = watch('is_active')

  function handleClose() {
    reset()
    onClose()
  }

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="md">
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
            <Text c="red" fz="sm">
              {submitError.message}
            </Text>
          )}

          <Group justify="flex-end" mt="xs">
            <Button variant="subtle" color="gray" onClick={handleClose} disabled={isPending}>
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
