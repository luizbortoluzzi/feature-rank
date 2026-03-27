import { useState } from 'react'
import { Stack, Group, Title, Text, TextInput, Button, Box, Center, Paper, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconSearch, IconPlus } from '@tabler/icons-react'
import { useStatusList } from '../../features/statuses/hooks/use-status-list'
import { useCreateStatus } from '../../features/statuses/hooks/use-create-status'
import { useUpdateStatus } from '../../features/statuses/hooks/use-update-status'
import { useDeleteStatus } from '../../features/statuses/hooks/use-delete-status'
import { StatusTable } from '../../features/statuses/components/status-table'
import {
  StatusFormModal,
  type StatusFormFields,
} from '../../features/statuses/components/status-form-modal'
import { Spinner } from '../../components/spinner'
import { ErrorMessage } from '../../components/error-message'
import { EmptyState } from '../../components/empty-state'
import { Pagination } from '../../components/pagination'
import type { Status } from '../../types/status'

export function StatusesPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [isFormOpen, { open: openForm, close: closeForm }] = useDisclosure(false)
  const [isConfirmOpen, { open: openConfirm, close: closeConfirm }] = useDisclosure(false)
  const [editingStatus, setEditingStatus] = useState<Status | null>(null)
  const [pendingDeleteStatus, setPendingDeleteStatus] = useState<Status | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const params = { page, search: search || undefined }
  const { statuses, meta, isLoading, isError, error } = useStatusList(params)

  const { createStatus, isPending: isCreating, error: createError } = useCreateStatus()
  const { updateStatus, isPending: isUpdating, error: updateError } = useUpdateStatus()
  const { deleteStatus, isPending: isDeleting, deletingId } = useDeleteStatus()

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleOpenCreate() {
    setEditingStatus(null)
    openForm()
  }

  function handleOpenEdit(status: Status) {
    setEditingStatus(status)
    openForm()
  }

  function handleCloseForm() {
    closeForm()
    setEditingStatus(null)
  }

  function handleSubmitForm(data: StatusFormFields) {
    if (editingStatus) {
      updateStatus(
        { id: editingStatus.id, payload: data },
        { onSuccess: handleCloseForm },
      )
    } else {
      createStatus(data, { onSuccess: handleCloseForm })
    }
  }

  function handleToggleActive(status: Status) {
    setTogglingId(status.id)
    updateStatus(
      { id: status.id, payload: { is_active: !status.is_active } },
      {
        onSuccess: () => setTogglingId(null),
        onError: () => setTogglingId(null),
      },
    )
  }

  function handleDeleteRequest(status: Status) {
    setPendingDeleteStatus(status)
    openConfirm()
  }

  function handleConfirmDelete() {
    if (!pendingDeleteStatus) return
    deleteStatus(pendingDeleteStatus.id, {
      onSuccess: () => {
        closeConfirm()
        setPendingDeleteStatus(null)
      },
      onError: () => {
        closeConfirm()
        setPendingDeleteStatus(null)
      },
    })
  }

  const startItem = meta ? (meta.page - 1) * meta.limit + 1 : 0
  const endItem = meta ? Math.min(meta.page * meta.limit, meta.total) : 0

  const isPending = isCreating || isUpdating
  const submitError = editingStatus ? updateError : createError

  const modalDefaultValues = editingStatus
    ? {
        name: editingStatus.name,
        color: editingStatus.color,
        description: editingStatus.description,
        sort_order: editingStatus.sort_order,
        is_terminal: editingStatus.is_terminal,
        is_active: editingStatus.is_active,
      }
    : undefined

  return (
    <Stack gap="md">
      {/* Page header */}
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Status List</Title>
          <Text c="dimmed" fz="sm" mt={2}>
            Manage feature request statuses
          </Text>
        </Box>
        <Group gap="sm">
          <TextInput
            placeholder="Search status..."
            leftSection={<IconSearch size={16} />}
            radius="md"
            size="sm"
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            style={{ minWidth: 220 }}
          />
          <Button
            leftSection={<IconPlus size={16} />}
            radius="md"
            variant='gradient'
            onClick={handleOpenCreate}
          >
            New Status
          </Button>
        </Group>
      </Group>

      {isLoading && (
        <Center py="xl">
          <Spinner size="lg" label="Loading statuses…" />
        </Center>
      )}

      {isError && !isLoading && <ErrorMessage error={error} />}

      {!isLoading && !isError && statuses.length === 0 && (
        <EmptyState
          message={search ? 'No statuses match your search.' : 'No statuses have been created yet.'}
          action={
            !search
              ? { label: 'Create the first status', onClick: handleOpenCreate }
              : undefined
          }
        />
      )}

      {!isLoading && !isError && statuses.length > 0 && (
        <Stack gap="sm">
          <Paper withBorder radius="md" p={0} style={{ overflow: 'hidden' }}>
            <StatusTable
              statuses={statuses}
              onEdit={handleOpenEdit}
              onDelete={handleDeleteRequest}
              onToggleActive={handleToggleActive}
              deletingId={isDeleting ? deletingId : null}
              togglingId={togglingId}
            />
          </Paper>

          {meta && (
            <Group justify="space-between" align="center" px={4}>
              <Text size="sm" c="dimmed">
                Showing{' '}
                <Text span fw={500} c="dark">
                  {startItem}–{endItem}
                </Text>{' '}
                of{' '}
                <Text span fw={500} c="dark">
                  {meta.total}
                </Text>{' '}
                statuses
              </Text>
              <Pagination meta={meta} onPageChange={(p) => setPage(p)} />
            </Group>
          )}
        </Stack>
      )}

      {/* Create / Edit modal */}
      <StatusFormModal
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmitForm}
        defaultValues={modalDefaultValues}
        isPending={isPending}
        submitError={submitError}
        mode={editingStatus ? 'edit' : 'create'}
      />

      {/* Delete confirmation modal */}
      <Modal
        opened={isConfirmOpen}
        onClose={closeConfirm}
        title="Delete Status"
        size="sm"
      >
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete{' '}
            <Text span fw={600}>
              {pendingDeleteStatus?.name}
            </Text>
            ? This action cannot be undone.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={closeConfirm} disabled={isDeleting}>
              Cancel
            </Button>
            <Button color="red" onClick={handleConfirmDelete} loading={isDeleting}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
