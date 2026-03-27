type NavigateFn = (path: string) => void

let _navigate: NavigateFn | null = null

export function registerNavigate(fn: NavigateFn): void {
  _navigate = fn
}

export function redirectToLogin(): void {
  if (_navigate) {
    _navigate('/login')
  } else {
    window.location.href = '/login'
  }
}
