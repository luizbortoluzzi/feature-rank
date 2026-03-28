import { useState } from 'react'
import { Stack, TextInput, Button, Center } from '@mantine/core'
import { IconSearch, IconPlus, IconTag } from '@tabler/icons-react'
import { useIsMobile } from '../../hooks/use-is-mobile'
import { PageHeader } from '../../components/page-header'
import { useCurrentUser } from '../../app/AuthProvider'
import { useCategoryList } from '../../features/categories/hooks/use-category-list'
import { useCreateCategory } from '../../features/categories/hooks/use-create-category'
import { useUpdateCategory } from '../../features/categories/hooks/use-update-category'
import { useDeleteCategory } from '../../features/categories/hooks/use-delete-category'
import { Spinner } from '../../components/spinner'
import { ErrorMessage } from '../../components/error-message'
import { EmptyState } from '../../components/empty-state'
import { CategoryTable } from '../../features/categories/components/category-table'
import {
  CategoryFormModal,
  type CategoryFormValues,
} from '../../features/categories/components/category-form-modal'
import { DeleteConfirmModal } from '../../features/categories/components/delete-confirm-modal'
import type { CategoryListItem } from '../../types/category'
import type { CreateCategoryPayload, UpdateCategoryPayload } from '../../services/categories'

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
    createCategory(payload, { onSuccess: () => setCreateModalOpen(false) })
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
    updateCategory({ id: editTarget.id, payload }, { onSuccess: () => setEditTarget(null) })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return
    deleteCategory(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) })
  }

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

      {isLoading && (
        <Center py="xl">
          <Spinner size="lg" label="Loading categories…" />
        </Center>
      )}

      {isError && !isLoading && <ErrorMessage error={error} />}

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

      {!isLoading && !isError && categories.length > 0 && (
        <CategoryTable
          categories={categories}
          onEdit={setEditTarget}
          onDelete={setDeleteTarget}
          isAdmin={user?.is_admin ?? false}
          meta={meta}
          onPageChange={setPage}
        />
      )}

      <CategoryFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreate}
        title="New Category"
        isPending={isCreating}
        submitError={createError}
      />

      {editTarget && (
        <CategoryFormModal
          isOpen={!!editTarget}
          onClose={() => setEditTarget(null)}
          onSubmit={handleUpdate}
          defaultValues={editTarget}
          title={`Edit "${editTarget.name}"`}
          isPending={isUpdating}
          submitError={updateError}
        />
      )}

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
