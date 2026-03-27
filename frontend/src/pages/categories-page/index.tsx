import { useState } from 'react'
import {
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  Button,
  Box,
  Center,
  Table,
  Paper,
  Badge,
  ActionIcon,
  Modal,
  Switch,
  ColorInput,
} from '@mantine/core'
import { useIsMobile } from '../../hooks/use-is-mobile'
import {
  IconSearch,
  IconPlus,
  IconPencil,
  IconTrash,
  IconTag,
} from '@tabler/icons-react'
import { PageHeader } from '../../components/page-header'
import { DataTable, type DataTableColumn } from '../../components/data-table'
import { IconPicker } from '../../features/categories/components/icon-picker'
import { useForm } from 'react-hook-form'
import * as LucideIcons from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCurrentUser } from '../../app/AuthProvider'
import { useCategoryList } from '../../features/categories/hooks/use-category-list'
import { useCreateCategory } from '../../features/categories/hooks/use-create-category'
import { useUpdateCategory } from '../../features/categories/hooks/use-update-category'
import { useDeleteCategory } from '../../features/categories/hooks/use-delete-category'
import { Spinner } from '../../components/spinner'
import { ErrorMessage } from '../../components/error-message'
import { EmptyState } from '../../components/empty-state'
import { Pagination } from '../../components/pagination'
import { formatDate } from '../../utils/formatDate'
import type { CategoryListItem } from '../../types/category'
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../../services/categories'

interface CategoryFormValues {
  name: string
  description: string
  icon: string
  color: string
  is_active: boolean
}

function CategoryIcon({ icon, color }: { icon: string; color: string }) {
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[icon]
  return (
    <Box
      style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: color || '#e9ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {IconComponent ? (
        <IconComponent size={16} color="white" />
      ) : (
        <span style={{ fontSize: 14 }}>{icon}</span>
      )}
    </Box>
  )
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

function CategoryFormModal({
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
            error={
              errors.name?.message ??
              submitError?.details?.name?.[0]
            }
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

interface DeleteConfirmModalProps {
  opened: boolean
  onClose: () => void
  onConfirm: () => void
  categoryName: string
  isPending: boolean
}

function DeleteConfirmModal({
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

export function CategoriesPage() {
  const { user } = useCurrentUser()
  const isMobile = useIsMobile()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<CategoryListItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CategoryListItem | null>(null)

  const params = { page, search: search || undefined }

  const { categories, meta, isLoading, isError, error } = useCategoryList(params)
  const { createCategory, isPending: isCreating, error: createError } = useCreateCategory()
  const { updateCategory, isPending: isUpdating, error: updateError } = useUpdateCategory()
  const { deleteCategory, isPending: isDeleting } = useDeleteCategory()

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleCreate(values: CategoryFormValues) {
    const payload: CreateCategoryPayload = {
      name: values.name,
      description: values.description || undefined,
      icon: values.icon || undefined,
      color: values.color || undefined,
      is_active: values.is_active,
    }
    createCategory(payload, {
      onSuccess: () => setCreateModalOpen(false),
    })
  }

  function handleUpdate(values: CategoryFormValues) {
    if (!editTarget) return
    const payload: UpdateCategoryPayload = {
      name: values.name,
      description: values.description,
      icon: values.icon,
      color: values.color,
      is_active: values.is_active,
    }
    updateCategory(
      { id: editTarget.id, payload },
      { onSuccess: () => setEditTarget(null) },
    )
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteCategory(deleteTarget.id, {
      onSuccess: () => setDeleteTarget(null),
    })
  }

  const columns: DataTableColumn[] = [
    { key: 'name', label: 'Category Name', sortable: true },
    { key: 'description', label: 'Description' },
    { key: 'features', label: 'Features', sortable: true },
    { key: 'status', label: 'Status' },
    { key: 'created', label: 'Created', sortable: true },
    ...(user?.is_admin ? [{ key: 'actions', label: 'Actions' } as DataTableColumn] : []),
  ]

  const rows = categories.map((category) => (
    <Table.Tr key={category.id}>
      <Table.Td>
        <Group gap="sm" wrap="nowrap">
          <CategoryIcon icon={category.icon} color={category.color} />
          <Text fw={500} fz="sm">
            {category.name}
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Text fz="sm" c="dimmed" lineClamp={2}>
          {category.description || '—'}
        </Text>
      </Table.Td>

      <Table.Td>
        <Group gap={4} wrap="nowrap">
          <Text fw={500} fz="sm">
            {category.feature_count}
          </Text>
          <Text fz="sm" c="dimmed">
            requests
          </Text>
        </Group>
      </Table.Td>

      <Table.Td>
        <Badge
          leftSection={
            <span
              style={{
                display: 'inline-block',
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: category.is_active ? '#2f9e44' : '#868e96',
              }}
            />
          }
          size="md"
          variant="light"
          radius="sm"
          style={{
            backgroundColor: category.is_active ? '#2f9e4418' : '#868e9618',
            color: category.is_active ? '#2f9e44' : '#868e96',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {category.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </Table.Td>

      <Table.Td>
        <Text fz="sm" c="dimmed">
          {formatDate(category.created_at)}
        </Text>
      </Table.Td>

      {user?.is_admin && (
        <Table.Td>
          <Group gap={4} wrap="nowrap">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={`Edit ${category.name}`}
              onClick={() => setEditTarget(category)}
            >
              <IconPencil size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="red"
              size="lg"
              aria-label={`Delete ${category.name}`}
              onClick={() => setDeleteTarget(category)}
            >
              <IconTrash size={18} />
            </ActionIcon>
          </Group>
        </Table.Td>
      )}
    </Table.Tr>
  ))

  return (
    <Stack gap="md">
      <PageHeader
        icon={IconTag}
        title="Categories"
        subtitle="Manage feature request categories"
        actions={
          <>
            <TextInput
              placeholder="Search categories..."
              leftSection={<IconSearch size={16} />}
              radius="md"
              size="sm"
              value={search}
              onChange={(e) => handleSearchChange(e.currentTarget.value)}
              style={isMobile ? { width: '100%' } : { minWidth: 220 }}
            />
            {user?.is_admin && (
              <Button
                leftSection={<IconPlus size={16} />}
                radius="md"
                fullWidth={isMobile}
                onClick={() => setCreateModalOpen(true)}
              >
                New Category
              </Button>
            )}
          </>
        }
      />

      {/* Loading */}
      {isLoading && (
        <Center py="xl">
          <Spinner size="lg" label="Loading categories…" />
        </Center>
      )}

      {/* Error */}
      {isError && !isLoading && <ErrorMessage error={error} />}

      {/* Empty */}
      {!isLoading && !isError && categories.length === 0 && (
        <EmptyState
          message={
            search ? 'No categories match the search.' : 'No categories have been created yet.'
          }
          action={
            search
              ? { label: 'Clear search', onClick: () => handleSearchChange('') }
              : user?.is_admin
                ? { label: 'Create the first category', onClick: () => setCreateModalOpen(true) }
                : undefined
          }
        />
      )}

      {/* Table (desktop) */}
      {!isLoading && !isError && categories.length > 0 && !isMobile && (
        <DataTable columns={columns} meta={meta} onPageChange={setPage} itemLabel="categories">
          {rows}
        </DataTable>
      )}

      {/* Card list (mobile) */}
      {!isLoading && !isError && categories.length > 0 && isMobile && (
        <Stack gap="sm">
          {categories.map((category) => (
            <Paper key={category.id} p="md" radius="md" withBorder>
              <Stack gap="xs">
                <Group justify="space-between" wrap="nowrap" align="flex-start">
                  <Group gap="sm" wrap="nowrap">
                    <CategoryIcon icon={category.icon} color={category.color} />
                    <Box>
                      <Text fw={600} fz="sm">{category.name}</Text>
                      <Text fz="xs" c="dimmed">{category.feature_count} requests</Text>
                    </Box>
                  </Group>
                  <Badge
                    size="sm"
                    variant="light"
                    radius="sm"
                    style={{
                      backgroundColor: category.is_active ? '#2f9e4418' : '#868e9618',
                      color: category.is_active ? '#2f9e44' : '#868e96',
                      flexShrink: 0,
                    }}
                  >
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </Group>

                {category.description && (
                  <Text fz="xs" c="dimmed" lineClamp={2}>{category.description}</Text>
                )}

                {user?.is_admin && (
                  <Group justify="flex-end" gap={4} mt={4}>
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="md"
                      aria-label={`Edit ${category.name}`}
                      onClick={() => setEditTarget(category)}
                    >
                      <IconPencil size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="md"
                      aria-label={`Delete ${category.name}`}
                      onClick={() => setDeleteTarget(category)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                )}
              </Stack>
            </Paper>
          ))}
          {meta && meta.total_pages > 1 && (
            <Group justify="center">
              <Pagination meta={meta} onPageChange={setPage} />
            </Group>
          )}
        </Stack>
      )}

      {/* Create modal */}
      <CategoryFormModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="New Category"
        isPending={isCreating}
        submitError={createError}
      />

      {/* Edit modal */}
      {editTarget && (
        <CategoryFormModal
          opened={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          initialValues={editTarget}
          title={`Edit "${editTarget.name}"`}
          isPending={isUpdating}
          submitError={updateError}
        />
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          opened={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
          categoryName={deleteTarget.name}
          isPending={isDeleting}
        />
      )}
    </Stack>
  )
}
