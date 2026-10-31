'use client'

import { useEffect, useMemo, useState } from 'react'
import { getCartSnapshot } from '@/actions/cart.actions'
import { computeCartView, type CartCatalogItem, type CartViewLine } from '@/lib/cart/compute-cart-view'
import { useCartStore } from '@/stores/cart.store'
import { useCartHydration } from '@/stores/use-cart-hydration'

const LOAD_ERROR = 'Data keranjang tidak dapat dimuat.'

type SnapshotResult =
  | { key: string; ok: true; data: CartViewLine[] }
  | { key: string; ok: false; error: string }

export type CartSnapshotState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'error'; error: string; retry: () => void }
  | { status: 'ready'; lines: CartViewLine[]; isRefreshing: boolean }

/**
 * Menggabungkan baris keranjang lokal (`variantId`, `quantity`) dengan snapshot server.
 * Harga, stok, dan status selalu berasal dari `getCartSnapshot`; klien hanya menyimpan jumlah.
 */
export function useCartSnapshot(enabled = true): CartSnapshotState {
  const hydrated = useCartHydration()
  const lines = useCartStore((state) => state.lines)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<SnapshotResult | null>(null)
  const fetchKey = useMemo(() => `${attempt}:${JSON.stringify(lines)}`, [attempt, lines])

  useEffect(() => {
    if (!hydrated || !enabled || lines.length === 0) return
    let cancelled = false
    getCartSnapshot(lines).then(
      (response) => { if (!cancelled) setResult({ key: fetchKey, ...response }) },
      () => { if (!cancelled) setResult({ key: fetchKey, ok: false, error: LOAD_ERROR }) },
    )
    return () => { cancelled = true }
  }, [hydrated, enabled, lines, fetchKey])

  if (!hydrated) return { status: 'loading' }
  if (lines.length === 0) return { status: 'empty' }
  if (!result) return { status: 'loading' }

  const isFresh = result.key === fetchKey
  if (!result.ok) {
    return isFresh
      ? { status: 'error', error: result.error, retry: () => setAttempt((value) => value + 1) }
      : { status: 'loading' }
  }
  if (isFresh) return { status: 'ready', lines: result.data, isRefreshing: false }

  // Saat memuat ulang (misalnya jumlah diubah), tampilkan data server terakhir dengan jumlah lokal terbaru
  // agar UI tidak berkedip. Varian yang belum pernah dimuat menunggu snapshot baru.
  const knownIds = new Set(result.data.map((line) => line.variantId))
  if (lines.some((line) => !knownIds.has(line.variantId))) return { status: 'loading' }
  const catalog: CartCatalogItem[] = result.data.filter((line) => line.status !== 'unavailable')
  return { status: 'ready', lines: computeCartView(lines, catalog), isRefreshing: true }
}
