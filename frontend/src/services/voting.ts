import { apiClient } from './api'
import type { VoteResponse } from '../types/vote'

export async function castVote(featureId: number): Promise<VoteResponse> {
  const response = await apiClient.post(`/api/v1/features/${featureId}/vote/`)
  return response.data.data
}

export async function removeVote(featureId: number): Promise<VoteResponse> {
  const response = await apiClient.delete(`/api/v1/features/${featureId}/vote/`)
  return response.data.data
}
