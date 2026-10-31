'use client'

import { useState } from 'react'
import { formatRupiah } from '@/lib/utils/format'
import { VariantSelector, type SelectableVariant } from '@/components/product/variant-selector'
import { AddToCartButton } from '@/components/product/add-to-cart-button'

export function ProductVariantDetails({ variants, productName }: { variants: SelectableVariant[]; productName: string }) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? '')
  const selected = variants.find((variant) => variant.id === selectedId) ?? variants[0]
  if (!selected) return null

  return <div className="space-y-4">
    <VariantSelector variants={variants} selectedId={selected.id} onSelect={setSelectedId} />
    <div className="space-y-2" aria-live="polite">
      <p className="text-2xl font-semibold text-espresso">{formatRupiah(selected.price)}</p>
      {selected.compare_at_price !== null && selected.compare_at_price > selected.price && <p className="text-sm text-espresso/60">Harga normal <del>{formatRupiah(selected.compare_at_price)}</del></p>}
      <p className={selected.stock_quantity > 0 ? 'text-sm text-success' : 'text-sm text-danger'}>{selected.stock_quantity > 0 ? `Tersedia · stok ${selected.stock_quantity}` : 'Sold Out'}</p>
    </div>
    <AddToCartButton
      variantId={selected.id}
      productName={productName}
      variantLabel={[selected.size, selected.color_name].filter(Boolean).join(' · ') || 'Pilihan'}
      stockQuantity={selected.stock_quantity}
    />
  </div>
}
