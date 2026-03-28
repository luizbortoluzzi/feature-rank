import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithMantine } from '../../../../test/render'
import { CategoryFormModal } from './index'

const baseProps = {
  opened: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  title: 'New Category',
  isPending: false,
  submitError: null,
}

describe('CategoryFormModal', () => {
  it('renders the modal title when opened', () => {
    renderWithMantine(<CategoryFormModal {...baseProps} />)
    expect(screen.getByText('New Category')).toBeDefined()
  })

  it('does not render content when closed', () => {
    renderWithMantine(<CategoryFormModal {...baseProps} opened={false} />)
    expect(screen.queryByText('New Category')).toBeNull()
  })

  it('renders name and description fields', () => {
    renderWithMantine(<CategoryFormModal {...baseProps} />)
    expect(screen.getByLabelText(/Name/)).toBeDefined()
    expect(screen.getByLabelText(/Description/)).toBeDefined()
  })

  it('shows validation error when name is empty on submit', async () => {
    renderWithMantine(<CategoryFormModal {...baseProps} />)
    const form = screen.getByRole('button', { name: 'Save' }).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined()
    })
  })

  it('does not call onSubmit when name is empty', async () => {
    const onSubmit = vi.fn()
    renderWithMantine(<CategoryFormModal {...baseProps} onSubmit={onSubmit} />)
    const form = screen.getByRole('button', { name: 'Save' }).closest('form')!
    fireEvent.submit(form)
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeDefined()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('pre-fills fields when initialValues are provided', () => {
    renderWithMantine(
      <CategoryFormModal
        {...baseProps}
        initialValues={{ name: 'Design', description: 'UI features' }}
      />,
    )
    expect(screen.getByDisplayValue('Design')).toBeDefined()
    expect(screen.getByDisplayValue('UI features')).toBeDefined()
  })

  it('shows a non-field error message from submitError', () => {
    renderWithMantine(
      <CategoryFormModal
        {...baseProps}
        submitError={{ message: 'Server error occurred', details: null }}
      />,
    )
    expect(screen.getByText('Server error occurred')).toBeDefined()
  })

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn()
    renderWithMantine(<CategoryFormModal {...baseProps} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalled()
  })

  it('disables Cancel button when isPending', () => {
    renderWithMantine(<CategoryFormModal {...baseProps} isPending={true} />)
    const cancelBtn = screen.getByRole('button', { name: 'Cancel' })
    expect(cancelBtn.hasAttribute('disabled')).toBe(true)
  })
})
