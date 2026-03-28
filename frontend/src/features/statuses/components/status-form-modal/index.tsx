import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Group, Modal, Stack } from '@mantine/core'
import type { ApiError } from '../../../../types/api'
import { FormTextInput } from '../../../../components/form/text-input'
import { FormTextarea } from '../../../../components/form/textarea'
import { FormColorInput } from '../../../../components/form/color-input'
import { FormNumberInput } from '../../../../components/form/number-input'
import { FormSwitch } from '../../../../components/form/switch'
import { FormSubmitError } from '../../../../components/form/submit-error'
import { FormActions } from '../../../../components/form/actions'
import { useServerFieldErrors } from '../../../../hooks/use-server-field-errors'

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

  useServerFieldErrors(submitError, setError)

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={mode === 'create' ? 'New Status' : 'Edit Status'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Stack gap="lg">
          <FormSubmitError error={submitError} />

          <FormTextInput
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
              <FormColorInput
                label="Color"
                withAsterisk
                placeholder="#6B7280"
                value={field.value}
                onChange={field.onChange}
                error={errors.color?.message}
              />
            )}
          />

          <FormTextarea
            label="Description"
            placeholder="Brief description of this status"
            error={errors.description?.message}
            {...register('description')}
          />

          <Controller
            name="sort_order"
            control={control}
            rules={{
              required: 'Sort order is required.',
              min: { value: 0, message: 'Must be 0 or greater.' },
            }}
            render={({ field }) => (
              <FormNumberInput
                label="Sort Order"
                withAsterisk
                placeholder="0"
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
                <FormSwitch
                  label="Terminal state"
                  description="Mark as a final lifecycle state"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                />
              )}
            />

            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <FormSwitch
                  label="Active"
                  description="Show in active status filters"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.currentTarget.checked)}
                />
              )}
            />
          </Group>

          <FormActions
            layout="page"
            onCancel={onClose}
            isPending={isPending}
            submitLabel={mode === 'create' ? 'Create Status' : 'Save Changes'}
          />
        </Stack>
      </form>
    </Modal>
  )
}
