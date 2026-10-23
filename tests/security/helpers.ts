import { randomUUID } from 'node:crypto'
import { createClient, type PostgrestError } from '@supabase/supabase-js'
import { getPublicEnv, serverEnv } from '@/lib/env'
import type { Database, Json } from '@/types/database.types'

/** Semua data uji memakai prefiks ini agar pembersihan tidak menyentuh data lain. */
export const TEST_PREFIX = 'rls-test'
export const PROOF_BUCKET = 'payment-proofs'

const clientOptions = {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
} as const

function makeClient(key: string) {
  return createClient<Database>(getPublicEnv().NEXT_PUBLIC_SUPABASE_URL, key, clientOptions)
}

export type DbClient = ReturnType<typeof makeClient>
type CreateOrderArgs = Database['public']['Functions']['create_order']['Args']

export function anonClient(): DbClient {
  return makeClient(getPublicEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
}

/** Melewati RLS. Hanya untuk menyiapkan, memeriksa, dan membersihkan data uji. */
export function serviceClient(): DbClient {
  return makeClient(serverEnv().SUPABASE_SECRET_KEY)
}

/** Prefiks unik per file tes, mis. `rls-test-1a2b3c4d`. */
export function newRunPrefix(): string {
  return `${TEST_PREFIX}-${randomUUID().slice(0, 8)}`
}

function fail(context: string, error: { message: string; code?: string } | null): never {
  throw new Error(`${context}: ${error?.code ?? ''} ${error?.message ?? 'tanpa data'}`.trim())
}

// ---------- Pengguna uji ----------

export type TestRole = 'customerA' | 'customerB' | 'staff' | 'admin'

export interface TestUser {
  id: string
  email: string
  client: DbClient
}

const STAFF_ROLE: Partial<Record<TestRole, 'staff' | 'admin'>> = { staff: 'staff', admin: 'admin' }

export async function createTestUsers<R extends TestRole>(
  service: DbClient,
  prefix: string,
  roles: readonly R[],
): Promise<Record<R, TestUser>> {
  const password = `${randomUUID()}Aa1!`
  const users = {} as Record<R, TestUser>

  for (const role of roles) {
    const email = `${prefix}-${role.toLowerCase()}@example.com`
    const { data, error } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `${prefix} ${role}` },
    })
    if (error || !data.user) fail(`createUser ${role}`, error)

    const staffRole = STAFF_ROLE[role]
    if (staffRole) {
      const { error: roleError } = await service
        .from('staff_roles')
        .insert({ user_id: data.user.id, role: staffRole })
      if (roleError) fail(`staff_roles ${role}`, roleError)
    }

    const client = anonClient()
    const { error: signInError } = await client.auth.signInWithPassword({ email, password })
    if (signInError) fail(`signIn ${role}`, signInError)

    users[role] = { id: data.user.id, email, client }
  }
  return users
}

// ---------- Katalog uji ----------

export async function createCategory(service: DbClient, prefix: string, suffix: string): Promise<string> {
  const slug = `${prefix}-${suffix}`
  const { data, error } = await service
    .from('categories')
    .insert({ name: slug, slug, sort_order: 999 })
    .select('id')
    .single()
  if (error || !data) fail('insert category', error)
  return data.id
}

export async function createProduct(
  service: DbClient,
  opts: { prefix: string; suffix: string; categoryId: string; isActive?: boolean },
): Promise<string> {
  const slug = `${opts.prefix}-${opts.suffix}`
  const { data, error } = await service
    .from('products')
    .insert({ category_id: opts.categoryId, name: slug, slug, is_active: opts.isActive ?? true })
    .select('id')
    .single()
  if (error || !data) fail('insert product', error)
  return data.id
}

export async function createVariant(
  service: DbClient,
  opts: {
    prefix: string
    suffix: string
    productId: string
    price: number
    stock: number
    isActive?: boolean
  },
): Promise<string> {
  const sku = `${opts.prefix}-${opts.suffix}`
  const { data, error } = await service
    .from('product_variants')
    .insert({
      product_id: opts.productId,
      sku,
      color_name: sku, // unik per produk (uq_variant_combo)
      price: opts.price,
      stock_quantity: opts.stock,
      is_active: opts.isActive ?? true,
    })
    .select('id')
    .single()
  if (error || !data) fail('insert variant', error)
  return data.id
}

export async function getVariant(service: DbClient, variantId: string) {
  const { data, error } = await service
    .from('product_variants')
    .select('stock_quantity, price')
    .eq('id', variantId)
    .single()
  if (error || !data) fail('select variant', error)
  return data
}

export async function getStock(service: DbClient, variantId: string): Promise<number> {
  return (await getVariant(service, variantId)).stock_quantity
}

// ---------- Pesanan uji ----------

export interface OrderResult {
  order_id: string
  order_number: string
  public_token: string
  replayed: boolean
}

export function shippingAddress(province = 'Jawa Barat'): Json {
  return {
    recipient_name: 'Penerima Uji',
    phone: '081200000000',
    province,
    city: 'Bandung',
    district: 'Coblong',
    postal_code: '40132',
    address_detail: 'Jl. Uji No. 1',
  }
}

/** Nama pelanggan memuat prefiks run agar pesanan uji bisa dibersihkan. */
export function orderArgs(opts: {
  prefix: string
  items: { variant_id: string; quantity: number }[]
  userId?: string | null
  idempotencyKey?: string
  address?: Json
}): CreateOrderArgs {
  return {
    p_idempotency_key: opts.idempotencyKey ?? randomUUID(),
    // Tipe hasil generate tidak memuat null, padahal SQL menerima null untuk tamu.
    p_user_id: (opts.userId ?? null) as string,
    p_customer_name: `${opts.prefix} Pelanggan`,
    p_customer_phone: '081200000000',
    p_customer_email: '',
    p_shipping_address: opts.address ?? shippingAddress(),
    p_items: opts.items,
  }
}

function toOrderResult(data: Json | null): OrderResult | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null
  const { order_id, order_number, public_token, replayed } = data
  if (
    typeof order_id !== 'string' ||
    typeof order_number !== 'string' ||
    typeof public_token !== 'string' ||
    typeof replayed !== 'boolean'
  ) {
    return null
  }
  return { order_id, order_number, public_token, replayed }
}

export async function callCreateOrder(
  client: DbClient,
  args: CreateOrderArgs,
): Promise<{ result: OrderResult | null; error: PostgrestError | null }> {
  const { data, error } = await client.rpc('create_order', args)
  return { result: toOrderResult(data), error }
}

export async function createOrder(client: DbClient, args: CreateOrderArgs): Promise<OrderResult> {
  const { result, error } = await callCreateOrder(client, args)
  if (error || !result) fail('create_order', error)
  return result
}

// ---------- Pembersihan ----------

async function listTestUserIds(service: DbClient, prefix: string): Promise<string[]> {
  const ids: string[] = []
  const perPage = 1000
  for (let page = 1; ; page++) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error) fail('listUsers', error)
    for (const user of data.users) {
      if (user.email?.startsWith(prefix)) ids.push(user.id)
    }
    if (data.users.length < perPage) return ids
  }
}

async function listTestProofPaths(service: DbClient, prefix: string): Promise<string[]> {
  const bucket = service.storage.from(PROOF_BUCKET)
  const { data: folders, error } = await bucket.list('', { limit: 1000, search: prefix })
  if (error) fail('storage list', error)

  const paths: string[] = []
  for (const folder of folders.filter((entry) => entry.name.startsWith(prefix))) {
    const { data: files, error: filesError } = await bucket.list(folder.name, { limit: 1000 })
    if (filesError) fail('storage list folder', filesError)
    paths.push(...files.map((file) => `${folder.name}/${file.name}`))
  }
  return paths
}

/**
 * Menghapus semua data yang berawalan `prefix`. Urutan mengikuti foreign key:
 * pesanan (cascade ke item, riwayat, pembayaran, pengiriman) → produk (cascade ke varian,
 * gambar, pergerakan stok) → kategori → tarif → bukti transfer → pengguna.
 */
export async function cleanupTestData(service: DbClient, prefix: string): Promise<void> {
  const like = `${prefix}%`
  const steps = [
    service.from('orders').delete().like('customer_name_snapshot', like),
    service.from('products').delete().like('slug', like),
    service.from('categories').delete().like('slug', like),
    service.from('shipping_rates').delete().like('province', like),
  ]
  for (const step of steps) {
    const { error } = await step
    if (error) fail('cleanup', error)
  }

  const proofPaths = await listTestProofPaths(service, prefix)
  if (proofPaths.length > 0) {
    const { error } = await service.storage.from(PROOF_BUCKET).remove(proofPaths)
    if (error) fail('cleanup storage', error)
  }

  for (const id of await listTestUserIds(service, prefix)) {
    const { error } = await service.auth.admin.deleteUser(id)
    if (error) fail('cleanup user', error)
  }
}

/** Jumlah sisa data uji per jenis; semuanya harus 0 setelah `cleanupTestData`. */
export async function countTestData(service: DbClient, prefix: string) {
  const like = `${prefix}%`
  const count = async (
    query: PromiseLike<{ count: number | null; error: PostgrestError | null }>,
  ): Promise<number> => {
    const { count: total, error } = await query
    if (error) fail('count', error)
    return total ?? 0
  }

  return {
    orders: await count(
      service.from('orders').select('id', { count: 'exact', head: true }).like('customer_name_snapshot', like),
    ),
    categories: await count(
      service.from('categories').select('id', { count: 'exact', head: true }).like('slug', like),
    ),
    products: await count(
      service.from('products').select('id', { count: 'exact', head: true }).like('slug', like),
    ),
    variants: await count(
      service.from('product_variants').select('id', { count: 'exact', head: true }).like('sku', like),
    ),
    shippingRates: await count(
      service.from('shipping_rates').select('id', { count: 'exact', head: true }).like('province', like),
    ),
    proofs: (await listTestProofPaths(service, prefix)).length,
    users: (await listTestUserIds(service, prefix)).length,
  }
}

export const NO_TEST_DATA = {
  orders: 0,
  categories: 0,
  products: 0,
  variants: 0,
  shippingRates: 0,
  proofs: 0,
  users: 0,
} as const
