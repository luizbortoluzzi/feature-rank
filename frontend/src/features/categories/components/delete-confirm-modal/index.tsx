import { ConfirmModal } from '../../../../components/confirm-modal'

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
    <ConfirmModal
      isOpen={opened}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Delete Category"
      description={
        <>
          Are you sure you want to delete <strong>{categoryName}</strong>? This action cannot be
          undone. Categories in use by feature requests cannot be deleted.
        </>
      }
      confirmLabel="Delete"
      isPending={isPending}
    />
  )
}
