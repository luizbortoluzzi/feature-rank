import type { ReactNode } from 'react'
import { Button, Group } from '@mantine/core'

interface FormActionsProps {
  onCancel: () => void
  isPending: boolean
  submitLabel: string
  cancelLabel?: string
  submitIcon?: ReactNode
  layout?: 'page' | 'modal'
}

export function FormActions({
  onCancel,
  isPending,
  submitLabel,
  cancelLabel = 'Cancel',
  submitIcon,
  layout = 'modal',
}: FormActionsProps) {
  if (layout === 'page') {
    return (
      <Group justify="space-between" gap="sm">
        <Button variant="subtle" color="gray" onClick={onCancel} disabled={isPending} size="md">
          {cancelLabel}
        </Button>
        <Button
          type="submit"
          variant="gradient"
          style={{ flex: 1 }}
          leftSection={submitIcon}
          loading={isPending}
          size="md"
        >
          {submitLabel}
        </Button>
      </Group>
    )
  }

  return (
    <Group justify="flex-end" gap="sm" mt="xs">
      <Button variant="default" onClick={onCancel} disabled={isPending}>
        {cancelLabel}
      </Button>
      <Button type="submit" color="indigo" loading={isPending} leftSection={submitIcon}>
        {submitLabel}
      </Button>
    </Group>
  )
}
