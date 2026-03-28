import { apiClient } from './api'
import type { Category, CategoryListItem } from '../types/category'
import type { PaginationMeta } from '../types/api'

export interface CategoryListParams {
  page?: number
  search?: string
}

export interface CreateCategoryPayload {
  name: string
  description?: string
  icon?: string
  color?: string
  is_active?: boolean
}

export interface UpdateCategoryPayload {
  name?: string
  description?: string
  icon?: string
  color?: string
  is_active?: boolean
}

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get('/api/v1/categories/')
  return response.data.data
}

export async function getCategoryList(
  params?: CategoryListParams,
): Promise<{ items: CategoryListItem[]; meta: PaginationMeta }> {
  const response = await apiClient.get('/api/v1/categories/', { params })
  return { items: response.data.data, meta: response.data.meta }
}

export async function createCategory(payload: CreateCategoryPayload): Promise<CategoryListItem> {
  const response = await apiClient.post('/api/v1/categories/', payload)
  return response.data.data
}

export async function updateCategory(
  id: number,
  payload: UpdateCategoryPayload,
): Promise<CategoryListItem> {
  const response = await apiClient.patch(`/api/v1/categories/${id}/`, payload)
  return response.data.data
}

export async function deleteCategory(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/categories/${id}/`)
}
