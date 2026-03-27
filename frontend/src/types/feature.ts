import type { Category } from './category'
import type { Status } from './status'
import type { PaginationMeta } from './api'

export interface FeatureAuthor {
  id: number
  name: string
  avatar_url: string | null
}

export interface FeatureRequest {
  id: number
  title: string
  description: string
  rate: number
  vote_count: number
  has_voted: boolean
  author: FeatureAuthor
  category: Category
  status: Status
  created_at: string
  updated_at: string
}

export interface CachedListData {
  items: FeatureRequest[]
  meta: PaginationMeta
}
