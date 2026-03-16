// Types matching the Supabase database schema exactly

export interface Category {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string | null;
  is_featured: boolean;
  is_available: boolean;
  preparation_time_minutes: number | null;
  calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  spice_level: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  ingredients: string[] | null;
  allergens: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  dish_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface CartItem {
  id: string;
  session_id: string;
  dish_id: string;
  quantity: number;
  special_instructions: string | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  session_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  delivery_address: string | null;
  order_type: 'pickup' | 'delivery';
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  dish_id: string | null;
  dish_name: string;
  quantity: number;
  unit_price: number;
  special_instructions: string | null;
  created_at: string;
}

// Extended types with relations
export interface DishWithCategory extends Dish {
  category: Category | null;
  reviews: Review[];
}

export interface CartItemWithDish extends CartItem {
  dish: Dish;
}

// Form types
export interface ReviewFormData {
  customer_name: string;
  rating: number;
  comment: string;
}

export interface OrderFormData {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  delivery_address: string;
  order_type: 'pickup' | 'delivery';
  notes: string;
}

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
}