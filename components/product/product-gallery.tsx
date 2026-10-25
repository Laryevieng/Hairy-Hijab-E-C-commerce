'use client'

import Image from 'next/image'
import { useState } from 'react'

export interface ProductGalleryImage {
  id: string
  url: string
  alt: string
}

export function ProductGallery({ images, productName }: { images: ProductGalleryImage[]; productName: string }) {
  const [selected, setSelected] = useState(0)
  const current = images[selected]

  return (
    <section aria-label="Galeri produk" className="space-y-3">
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-sand/20">
        {current ? (
          <Image src={current.url} alt={current.alt || productName} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : <div className="flex h-full items-center justify-center text-sm text-espresso/60">Foto produk belum tersedia</div>}
      </div>
      {images.length > 1 && <div className="flex gap-2 overflow-x-auto" aria-label="Pilih foto produk">
        {images.map((image, index) => <button key={image.id} type="button" onClick={() => setSelected(index)} aria-label={`Tampilkan foto ${index + 1}`} aria-pressed={selected === index} className="relative size-16 shrink-0 overflow-hidden rounded border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" >
          <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
        </button>)}
      </div>}
    </section>
  )
}
