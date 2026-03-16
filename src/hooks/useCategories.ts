import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Category } from '../types'

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.list(),
    queryFn: async (): Promise<Category[]> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true })
      
      if (error) throw error
      return data || []
    },
  })
}

export function useCategory(slug: string) {
  return useQuery({
    queryKey: queryKeys.categories.detail(slug),
    queryFn: async (): Promise<Category | null> => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('name', slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!slug,
  })
}