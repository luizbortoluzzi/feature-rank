import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '../../../../components/button'
import { ErrorMessage } from '../../../../components/error-message'
import type { ApiError } from '../../../../types/api'

interface LoginFormFields {
  username: string
  password: string
}

interface LoginFormProps {
  onSubmit: (data: LoginFormFields) => void
  isPending: boolean
  error: ApiError | null
}

export function LoginForm({ onSubmit, isPending, error }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormFields>()

  useEffect(() => {
    if (error?.details) {
      Object.entries(error.details).forEach(([field, messages]) => {
        setError(field as keyof LoginFormFields, { message: messages[0] })
      })
    }
  }, [error, setError])

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {error && !error.details && <ErrorMessage error={error} />}

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
          Username{' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          aria-describedby={errors.username ? 'username-error' : undefined}
          {...register('username', { required: 'Username is required.' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.username && (
          <p id="username-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.username.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password{' '}
          <span aria-hidden="true" className="text-red-500">
            *
          </span>
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-describedby={errors.password ? 'password-error' : undefined}
          {...register('password', { required: 'Password is required.' })}
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {errors.password && (
          <p id="password-error" role="alert" className="mt-1 text-xs text-red-600">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isPending}
        disabled={isPending}
        className="w-full justify-center"
        aria-label={isPending ? 'Signing in…' : 'Sign in'}
      >
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
