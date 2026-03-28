export interface Category {
  id: number
  name: string
  icon: string
  color: string
}

export interface CategoryListItem extends Category {
  description: string
  is_active: boolean
  feature_count: number
  created_at: string
}
