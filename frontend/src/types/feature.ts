import type { Category } from './category'
import type { Status } from './status'

export interface FeatureAuthor {
  id: number
  name: string
  avatar_url: string | null
}

export interface FeatureRequestSummary {
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

export type FeatureRequest = FeatureRequestSummary
