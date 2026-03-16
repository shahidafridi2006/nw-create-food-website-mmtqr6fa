import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getSessionId } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { CartItem, CartItemWithDish } from '../types'
import toast from 'react-hot-toast'

export function useCart() {
  const sessionId = getSessionId()
  const queryClient = useQueryClient()
  
  const cartQuery = useQuery({
    queryKey: queryKeys.cart.items(sessionId),
    queryFn: async (): Promise<CartItemWithDish[]> => {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          dish:dishes(*)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
  })
  
  const addToCart = useMutation({
    mutationFn: async ({ dishId, quantity = 1, specialInstructions = '' }: { 
      dishId: string
      quantity?: number
      specialInstructions?: string 
    }) => {
      // Check if item already exists in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('session_id', sessionId)
        .eq('dish_id', dishId)
        .single()
      
      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ 
            quantity: existingItem.quantity + quantity,
            special_instructions: specialInstructions || existingItem.special_instructions
          })
          .eq('id', existingItem.id)
        
        if (error) throw error
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            session_id: sessionId,
            dish_id: dishId,
            quantity,
            special_instructions: specialInstructions,
          })
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(sessionId) })
      toast.success('Added to cart!')
    },
    onError: (error) => {
      toast.error('Failed to add to cart')
      console.error('Add to cart error:', error)
    },
  })
  
  const updateQuantity = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', itemId)
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity })
          .eq('id', itemId)
        
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(sessionId) })
    },
    onError: () => {
      toast.error('Failed to update quantity')
    },
  })
  
  const removeFromCart = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(sessionId) })
      toast.success('Removed from cart')
    },
    onError: () => {
      toast.error('Failed to remove from cart')
    },
  })
  
  const clearCart = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(sessionId) })
    },
  })
  
  const cartTotal = cartQuery.data?.reduce((total, item) => {
    return total + (item.dish?.price || 0) * item.quantity
  }, 0) || 0
  
  const cartItemCount = cartQuery.data?.reduce((count, item) => {
    return count + item.quantity
  }, 0) || 0
  
  return {
    cart: cartQuery.data || [],
    isLoading: cartQuery.isLoading,
    error: cartQuery.error,
    cartTotal,
    cartItemCount,
    addToCart: addToCart.mutate,
    isAddingToCart: addToCart.isPending,
    updateQuantity: updateQuantity.mutate,
    isUpdating: updateQuantity.isPending,
    removeFromCart: removeFromCart.mutate,
    isRemoving: removeFromCart.isPending,
    clearCart: clearCart.mutate,
    isClearing: clearCart.isPending,
  }
}