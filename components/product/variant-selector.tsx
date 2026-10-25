'use client'

export interface SelectableVariant {
  id: string
  sku: string
  size: string | null
  color_name: string | null
  color_hex: string | null
  color_hex_2: string | null
  price: number
  compare_at_price: number | null
  stock_quantity: number
}

export function VariantSelector({ variants, selectedId, onSelect }: { variants: SelectableVariant[]; selectedId: string; onSelect: (id: string) => void }) {
  return <fieldset className="space-y-2">
    <legend className="font-medium text-espresso">Pilih varian</legend>
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const soldOut = variant.stock_quantity <= 0
        const name = [variant.size, variant.color_name].filter(Boolean).join(' · ') || 'Pilihan'
        return <button key={variant.id} type="button" aria-pressed={selectedId === variant.id} aria-label={`${name}${soldOut ? ', habis' : ''}`} onClick={() => onSelect(variant.id)} className={`rounded border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedId === variant.id ? 'border-espresso bg-espresso text-ivory' : 'border-sand text-espresso'} ${soldOut ? 'opacity-60' : ''}`}>
          {variant.color_hex && <span aria-hidden="true" className="mr-2 inline-flex size-3 rounded-full border border-current align-middle" style={{ background: variant.color_hex }} />}{name}{soldOut ? ' — Habis' : ''}
        </button>
      })}
    </div>
  </fieldset>
}
