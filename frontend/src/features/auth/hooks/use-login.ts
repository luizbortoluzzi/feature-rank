import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useCurrentUser } from '../../../app/AuthProvider'
import { login, type LoginPayload } from '../../../services/auth'

export function useLogin() {
  const navigate = useNavigate()
  const { onLoginSuccess } = useCurrentUser()

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => {
      onLoginSuccess()
      navigate('/features')
    },
  })

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
  }
}
