/**
 * In-memory access token store.
 *
 * The access token is never written to localStorage or sessionStorage.
 * It lives only in this module variable, which means it is lost on page
 * reload — that is intentional. The refresh cookie (HttpOnly, managed by
 * the backend) is used to silently restore the session on every page load.
 */

let _accessToken: string | null = null

export function getAccessToken(): string | null {
  return _accessToken
}

export function setAccessToken(token: string): void {
  _accessToken = token
}

export function clearAccessToken(): void {
  _accessToken = null
}
