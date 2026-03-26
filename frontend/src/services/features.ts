import { apiClient } from './api'
import type { FeatureRequest, FeatureRequestSummary } from '../types/feature'
import type { PaginationMeta } from '../types/api'

export interface FeatureListParams {
  page?: number
  category_id?: number
  status_id?: number
  search?: string
}

export interface CreateFeaturePayload {
  title: string
  description: string
  rate: number
  category_id: number
}

export interface UpdateFeaturePayload {
  title?: string
  description?: string
  rate?: number
  category_id?: number
}

export async function getFeatureList(
  params: FeatureListParams,
): Promise<{ items: FeatureRequestSummary[]; meta: PaginationMeta }> {
  const response = await apiClient.get('/api/v1/features/', { params })
  return { items: response.data.data, meta: response.data.meta }
}

export async function getFeatureById(id: number): Promise<FeatureRequest> {
  const response = await apiClient.get(`/api/v1/features/${id}/`)
  return response.data.data
}

export async function createFeature(payload: CreateFeaturePayload): Promise<FeatureRequest> {
  const response = await apiClient.post('/api/v1/features/', payload)
  return response.data.data
}

export async function updateFeature(
  id: number,
  payload: UpdateFeaturePayload,
): Promise<FeatureRequest> {
  const response = await apiClient.patch(`/api/v1/features/${id}/`, payload)
  return response.data.data
}

export async function deleteFeature(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/features/${id}/`)
}
