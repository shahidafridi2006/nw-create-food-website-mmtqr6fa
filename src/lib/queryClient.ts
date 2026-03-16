import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: 2,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Query keys for consistent cache management
export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.categories.all, 'detail', id] as const,
  },
  dishes: {
    all: ['dishes'] as const,
    list: () => [...queryKeys.dishes.all, 'list'] as const,
    featured: () => [...queryKeys.dishes.all, 'featured'] as const,
    byCategory: (categoryId: string) => [...queryKeys.dishes.all, 'category', categoryId] as const,
    detail: (id: string) => [...queryKeys.dishes.all, 'detail', id] as const,
  },
  reviews: {
    all: ['reviews'] as const,
    byDish: (dishId: string) => [...queryKeys.reviews.all, 'dish', dishId] as const,
  },
  cart: {
    all: ['cart'] as const,
    items: (sessionId: string) => [...queryKeys.cart.all, 'items', sessionId] as const,
  },
  orders: {
    all: ['orders'] as const,
    detail: (id: string) => [...queryKeys.orders.all, 'detail', id] as const,
    bySession: (sessionId: string) => [...queryKeys.orders.all, 'session', sessionId] as const,
  },
}