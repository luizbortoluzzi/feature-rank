import type { FeatureListParams } from '../../services/features'

export const featureKeys = {
  all: ['features'] as const,
  list: (params: FeatureListParams) => ['features', 'list', params] as const,
  detail: (id: number) => ['features', 'detail', id] as const,
}
