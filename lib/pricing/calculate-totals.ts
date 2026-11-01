/**
 * Pratinjau total untuk UI checkout. Otoritas total tetap fungsi database `create_order`;
 * hasil ini tidak pernah dikirim ke server sebagai harga atau total.
 */
export interface PricedLine {
  /** Harga satuan rupiah (integer) dari snapshot server. */
  price: number
  quantity: number
}

export interface CalculateTotalsInput {
  lines: readonly PricedLine[]
  shippingCost: number
  discount?: number
}

export interface Totals {
  subtotal: number
  shippingCost: number
  discount: number
  grandTotal: number
}

function assertAmount(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} harus berupa bilangan bulat ≥ 0.`)
  }
}

export function calculateTotals({ lines, shippingCost, discount = 0 }: CalculateTotalsInput): Totals {
  assertAmount(shippingCost, 'shippingCost')
  assertAmount(discount, 'discount')

  let subtotal = 0
  lines.forEach((line, index) => {
    assertAmount(line.price, `lines[${index}].price`)
    assertAmount(line.quantity, `lines[${index}].quantity`)
    subtotal += line.price * line.quantity
  })
  assertAmount(subtotal, 'subtotal')

  // Sama dengan constraint chk_order_total: grand_total = subtotal + shipping_cost − discount_amount (≥ 0).
  const grandTotal = subtotal + shippingCost - discount
  assertAmount(grandTotal, 'grandTotal')

  return { subtotal, shippingCost, discount, grandTotal }
}
