import { screen, fireEvent } from '@testing-library/react'
import { renderWithMantine } from '../../../../test/render'
import { CategoryTable } from './index'
import type { CategoryListItem } from '../../../../types/category'

const mockCategory: CategoryListItem = {
  id: 1,
  name: 'Design',
  description: 'UI/UX feature requests',
  icon: 'Palette',
  color: '#4C6EF5',
  is_active: true,
  feature_count: 5,
  created_at: '2024-01-01T00:00:00Z',
}

const baseProps = {
  categories: [mockCategory],
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  isAdmin: false,
}

describe('CategoryTable', () => {
  it('renders category name', () => {
    renderWithMantine(<CategoryTable {...baseProps} />)
    expect(screen.getByText('Design')).toBeDefined()
  })

  it('renders category description', () => {
    renderWithMantine(<CategoryTable {...baseProps} />)
    expect(screen.getByText('UI/UX feature requests')).toBeDefined()
  })

  it('renders feature count', () => {
    renderWithMantine(<CategoryTable {...baseProps} />)
    expect(screen.getByText('5')).toBeDefined()
  })

  it('hides edit and delete buttons for non-admin', () => {
    renderWithMantine(<CategoryTable {...baseProps} isAdmin={false} />)
    expect(screen.queryByLabelText('Edit Design')).toBeNull()
    expect(screen.queryByLabelText('Delete Design')).toBeNull()
  })

  it('shows edit and delete buttons for admin', () => {
    renderWithMantine(<CategoryTable {...baseProps} isAdmin={true} />)
    expect(screen.getByLabelText('Edit Design')).toBeDefined()
    expect(screen.getByLabelText('Delete Design')).toBeDefined()
  })

  it('calls onEdit with the category when edit is clicked', () => {
    const onEdit = vi.fn()
    renderWithMantine(<CategoryTable {...baseProps} isAdmin={true} onEdit={onEdit} />)
    fireEvent.click(screen.getByLabelText('Edit Design'))
    expect(onEdit).toHaveBeenCalledWith(mockCategory)
  })

  it('calls onDelete with the category when delete is clicked', () => {
    const onDelete = vi.fn()
    renderWithMantine(<CategoryTable {...baseProps} isAdmin={true} onDelete={onDelete} />)
    fireEvent.click(screen.getByLabelText('Delete Design'))
    expect(onDelete).toHaveBeenCalledWith(mockCategory)
  })

  it('renders multiple categories', () => {
    const second: CategoryListItem = { ...mockCategory, id: 2, name: 'Backend' }
    renderWithMantine(<CategoryTable {...baseProps} categories={[mockCategory, second]} />)
    expect(screen.getByText('Design')).toBeDefined()
    expect(screen.getByText('Backend')).toBeDefined()
  })
})
