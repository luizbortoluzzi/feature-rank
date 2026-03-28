import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Modal, Stack } from '@mantine/core'
import { IconPicker } from '../icon-picker'
import { FormTextInput } from '../../../../components/form/text-input'
import { FormTextarea } from '../../../../components/form/textarea'
import { FormColorInput } from '../../../../components/form/color-input'
import { FormSwitch } from '../../../../components/form/switch'
import { FormSubmitError } from '../../../../components/form/submit-error'
import { FormActions } from '../../../../components/form/actions'
import { useServerFieldErrors } from '../../../../hooks/use-server-field-errors'

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
    control,
    setError,
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

  useServerFieldErrors(submitError, setError)

  return (
    <Modal opened={isOpen} onClose={onClose} title={title} size="lg">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <FormSubmitError error={submitError} />

          <FormTextInput
            label="Name"
            placeholder="e.g. Core Feature"
            withAsterisk
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />

          <FormTextarea
            label="Description"
            placeholder="Brief description of this category"
            error={errors.description?.message}
            {...register('description')}
          />

          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <IconPicker
                value={field.value}
                onChange={field.onChange}
                error={errors.icon?.message}
              />
            )}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <FormColorInput
                label="Color"
                placeholder="#4C6EF5"
                value={field.value}
                onChange={field.onChange}
                error={errors.color?.message}
              />
            )}
          />

          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <FormSwitch
                label="Active"
                description="Inactive categories are hidden from feature submission forms"
                checked={field.value}
                onChange={(e) => field.onChange(e.currentTarget.checked)}
              />
            )}
          />

          <FormActions
            layout="page"
            onCancel={onClose}
            isPending={isPending}
            submitLabel="Save"
          />
        </Stack>
      </form>
    </Modal>
  )
}
