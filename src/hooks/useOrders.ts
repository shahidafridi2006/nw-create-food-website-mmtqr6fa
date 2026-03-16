import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, getSessionId } from '../lib/supabase'
import { queryKeys } from '../lib/queryClient'
import type { Order, OrderItem, OrderFormData, CartItemWithDish } from '../types'
import toast from 'react-hot-toast'

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: async (): Promise<Order | null> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()
      
      if (error && error.code !== 'PGRST116') throw error
      return data
    },
    enabled: !!orderId,
  })
}

export function useOrderItems(orderId: string) {
  return useQuery({
    queryKey: [...queryKeys.orders.detail(orderId), 'items'],
    queryFn: async (): Promise<OrderItem[]> => {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true })
      
      if (error) throw error
      return data || []
    },
    enabled: !!orderId,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  const sessionId = getSessionId()
  
  return useMutation({
    mutationFn: async ({ 
      formData, 
      cartItems 
    }: { 
      formData: OrderFormData
      cartItems: CartItemWithDish[] 
    }): Promise<Order> => {
      // Calculate total
      const totalAmount = cartItems.reduce(
        (sum, item) => sum + (item.dish?.price || 0) * item.quantity,
        0
      )
      
      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          session_id: sessionId,
          customer_name: formData.customer_name,
          customer_email: formData.customer_email,
          customer_phone: formData.customer_phone || null,
          delivery_address: formData.delivery_address || null,
          order_type: formData.order_type,
          total_amount: totalAmount,
          notes: formData.notes || null,
          status: 'pending',
        })
        .select()
        .single()
      
      if (orderError) throw orderError
      
      // Create order items
      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        dish_id: item.dish_id,
        dish_name: item.dish?.name || '',
        quantity: item.quantity,
        unit_price: item.dish?.price || 0,
        special_instructions: item.special_instructions,
      }))
      
      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)
      
      if (itemsError) throw itemsError
      
      // Clear cart
      const { error: clearError } = await supabase
        .from('cart_items')
        .delete()
        .eq('session_id', sessionId)
      
      if (clearError) throw clearError
      
      return order
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.items(sessionId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.bySession(sessionId) })
      toast.success('Order placed successfully!')
    },
    onError: (error) => {
      toast.error('Failed to place order')
      console.error('Create order error:', error)
    },
  })
}

export function useOrdersBySession() {
  const sessionId = getSessionId()
  
  return useQuery({
    queryKey: queryKeys.orders.bySession(sessionId),
    queryFn: async (): Promise<Order[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    },
  })
}