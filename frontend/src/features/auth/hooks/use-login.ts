import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, type LoginPayload } from '../../../services/auth'
import { authKeys } from '../queryKeys'
import type { ApiError } from '../../../types/api'

interface UseLoginResult {
  login: (payload: LoginPayload) => void
  isPending: boolean
  isError: boolean
  error: ApiError | null
}

export function useLogin(): UseLoginResult {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: (tokenResponse) => {
      localStorage.setItem('access_token', tokenResponse.access)
      queryClient.invalidateQueries({ queryKey: authKeys.me() })
    },
  })

  return {
    login: mutation.mutate,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.isError ? (mutation.error as unknown as ApiError) : null,
  }
}
