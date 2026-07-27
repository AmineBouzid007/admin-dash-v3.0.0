'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Customer, DateRange, Order } from '@/lib/types'
import { eachDayBetween } from '@/lib/admin/date-ranges'

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw new Error(error.message)
  return data
}

export async function createCategory(input: { name: string; type: 'poster' | 'sticker' }) {
  const supabase = await createClient()
  const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name: input.name, slug, type: input.type }])
    .select()
    .single()
  if (error) throw new Error(error.message)
  revalidatePath('/admin')
  return data
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

function productFieldsFromFormData(formData: FormData) {
  const name = formData.get('name') as string
  const description = (formData.get('description') as string) || ''
  const price = parseFloat((formData.get('price') as string) || '0')
  const product_type = formData.get('product_type') as string
  const category = formData.get('category') as string
  const image_url = (formData.get('image_url') as string) || ''
  const material = (formData.get('material') as string) || null
  const is_featured = formData.get('is_featured') === 'true'
  const is_bestseller = formData.get('is_bestseller') === 'true'
  const ratingRaw = formData.get('rating') as string | null
  const rating = ratingRaw ? parseFloat(ratingRaw) : undefined

  const sizes = JSON.parse((formData.get('sizes') as string) || '[]')
  const frames = JSON.parse((formData.get('frames') as string) || '[]')
  const images = JSON.parse((formData.get('images') as string) || '[]')

  return {
    name,
    description,
    price,
    product_type,
    category,
    image_url,
    material,
    is_featured,
    is_bestseller,
    sizes,
    frames,
    images,
    ...(rating !== undefined ? { rating } : {}),
  }
}

export async function createProduct(formData: FormData) {
  console.log("CREATE PRODUCT CALLED")
  
  try {
    const supabase = await createClient()
    const fields = productFieldsFromFormData(formData)

    console.log("PRODUCT FIELDS:", fields)

    const slug =
      fields.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') +
      '-' +
      Math.random().toString(36).slice(2, 7)

    const { error } = await supabase
      .from('products')
      .insert([{ slug, ...fields }])

    if (error) {
      console.error("CREATE PRODUCT ERROR:", error)
      throw new Error(error.message)
    }

    revalidatePath('/admin/products')
    revalidatePath('/admin')

    return { success: true }

  } catch (error: any) {
    console.error("CREATE PRODUCT FAILED:", error)
    throw new Error(error.message || "Failed to create product")
  }
}


export async function updateProduct(id: string, formData: FormData) {
  const supabase = await createClient()
  const fields = productFieldsFromFormData(formData)

  const { error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/products')
  revalidatePath('/admin')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/products')
  revalidatePath('/admin')
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

// Explicit FK names (from the schema: order_items_order_id_fkey /
// order_items_product_id_fkey) so PostgREST never has to guess the
// relationship — avoids "Could not find a relationship" / ambiguous
// embed errors between orders <-> order_items <-> products.
const ORDER_SELECT =
  '*, order_items!order_items_order_id_fkey(*, products!order_items_product_id_fkey(id, name, image_url, slug))'

export async function getOrders(): Promise<{ data: Order[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getOrders: Supabase error', error)
      return { data: null, error: error.message }
    }
    return { data: data as unknown as Order[], error: null }
  } catch (err: any) {
    console.error('getOrders: unexpected error', err)
    return { data: null, error: err?.message || 'Unexpected error while loading orders.' }
  }
}

export async function getOrder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('orders').select(ORDER_SELECT).eq('id', id).single()
  if (error) throw new Error(error.message)
  return data
}

export async function updateOrderStatus(orderId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ status }).eq('id', orderId)

  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
  revalidatePath('/admin')
}

export async function updatePaymentStatus(orderId: string, payment_status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('orders').update({ payment_status }).eq('id', orderId)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/orders')
}

export interface CreateManualOrderInput {
  customer_name: string
  phone: string
  email?: string
  address: string
  city: string
  governorate: string
  postal_code?: string
  notes?: string
  shipping: number
  items: Array<{
    product_id: string
    product_name: string
    quantity: number
    size?: string
    frame?: string
    price: number
    image_url?: string
  }>
}

export type CreateManualOrderResult =
  | { success: true; order: Order; error: null }
  | { success: false; order: null; error: string }

export async function createManualOrder(
  orderData: CreateManualOrderInput
): Promise<CreateManualOrderResult> {
  try {
    // --- Validation up front, with specific, readable messages -----------
    const missingField = (
      ['customer_name', 'phone', 'address', 'city', 'governorate'] as const
    ).find((field) => !orderData[field] || !String(orderData[field]).trim())

    if (missingField) {
      return { success: false, order: null, error: `Missing required field: ${missingField}.` }
    }

    if (!orderData.items?.length) {
      return { success: false, order: null, error: 'An order needs at least one product.' }
    }

    const invalidItem = orderData.items.find(
      (item) => !item.product_id || !item.quantity || item.quantity < 1 || item.price < 0
    )
    if (invalidItem) {
      return {
        success: false,
        order: null,
        error: `Invalid item "${invalidItem.product_name || 'unknown product'}": check quantity and price.`,
      }
    }

    const supabase = await createClient()

    const subtotal = orderData.items.reduce((acc, item) => acc + item.price * item.quantity, 0)
    const shipping = Number(orderData.shipping) || 0
    const total = subtotal + shipping

    // Only real columns from public.orders — no invented/renamed fields.
    const { data: newOrder, error: orderError } = await supabase
      .from('orders')
      .insert([
        {
          customer_name: orderData.customer_name,
          phone: orderData.phone,
          email: orderData.email || 'no-email@stikky.tn',
          address: orderData.address,
          city: orderData.city,
          governorate: orderData.governorate,
          postal_code: orderData.postal_code || '',
          notes: orderData.notes || null,
          subtotal,
          shipping,
          total,
          payment_method: 'cod',
          payment_status: 'unpaid',
          status: 'pending',
        },
      ])
      .select()
      .single()

    if (orderError || !newOrder) {
      console.error('createManualOrder: failed to insert order', orderError)
      return {
        success: false,
        order: null,
        error: `Failed to create order: ${orderError?.message || 'unknown database error'}`,
      }
    }

    // Only real columns from public.order_items — no invented/renamed fields.
    const orderItemsData = orderData.items.map((item) => ({
      order_id: newOrder.id,
      product_id: item.product_id || null,
      product_name: item.product_name,
      quantity: item.quantity,
      size: item.size || null,
      frame: item.frame || null,
      price: item.price,
      image_url: item.image_url || null,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData)

    if (itemsError) {
      console.error('createManualOrder: failed to insert order_items', itemsError)
      // Roll back the order header so we don't leave an orphaned order with no items
      await supabase.from('orders').delete().eq('id', newOrder.id)
      return {
        success: false,
        order: null,
        error: `Failed to create order: ${itemsError.message}`,
      }
    }

    revalidatePath('/admin/orders')
    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/customers')

    return { success: true, order: newOrder as Order, error: null }
  } catch (err: any) {
    console.error('createManualOrder: unexpected error', err)
    return {
      success: false,
      order: null,
      error: `Failed to create order: ${err?.message || 'unexpected server error'}`,
    }
  }
}

// ---------------------------------------------------------------------------
// Customers (derived from orders — there is no customers table)
// ---------------------------------------------------------------------------

export async function getCustomers(): Promise<{ data: Customer[] | null; error: string | null }> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getCustomers: Supabase error', error)
      return { data: null, error: error.message }
    }

    const orders = (data || []) as unknown as Order[]
    const map = new Map<string, Customer>()

    for (const order of orders) {
      // Group by email first, falling back to phone when email is missing —
      // normalized (trimmed/lowercased) so formatting differences don't
      // split the same customer into duplicates.
      const normalizedEmail =
        order.email && order.email !== 'no-email@stikky.tn' ? order.email.trim().toLowerCase() : null
      const key = normalizedEmail || order.phone?.trim()

      if (!key) continue // can't group an order with neither email nor phone

      const existing = map.get(key)

      if (existing) {
        existing.ordersCount += 1
        existing.totalSpent += Number(order.total)
        existing.orders.push(order)
        if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = order.created_at
          existing.city = order.city
          existing.governorate = order.governorate
        }
      } else {
        map.set(key, {
          key,
          name: order.customer_name,
          phone: order.phone,
          email: order.email,
          city: order.city,
          governorate: order.governorate,
          ordersCount: 1,
          totalSpent: Number(order.total),
          avgOrderValue: 0,
          lastOrderDate: order.created_at,
          orders: [order],
        })
      }
    }

    const customers = Array.from(map.values()).map((c) => ({
      ...c,
      avgOrderValue: c.totalSpent / c.ordersCount,
    }))

    customers.sort((a, b) => new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime())
    return { data: customers, error: null }
  } catch (err: any) {
    console.error('getCustomers: unexpected error', err)
    return { data: null, error: err?.message || 'Unexpected error while loading customers.' }
  }
}

// ---------------------------------------------------------------------------
// Custom Requests
// ---------------------------------------------------------------------------

export async function getCustomRequests() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('custom_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}

export async function updateCustomRequestStatus(id: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('custom_requests').update({ status }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/custom-requests')
}

export async function updateCustomRequestPrice(id: string, estimated_price: number) {
  const supabase = await createClient()
  const { error } = await supabase.from('custom_requests').update({ estimated_price }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/custom-requests')
}

// ---------------------------------------------------------------------------
// Dashboard / Analytics
// ---------------------------------------------------------------------------

export async function getDashboardStats(range: DateRange) {
  const supabase = await createClient()

  const { data: rangeData, error: rangeError } = await supabase
    .from('orders')
    .select(ORDER_SELECT)
    .gte('created_at', range.from)
    .lte('created_at', range.to)
    .order('created_at', { ascending: true })

  if (rangeError) throw new Error(rangeError.message)
  const orders = (rangeData || []) as unknown as Order[]

  // "Today" is always literal today, independent of the selected filter.
  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const { data: todayData, error: todayError } = await supabase
    .from('orders')
    .select('id, total, status')
    .gte('created_at', todayStart.toISOString())
    .lte('created_at', todayEnd.toISOString())

  if (todayError) throw new Error(todayError.message)

  const nonCancelled = orders.filter((o) => o.status !== 'cancelled')

  const statusCounts = {
    pending: orders.filter((o) => o.status === 'pending').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
  }

  const totalRevenue = nonCancelled.reduce((sum, o) => sum + Number(o.total), 0)
  const totalOrders = orders.length
  const avgOrderValue = nonCancelled.length ? totalRevenue / nonCancelled.length : 0

  const revenueToday = (todayData || [])
    .filter((o: any) => o.status !== 'cancelled')
    .reduce((sum: number, o: any) => sum + Number(o.total), 0)
  const ordersToday = (todayData || []).length

  const customerKeys = new Set(
    orders.map((o) => (o.email && o.email !== 'no-email@stikky.tn' ? o.email.toLowerCase() : o.phone))
  )
  const totalCustomers = customerKeys.size

  // Daily buckets for charts
  const days = eachDayBetween(range.from, range.to)
  const revenueByDay = new Map(days.map((d) => [d, 0]))
  const ordersByDay = new Map(days.map((d) => [d, 0]))

  for (const order of orders) {
    const day = order.created_at.slice(0, 10)
    if (ordersByDay.has(day)) {
      ordersByDay.set(day, (ordersByDay.get(day) || 0) + 1)
      if (order.status !== 'cancelled') {
        revenueByDay.set(day, (revenueByDay.get(day) || 0) + Number(order.total))
      }
    }
  }

  const revenueOverTime = days.map((d) => ({ date: d, revenue: revenueByDay.get(d) || 0 }))
  const ordersOverTime = days.map((d) => ({ date: d, orders: ordersByDay.get(d) || 0 }))

  // Product / category performance from order_items in range
  const productStats = new Map<string, { id: string; name: string; image_url: string; timesOrdered: number; revenue: number }>()
  const categoryStats = new Map<string, { category: string; revenue: number; orders: number }>()

  for (const order of nonCancelled) {
    for (const item of order.order_items || []) {
      const productId = item.product_id || item.product_name
      const name = item.products?.name || item.product_name
      const existing = productStats.get(productId) || {
        id: productId,
        name,
        image_url: item.products?.image_url || item.image_url || '',
        timesOrdered: 0,
        revenue: 0,
      }
      existing.timesOrdered += item.quantity
      existing.revenue += Number(item.price) * item.quantity
      productStats.set(productId, existing)
    }
  }

  const topProducts = Array.from(productStats.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  const statusDistribution = [
    { status: 'pending', label: 'Pending', value: statusCounts.pending },
    { status: 'processing', label: 'Processing', value: statusCounts.processing },
    { status: 'shipped', label: 'Shipped', value: statusCounts.shipped },
    { status: 'delivered', label: 'Delivered', value: statusCounts.delivered },
    { status: 'cancelled', label: 'Cancelled', value: statusCounts.cancelled },
  ]

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)

  return {
    totalOrders,
    pendingOrders: statusCounts.pending,
    processingOrders: statusCounts.processing,
    shippedOrders: statusCounts.shipped,
    deliveredOrders: statusCounts.delivered,
    cancelledOrders: statusCounts.cancelled,
    totalRevenue,
    avgOrderValue,
    totalCustomers,
    revenueToday,
    ordersToday,
    revenueOverTime,
    ordersOverTime,
    topProducts,
    statusDistribution,
    recentOrders,
  }
}

export async function getCategoryPerformance(range: DateRange) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('status, order_items(quantity, price, products(category))')
    .gte('created_at', range.from)
    .lte('created_at', range.to)

  if (error) throw new Error(error.message)

  const categoryStats = new Map<string, { category: string; revenue: number; orders: number }>()

  for (const order of (data || []) as any[]) {
    if (order.status === 'cancelled') continue
    for (const item of order.order_items || []) {
      const category = item.products?.category || 'uncategorized'
      const existing = categoryStats.get(category) || { category, revenue: 0, orders: 0 }
      existing.revenue += Number(item.price) * item.quantity
      existing.orders += 1
      categoryStats.set(category, existing)
    }
  }

  return Array.from(categoryStats.values()).sort((a, b) => b.revenue - a.revenue)
}
