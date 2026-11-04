import 'server-only'

import crypto from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getCurrentUser } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Database } from '@/types/database.types'

export type OrderStatus = Database['public']['Enums']['order_status']
export type PaymentStatus = Database['public']['Enums']['payment_status']
export type PaymentRecordStatus = Database['public']['Enums']['payment_record_status']
export type ShipmentStatus = Database['public']['Enums']['shipment_status']

export interface ViewerOrderQuery {
  orderNumber: string
  token?: string
}

export interface OrderViewItem {
  id: string
  variantId: string | null
  productName: string
  sku: string
  size: string | null
  color: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export interface OrderViewAddress {
  recipientName: string
  phone: string
  province: string
  city: string
  district: string
  postalCode: string
  addressDetail: string
}

export interface OrderViewHistory {
  id: string
  fromStatus: OrderStatus | null
  toStatus: OrderStatus
  fromPaymentStatus: PaymentStatus | null
  toPaymentStatus: PaymentStatus
  createdAt: string
}

export interface OrderViewPayment {
  id: string
  amount: number
  method: string
  status: PaymentRecordStatus
  bankName: string | null
  senderName: string | null
  submittedAt: string | null
  reviewedAt: string | null
  reviewNote: string | null
}

export interface OrderViewShipment {
  id: string
  courier: string
  service: string | null
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
  status: ShipmentStatus
  note: string | null
}

export interface StoreBankAccount {
  bank: string
  accountNumber: string
  accountName: string
}

export interface OrderView {
  id: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  expiresAt: string
  paidAt: string | null
  shippedAt: string | null
  cancelReason: string | null
  subtotal: number
  shippingCost: number
  discountAmount: number
  grandTotal: number
  notes: string | null
  customer: {
    name: string
    phone: string
    email: string | null
  }
  shippingAddress: OrderViewAddress
  items: OrderViewItem[]
  statusHistory: OrderViewHistory[]
  latestPayment: OrderViewPayment | null
  shipment: OrderViewShipment | null
  bankAccounts: StoreBankAccount[]
  isViewerOwner: boolean
  publicToken?: string
  contactWhatsApp?: string | null
}

/**
 * Membandingkan dua token secara timing-safe (crypto.timingSafeEqual).
 * Mencegah serangan timing attack pada pengecekan public_token pesanan tamu.
 */
export function verifyViewerToken(provided?: string | null, expected?: string | null): boolean {
  if (!provided || !expected) return false
  if (typeof provided !== 'string' || typeof expected !== 'string') return false
  const bufA = Buffer.from(provided, 'utf8')
  const bufB = Buffer.from(expected, 'utf8')
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

/**
 * Service untuk mengambil data pesanan untuk penampil (viewer) di /orders/[orderNumber].
 * Mematuhi §10.5 (admin client diizinkan di services/orders.public.service.ts).
 * Otorisasi:
 * - Izinkan bila viewer adalah pemilik pesanan (session.user.id === order.user_id)
 * - Atau token pada query cocok dengan order.public_token (timing-safe)
 * - Tanpa token dan bukan pemilik: kembalikan null -> memicu notFound() di layer page.
 */
export async function getOrderForViewer(
  query: ViewerOrderQuery,
  customClient?: SupabaseClient<Database>
): Promise<OrderView | null> {
  const orderNumber = query.orderNumber?.trim()
  if (!orderNumber) {
    return null
  }

  let currentUser: { id: string } | null = null
  try {
    currentUser = await getCurrentUser()
  } catch {
    currentUser = null
  }

  const client = customClient ?? createAdminClient()

  // 1. Ambil data pesanan utama
  const { data: order, error: orderError } = await client
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .maybeSingle()

  if (orderError || !order) {
    return null
  }

  // 2. Otorisasi akses: Pemilik (sesi) ATAU Token Tamu (timing-safe)
  const isOwner = Boolean(currentUser?.id && order.user_id && currentUser.id === order.user_id)
  const hasValidToken = verifyViewerToken(query.token, order.public_token)

  if (!isOwner && !hasValidToken) {
    return null
  }

  // 3. Ambil data terkait (items, status history, shipments, payments, store settings)
  const [itemsRes, historyRes, shipmentRes, paymentRes, settingsRes] = await Promise.all([
    client.from('order_items').select('*').eq('order_id', order.id).order('id', { ascending: true }),
    client.from('order_status_history').select('*').eq('order_id', order.id).order('created_at', { ascending: true }),
    client.from('shipments').select('*').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('payments').select('*').eq('order_id', order.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    client.from('store_settings').select('bank_accounts, contact_whatsapp').eq('id', 1).maybeSingle(),
  ])

  const addressRaw = (order.shipping_address_snapshot && typeof order.shipping_address_snapshot === 'object'
    ? order.shipping_address_snapshot
    : {}) as Record<string, unknown>

  const shippingAddress: OrderViewAddress = {
    recipientName: String(addressRaw.recipient_name ?? order.customer_name_snapshot ?? ''),
    phone: String(addressRaw.phone ?? order.customer_phone_snapshot ?? ''),
    province: String(addressRaw.province ?? ''),
    city: String(addressRaw.city ?? ''),
    district: String(addressRaw.district ?? ''),
    postalCode: String(addressRaw.postal_code ?? ''),
    addressDetail: String(addressRaw.address_detail ?? ''),
  }

  const rawAccounts = Array.isArray(settingsRes.data?.bank_accounts)
    ? (settingsRes.data.bank_accounts as Array<Record<string, unknown>>)
    : []

  const bankAccounts: StoreBankAccount[] = rawAccounts
    .filter((acc) => acc && typeof acc === 'object')
    .map((acc) => ({
      bank: String(acc.bank ?? ''),
      accountNumber: String(acc.account_number ?? ''),
      accountName: String(acc.account_name ?? ''),
    }))

  const items: OrderViewItem[] = (itemsRes.data ?? []).map((it) => ({
    id: it.id,
    variantId: it.variant_id,
    productName: it.product_name_snapshot,
    sku: it.sku_snapshot,
    size: it.size_snapshot,
    color: it.color_snapshot,
    unitPrice: it.unit_price,
    quantity: it.quantity,
    lineTotal: it.line_total,
  }))

  const statusHistory: OrderViewHistory[] = (historyRes.data ?? []).map((h) => ({
    id: h.id,
    fromStatus: h.from_status,
    toStatus: h.to_status,
    fromPaymentStatus: h.from_payment_status,
    toPaymentStatus: h.to_payment_status,
    createdAt: h.created_at,
  }))

  const shipment: OrderViewShipment | null = shipmentRes.data
    ? {
        id: shipmentRes.data.id,
        courier: shipmentRes.data.courier,
        service: shipmentRes.data.service,
        trackingNumber: shipmentRes.data.tracking_number,
        shippedAt: shipmentRes.data.shipped_at,
        deliveredAt: shipmentRes.data.delivered_at,
        status: shipmentRes.data.status,
        note: shipmentRes.data.note,
      }
    : null

  const latestPayment: OrderViewPayment | null = paymentRes.data
    ? {
        id: paymentRes.data.id,
        amount: paymentRes.data.amount,
        method: paymentRes.data.method,
        status: paymentRes.data.status,
        bankName: paymentRes.data.bank_name,
        senderName: paymentRes.data.sender_name,
        submittedAt: paymentRes.data.submitted_at,
        reviewedAt: paymentRes.data.reviewed_at,
        reviewNote: paymentRes.data.review_note,
      }
    : null

  return {
    id: order.id,
    orderNumber: order.order_number,
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
    expiresAt: order.expires_at,
    paidAt: order.paid_at,
    shippedAt: order.shipped_at,
    cancelReason: order.cancel_reason,
    subtotal: order.subtotal,
    shippingCost: order.shipping_cost,
    discountAmount: order.discount_amount,
    grandTotal: order.grand_total,
    notes: order.notes,
    customer: {
      name: order.customer_name_snapshot,
      phone: order.customer_phone_snapshot,
      email: order.customer_email_snapshot,
    },
    shippingAddress,
    items,
    statusHistory,
    latestPayment,
    shipment,
    bankAccounts,
    isViewerOwner: isOwner,
    publicToken: hasValidToken ? order.public_token : undefined,
    contactWhatsApp: settingsRes.data?.contact_whatsapp ?? null,
  }
}
