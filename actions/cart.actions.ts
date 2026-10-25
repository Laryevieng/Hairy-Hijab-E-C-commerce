'use server'

import { z } from 'zod'
import { createPublicClient } from '@/lib/supabase/public'
import { computeCartView, type CartCatalogItem } from '@/lib/cart/compute-cart-view'
import type { CartLine } from '@/stores/cart.store'

const cartLinesSchema = z.array(z.object({
  variantId: z.string().uuid(),
  quantity: z.number().int().min(1).max(20),
}).strict()).max(30)

export async function getCartSnapshot(input: unknown) {
  const parsed = cartLinesSchema.safeParse(input)
  if (!parsed.success) return { ok: false as const, error: 'Data keranjang tidak valid.' }
  if (parsed.data.length === 0) return { ok: true as const, data: [] }

  const client = createPublicClient()
  const { data, error } = await client
    .from('product_variants')
    .select('id, size, color_name, price, compare_at_price, stock_quantity, product:products!inner(id, name, slug, images:product_images(id, storage_path, alt_text, sort_order))')
    .in('id', parsed.data.map((line) => line.variantId))
    .eq('is_active', true)
    .eq('product.is_active', true)

  if (error) return { ok: false as const, error: 'Data keranjang tidak dapat dimuat.' }

  const catalog: CartCatalogItem[] = data.flatMap((variant) => {
    const product = Array.isArray(variant.product) ? variant.product[0] : variant.product
    if (!product) return []
    const image = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
    return [{
      variantId: variant.id,
      productName: product.name,
      productSlug: product.slug,
      imagePath: image?.storage_path ?? null,
      imageAlt: image?.alt_text ?? product.name,
      size: variant.size,
      colorName: variant.color_name,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      stockQuantity: variant.stock_quantity,
    }]
  })

  return { ok: true as const, data: computeCartView(parsed.data as CartLine[], catalog) }
}
