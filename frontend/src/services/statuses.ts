import { apiClient } from './api'
import type { Status } from '../types/status'

export async function getStatuses(): Promise<Status[]> {
  const response = await apiClient.get('/api/statuses/')
  return response.data.data
}
