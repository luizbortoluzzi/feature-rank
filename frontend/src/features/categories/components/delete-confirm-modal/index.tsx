import { Button, Group, Modal, Stack, Text } from '@mantine/core'

interface DeleteConfirmModalProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  isPending: boolean
}

export function DeleteConfirmModal({
  opened,
  onClose,
  onConfirm,
  categoryName,
  isPending,
}: DeleteConfirmModalProps) {
  return (
    <Modal opened={opened} onClose={onClose} title="Delete Category" size="sm">
      <Stack gap="md">
        <Text fz="sm">
          Are you sure you want to delete <strong>{categoryName}</strong>? This action cannot be
          undone. Categories in use by feature requests cannot be deleted.
        </Text>
        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button color="red" onClick={onConfirm} loading={isPending}>
            Delete
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}
