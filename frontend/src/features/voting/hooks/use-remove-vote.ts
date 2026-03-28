import { useMutation, useQueryClient } from '@tanstack/react-query'
import { featureKeys } from '../../feature-requests/queryKeys'
import { removeVote } from '../../../services/voting'
import type { CachedListData, FeatureRequest } from '../../../types/feature'
import type { ApiError } from '../../../types/api'
import type { FeatureListParams } from '../../../services/features'
import { useNotify } from '../../../hooks/use-notify'

interface UseRemoveVoteResult {
  removeVote: (featureId: number) => void
  isPending: boolean
  removingId: number | null
  isError: boolean
  error: ApiError | null
}

export function useRemoveVote(params?: FeatureListParams): UseRemoveVoteResult {
  const queryClient = useQueryClient()
  const notify = useNotify()

  const mutation = useMutation({
    mutationFn: (featureId: number) => removeVote(featureId),
    onMutate: async (featureId: number) => {
      if (params) {
        await queryClient.cancelQueries({ queryKey: featureKeys.list(params) })
      }
      await queryClient.cancelQueries({ queryKey: featureKeys.detail(featureId) })

      const previousList = params
        ? queryClient.getQueryData<CachedListData>(featureKeys.list(params))
        : undefined
      const previousDetail = queryClient.getQueryData<FeatureRequest>(featureKeys.detail(featureId))

      if (previousList && params) {
        queryClient.setQueryData<CachedListData>(featureKeys.list(params), {
          ...previousList,
          items: previousList.items.map((f) =>
            f.id === featureId
              ? { ...f, has_voted: false, vote_count: Math.max(0, f.vote_count - 1) }
              : f,
          ),
        })
      }

      if (previousDetail) {
        queryClient.setQueryData<FeatureRequest>(featureKeys.detail(featureId), {
          ...previousDetail,
          has_voted: false,
          vote_count: Math.max(0, previousDetail.vote_count - 1),
        })
      }

      return { previousList, previousDetail }
    },
    onSuccess: (voteResponse) => {
      notify.success('Vote removed.')
      const { feature_request_id, has_voted, vote_count } = voteResponse

      if (params) {
        const listData = queryClient.getQueryData<CachedListData>(featureKeys.list(params))
        if (listData) {
          queryClient.setQueryData<CachedListData>(featureKeys.list(params), {
            ...listData,
            items: listData.items.map((f) =>
              f.id === feature_request_id ? { ...f, has_voted, vote_count } : f,
            ),
          })
        }
      }

      const detailData = queryClient.getQueryData<FeatureRequest>(
        featureKeys.detail(feature_request_id),
      )
      if (detailData) {
        queryClient.setQueryData<FeatureRequest>(featureKeys.detail(feature_request_id), {
          ...detailData,
          has_voted,
          vote_count,
        })
      }
    },
    onError: (err: ApiError, featureId, context) => {
      if (context?.previousList && params) {
        queryClient.setQueryData(featureKeys.list(params), context.previousList)
      }
      if (context?.previousDetail) {
        queryClient.setQueryData(featureKeys.detail(featureId), context.previousDetail)
      }
      notify.error('Could not remove vote', err)
    },
  })

  return {
    removeVote: mutation.mutate,
    isPending: mutation.isPending,
    removingId: mutation.isPending ? (mutation.variables ?? null) : null,
    isError: mutation.isError,
    error: mutation.isError ? mutation.error : null,
  }
}
