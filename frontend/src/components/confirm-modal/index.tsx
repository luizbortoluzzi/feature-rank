import { type ReactNode } from 'react'
import { Button, Group, Modal, Stack, Text } from '@mantine/core'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel: string
  confirmColor?: string
  isPending: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmColor = 'red',
  isPending,
}: ConfirmModalProps) {
  return (
    <Modal opened={isOpen} onClose={onClose} title={title} size="sm">
      <Stack gap="md">
        <Text fz="sm">{description}</Text>
        <Group justify="flex-end" gap="sm">
          <Button variant="default" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button color={confirmColor} onClick={onConfirm} loading={isPending}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
