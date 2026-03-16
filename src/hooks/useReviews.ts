import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Review, ReviewFormData } from '../types'
import toast from 'react-hot-toast'

export function useReviews(dishId: string) {
  return useQuery({
    queryKey: queryKeys.reviews.byDish(dishId),
    queryFn: async (): Promise<Review[]> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('dish_id', dishId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
    enabled: !!dishId,
  })
}

export function useAddReview() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ dishId, review }: { dishId: string; review: ReviewFormData }) => {
      const { data, error } = await supabase
        .from('reviews')
        .insert({
          dish_id: dishId,
          customer_name: review.customer_name,
          rating: review.rating,
          comment: review.comment,
        })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.reviews.byDish(variables.dishId) 
      })
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.dishes.detail(variables.dishId) 
      })
      toast.success('Review submitted successfully!')
    },
    onError: (error) => {
      toast.error('Failed to submit review')
      console.error('Add review error:', error)
    },
  })
}

export function useReviewStats(dishId: string) {
  const reviewsQuery = useReviews(dishId)
  
  const reviews = reviewsQuery.data || []
  
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0
  
  const ratingDistribution = {
    5: reviews.filter(r => r.rating === 5).length,
    4: reviews.filter(r => r.rating === 4).length,
    3: reviews.filter(r => r.rating === 3).length,
    2: reviews.filter(r => r.rating === 2).length,
    1: reviews.filter(r => r.rating === 1).length,
  }
  
  return {
    reviews,
    isLoading: reviewsQuery.isLoading,
    error: reviewsQuery.error,
    averageRating,
    totalReviews: reviews.length,
    ratingDistribution,
  }
}