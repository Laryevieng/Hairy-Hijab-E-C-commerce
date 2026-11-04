import { Package, MapPin, Truck, FileText } from 'lucide-react'
import type { OrderView } from '@/services/orders.public.service'
import { formatRupiah, formatDateTimeID } from '@/lib/utils/format'

interface OrderItemsListProps {
  order: OrderView
}

export function OrderItemsList({ order }: OrderItemsListProps) {
  return (
    <div className="space-y-6">
      {/* Daftar Item Pesanan */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-semibold tracking-wide text-stone-900 uppercase flex items-center gap-2">
          <Package className="size-4 text-stone-600" />
          Rincian Produk ({order.items.reduce((acc, it) => acc + it.quantity, 0)} item)
        </h3>

        <div className="divide-y divide-stone-100">
          {order.items.map((item) => (
            <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="font-medium text-stone-900 text-sm">{item.productName}</div>
                <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>SKU: {item.sku}</span>
                  {item.color && (
                    <>
                      <span>•</span>
                      <span>Warna: {item.color}</span>
                    </>
                  )}
                  {item.size && (
                    <>
                      <span>•</span>
                      <span>Ukuran: {item.size}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-stone-600">
                  {item.quantity} × {formatRupiah(item.unitPrice)}
                </div>
              </div>

              <div className="text-right font-medium text-stone-900 text-sm whitespace-nowrap">
                {formatRupiah(item.lineTotal)}
              </div>
            </div>
          ))}
        </div>

        {/* Ringkasan Biaya */}
        <div className="border-t border-stone-200 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-stone-600 text-xs sm:text-sm">
            <span>Subtotal Produk</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>

          <div className="flex justify-between text-stone-600 text-xs sm:text-sm">
            <span>Biaya Pengiriman</span>
            <span>{formatRupiah(order.shippingCost)}</span>
          </div>

          {order.discountAmount > 0 && (
            <div className="flex justify-between text-emerald-700 text-xs sm:text-sm">
              <span>Diskon</span>
              <span>-{formatRupiah(order.discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold text-stone-950">
            <span>Total Tagihan</span>
            <span className="font-mono">{formatRupiah(order.grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* Info Pengiriman & Resi */}
      {order.shipment && (
        <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
          <h3 className="text-sm font-semibold tracking-wide text-stone-900 uppercase flex items-center gap-2">
            <Truck className="size-4 text-stone-600" />
            Informasi Pengiriman & Resi
          </h3>

          <div className="rounded-lg bg-stone-50 p-4 space-y-2 text-sm border border-stone-100">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
              <span className="text-xs text-stone-500">Ekspedisi / Kurir:</span>
              <span className="font-semibold text-stone-900">
                {order.shipment.courier} {order.shipment.service ? `(${order.shipment.service})` : ''}
              </span>
            </div>

            {order.shipment.trackingNumber && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-stone-200/60 pt-2">
                <span className="text-xs text-stone-500">Nomor Resi:</span>
                <span className="font-mono font-bold text-stone-900 text-sm select-all">
                  {order.shipment.trackingNumber}
                </span>
              </div>
            )}

            {order.shipment.shippedAt && (
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 border-t border-stone-200/60 pt-2">
                <span className="text-xs text-stone-500">Waktu Kirim:</span>
                <span className="text-xs text-stone-700">
                  {formatDateTimeID(order.shipment.shippedAt)}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alamat Pengiriman */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-3">
        <h3 className="text-sm font-semibold tracking-wide text-stone-900 uppercase flex items-center gap-2">
          <MapPin className="size-4 text-stone-600" />
          Alamat Tujuan Pengiriman
        </h3>

        <div className="text-sm space-y-1 text-stone-800">
          <div className="font-semibold text-stone-950">
            {order.shippingAddress.recipientName}
            <span className="font-normal text-stone-500 ml-2">({order.shippingAddress.phone})</span>
          </div>
          <div className="text-stone-700 leading-relaxed">
            {order.shippingAddress.addressDetail}
          </div>
          <div className="text-stone-600 text-xs">
            {order.shippingAddress.district}, {order.shippingAddress.city},{' '}
            {order.shippingAddress.province} {order.shippingAddress.postalCode}
          </div>
        </div>

        {order.notes && (
          <div className="border-t border-stone-100 pt-3 flex items-start gap-2 text-xs text-stone-600">
            <FileText className="size-4 shrink-0 text-stone-400 mt-0.5" />
            <div>
              <span className="font-semibold text-stone-700">Catatan Pembeli:</span> {order.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
