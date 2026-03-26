export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiError {
  code: string
  message: string
  details: Record<string, string[]> | null
  status?: number
}
