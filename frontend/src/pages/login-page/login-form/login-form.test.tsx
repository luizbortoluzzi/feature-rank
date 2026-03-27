import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithMantine } from '../../../test/render'
import { LoginForm } from './index'
import type { ApiError } from '../../../types/api'

const baseProps = {
  onSubmit: vi.fn(),
  isPending: false,
  error: null,
  isMobile: false,
}

describe('LoginForm', () => {
  it('renders username and password fields', () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    expect(screen.getByLabelText(/Username/)).toBeDefined()
    expect(screen.getByLabelText(/Password/)).toBeDefined()
  })

  it('pre-fills username with default value', () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    expect(screen.getByDisplayValue('admin')).toBeDefined()
  })

  it('renders the Sign In button', () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    expect(screen.getByRole('button', { name: /Sign In/ })).toBeDefined()
  })

  it('shows non-field error when error has no details', () => {
    const error: ApiError = {
      code: 'auth_failed',
      message: 'Invalid username or password.',
      details: null,
      status: 401,
    }
    renderWithMantine(<LoginForm {...baseProps} error={error} />)
    expect(screen.getByText('Invalid username or password.')).toBeDefined()
  })

  it('does not show error alert when error is null', () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('does not show error alert when error has details (field-level only)', () => {
    const error: ApiError = {
      code: 'validation_error',
      message: 'Validation failed.',
      details: { username: ['This field is required.'] },
      status: 400,
    }
    renderWithMantine(<LoginForm {...baseProps} error={error} />)
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('shows validation error when username is submitted empty', async () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    // Clear the pre-filled username
    const usernameInput = screen.getByLabelText(/Username/)
    fireEvent.change(usernameInput, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /Sign In/ }))
    await waitFor(() => {
      expect(screen.getByText('Username is required.')).toBeDefined()
    })
  })

  it('renders social login buttons as disabled', () => {
    renderWithMantine(<LoginForm {...baseProps} />)
    expect(screen.getByRole('button', { name: /Continue with Google/ })).toBeDefined()
    expect(screen.getByRole('button', { name: /Continue with GitHub/ })).toBeDefined()
  })
})
