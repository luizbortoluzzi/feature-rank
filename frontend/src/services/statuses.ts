import { apiClient } from './api'
import type { Status } from '../types/status'
import type { PaginationMeta } from '../types/api'

export interface StatusListParams {
  page?: number
  search?: string
}

export interface CreateStatusPayload {
  name: string
  color: string
  description?: string
  is_terminal?: boolean
  is_active?: boolean
  sort_order: number
}

export interface UpdateStatusPayload {
  name?: string
  color?: string
  description?: string
  is_terminal?: boolean
  is_active?: boolean
  sort_order?: number
}

export async function getStatuses(): Promise<Status[]> {
  const response = await apiClient.get('/api/v1/statuses/')
  return response.data.data
}

export async function getStatusList(
  params: StatusListParams,
): Promise<{ items: Status[]; meta: PaginationMeta }> {
  const response = await apiClient.get('/api/v1/statuses/', { params })
  return { items: response.data.data, meta: response.data.meta }
}

export async function createStatus(payload: CreateStatusPayload): Promise<Status> {
  const response = await apiClient.post('/api/v1/statuses/', payload)
  return response.data.data
}

export async function updateStatus(id: number, payload: UpdateStatusPayload): Promise<Status> {
  const response = await apiClient.patch(`/api/v1/statuses/${id}/`, payload)
  return response.data.data
}

export async function deleteStatus(id: number): Promise<void> {
  await apiClient.delete(`/api/v1/statuses/${id}/`)
}
