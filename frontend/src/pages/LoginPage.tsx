import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCurrentUser } from '../app/AuthProvider'
import { useLogin } from '../features/auth/hooks/use-login'
import { LoginForm } from '../features/auth/components/login-form'
import type { LoginPayload } from '../services/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { user, isLoading: isLoadingUser } = useCurrentUser()
  const { login, isPending, isError, error } = useLogin()

  useEffect(() => {
    if (!isLoadingUser && user) {
      navigate('/')
    }
  }, [user, isLoadingUser, navigate])

  function handleSubmit(payload: LoginPayload) {
    login(payload)
  }

  if (isLoadingUser) {
    return null
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Sign in</h1>

        <LoginForm
          onSubmit={handleSubmit}
          isPending={isPending}
          error={isError ? error : null}
        />

        <p className="mt-4 text-sm text-center text-gray-500">
          <Link to="/" className="text-blue-600 hover:text-blue-700 underline">
            Back to feature list
          </Link>
        </p>
      </div>
    </main>
  )
}
