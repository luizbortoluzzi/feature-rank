export interface AuthUser {
  id: number
  username: string
  name: string
  email: string
  is_admin: boolean
  avatar_url: string | null
}
