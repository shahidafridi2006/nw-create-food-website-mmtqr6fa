import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Dish, DishWithCategory } from '../types'

export function useDishes(categoryId?: string) {
  return useQuery({
    queryKey: categoryId ? queryKeys.dishes.byCategory(categoryId) : queryKeys.dishes.list(),
    queryFn: async (): Promise<DishWithCategory[]> => {
      let query = supabase
        .from('dishes')
        .select(`
          *,
          category:categories(*),
          reviews(*)
        `)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
      
      if (categoryId) {
        query = query.eq('category_id', categoryId)
      }
      
      const { data, error } = await query
      
      if (error) throw error
      return data || []
    },
  })
}

export function useFeaturedDishes() {
  return useQuery({
    queryKey: queryKeys.dishes.featured(),
    queryFn: async (): Promise<DishWithCategory[]> => {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          *,
          category:categories(*),
          reviews(*)
        `)
        .eq('is_featured', true)
        .eq('is_available', true)
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (error) throw error
      return data || []
    },
  })
}

export function useDish(id: string) {
  return useQuery({
    queryKey: queryKeys.dishes.detail(id),
    queryFn: async (): Promise<DishWithCategory | null> => {
      const { data, error } = await supabase
        .from('dishes')
        .select(`
          *,
          category:categories(*),
          reviews(*)
        `)
        .eq('id', id)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!id,
  })
}

export function useSearchDishes(searchTerm: string) {
  return useQuery({
    queryKey: [...queryKeys.dishes.all, 'search', searchTerm],
    queryFn: async (): Promise<Dish[]> => {
      const { data, error } = await supabase
        .from('dishes')
        .select('*')
        .eq('is_available', true)
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .order('name', { ascending: true })
        .limit(20)
      
      if (error) throw error
      return data || []
    },
    enabled: searchTerm.length >= 2,
  })
}