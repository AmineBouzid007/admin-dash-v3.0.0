import React from "react"

export type NavigationSection =
  | "overview"
  | "orders"
  | "customers"
  | "designs"
  | "custom-requests"
  | "analytics"
  | "settings"

export interface NavigationItem {
  id: NavigationSection
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

// Matches public.orders.status CHECK constraint
export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled"

// Matches public.orders.payment_status CHECK constraint
export type PaymentStatus = "unpaid" | "paid" | "refunded" | "failed"

// Matches public.products.product_type / custom_requests.product_type CHECK constraint
export type ProductType = "poster" | "sticker"

export interface SizeOption {
  name: string
  price?: number
}

export interface FrameOptionValue {
  name: string
  price?: number
}

export interface Category {
  id: string
  name: string
  slug: string
  type: ProductType
  created_at: string
}

export interface Product {
  id: string
  slug: string
  name: string
  description: string
  price: number
  product_type: ProductType
  category: string
  image_url: string
  images: string[]
  sizes: SizeOption[]
  frames: FrameOptionValue[]
  material: string | null
  is_featured: boolean
  is_bestseller: boolean
  stock: number
  rating: number
  created_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_name: string
  price: number
  quantity: number
  size: string | null
  frame: string | null
  image_url: string | null
  products?: Pick<Product, "id" | "name" | "image_url" | "slug"> | null
}

export interface Order {
  id: string
  user_id: string | null
  customer_name: string
  phone: string
  email: string
  country: string
  address: string
  city: string
  governorate: string
  postal_code: string
  notes: string | null
  subtotal: number
  shipping: number
  total: number
  payment_method: "cod"
  payment_status: PaymentStatus
  status: OrderStatus
  created_at: string
  order_items?: OrderItem[]
}

export interface CustomRequest {
  id: string
  user_id: string | null
  name: string
  email: string
  phone: string
  product_type: ProductType
  size: string
  frame_option: string | null
  image_url: string | null
  notes: string | null
  estimated_price: number | null
  status: string
  created_at: string
}

// Customers are derived from orders (no customers table exists)
export interface Customer {
  key: string
  name: string
  phone: string
  email: string
  city: string
  governorate: string
  ordersCount: number
  totalSpent: number
  avgOrderValue: number
  lastOrderDate: string
  orders: Order[]
}

export interface MetricCard {
  label: string
  value: string | number
  change?: {
    value: number
    trend: "up" | "down" | "neutral"
  }
  period?: string
}

export type DateFilterPreset =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "this_month"
  | "this_year"
  | "custom"

export interface DateRange {
  from: string // ISO date string, inclusive
  to: string // ISO date string, inclusive
}
