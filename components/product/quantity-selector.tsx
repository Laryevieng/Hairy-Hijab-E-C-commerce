'use client'

import { Minus, Plus } from 'lucide-react'

export interface QuantitySelectorProps {
  value: number
  max: number
  onChange: (value: number) => void
  /** Nama produk untuk label tombol dan grup (contoh: "Pashmina Silk, Mocca"). */
  label: string
  min?: number
  disabled?: boolean
}

const stepButton = 'inline-flex size-11 items-center justify-center text-espresso transition-colors hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-40'

export function QuantitySelector({ value, max, onChange, label, min = 1, disabled = false }: QuantitySelectorProps) {
  const upper = Math.max(min, max)
  return (
    <div role="group" aria-label={`Jumlah ${label}`} className="inline-flex items-center rounded border border-sand">
      <button
        type="button"
        aria-label={`Kurangi jumlah ${label}`}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        className={stepButton}
      >
        <Minus className="size-4" aria-hidden="true" />
      </button>
      <output aria-live="polite" className="min-w-10 text-center text-sm font-medium tabular-nums">
        {value}
      </output>
      <button
        type="button"
        aria-label={`Tambah jumlah ${label}`}
        onClick={() => onChange(Math.min(upper, value + 1))}
        disabled={disabled || value >= upper}
        className={stepButton}
      >
        <Plus className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
