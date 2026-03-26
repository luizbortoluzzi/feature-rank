import { apiClient } from './api'
import type { Category } from '../types/category'

export async function getCategories(): Promise<Category[]> {
  const response = await apiClient.get('/api/categories/')
  return response.data.data
}
