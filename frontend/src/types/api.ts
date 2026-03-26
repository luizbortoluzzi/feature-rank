export interface PaginationMeta {
  count: number
  next: string | null
  previous: string | null
  page: number
  page_size: number
  total_pages: number
}

export interface ApiError {
  code: string
  message: string
  details: Record<string, string[]> | null
}
