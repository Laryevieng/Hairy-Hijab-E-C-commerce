'use client'

import { useState } from 'react'
import { formatRupiah } from '@/lib/utils/format'
import { VariantSelector, type SelectableVariant } from '@/components/product/variant-selector'

export function ProductVariantDetails({ variants }: { variants: SelectableVariant[] }) {
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
    {/* TODO(P5-03): sambungkan tombol ke store keranjang setelah task P5-01/P5-02. */}
    <button type="button" disabled className="w-full rounded bg-espresso px-5 py-3 font-medium text-ivory opacity-70" aria-label="Tambah ke keranjang (segera tersedia)">Tambah ke Keranjang</button>
  </div>
}
