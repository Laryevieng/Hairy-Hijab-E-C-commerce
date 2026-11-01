import { describe, expect, it } from 'vitest'
import { addressSchema, checkoutSchema, customerSchema } from '@/lib/validations/checkout'

const VARIANT_ID = '3f0c2a6e-6b1d-4c8e-9a51-2d7f4b8e1c90'
const IDEMPOTENCY_KEY = '9b2e7c41-0d3a-4f6b-8e15-7a4c2d9f0b63'

const validCustomer = { name: '  Aisyah Putri ', phone: '0812-3456-7890', email: ' Aisyah@Example.com ' }
const validAddress = {
  province: 'Jawa Barat',
  city: ' Bandung ',
  district: 'Coblong',
  postalCode: '40132',
  addressDetail: 'Jl. Contoh No. 1, RT 01/RW 02',
}

function validCheckout() {
  return {
    idempotencyKey: IDEMPOTENCY_KEY,
    customer: { ...validCustomer },
    address: { ...validAddress },
    items: [{ variantId: VARIANT_ID, quantity: 2 }],
    notes: '  Tolong dibungkus rapi.  ',
  }
}

function fieldErrorPaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return result.error?.issues.map((issue) => issue.path.join('.')) ?? []
}

describe('customerSchema', () => {
  it('trims the name, normalizes the phone to 62…, and lowercases the email', () => {
    expect(customerSchema.parse(validCustomer)).toEqual({
      name: 'Aisyah Putri',
      phone: '6281234567890',
      email: 'aisyah@example.com',
    })
  })

  it('treats an empty or missing email as absent', () => {
    expect(customerSchema.parse({ ...validCustomer, email: '   ' }).email).toBeUndefined()
    expect(customerSchema.parse({ name: 'Aisyah', phone: '+62 812 3456 7890' })).toEqual({
      name: 'Aisyah',
      phone: '6281234567890',
      email: undefined,
    })
  })

  it.each([
    ['name too short', { ...validCustomer, name: 'A' }, 'name'],
    ['name too long', { ...validCustomer, name: 'A'.repeat(81) }, 'name'],
    ['invalid phone', { ...validCustomer, phone: '12345' }, 'phone'],
    ['non-Indonesian phone', { ...validCustomer, phone: '+1 415 555 0100' }, 'phone'],
    ['invalid email', { ...validCustomer, email: 'bukan-email' }, 'email'],
  ])('rejects %s', (_label, input, path) => {
    const result = customerSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(fieldErrorPaths(result)).toContain(path)
  })

  it('accepts the name length boundaries 2 and 80', () => {
    expect(customerSchema.safeParse({ ...validCustomer, name: 'Al' }).success).toBe(true)
    expect(customerSchema.safeParse({ ...validCustomer, name: 'A'.repeat(80) }).success).toBe(true)
  })
})

describe('addressSchema', () => {
  it('accepts a complete address and trims text fields', () => {
    expect(addressSchema.parse(validAddress)).toEqual({ ...validAddress, city: 'Bandung' })
  })

  it.each([
    ['unknown province', { ...validAddress, province: 'Narnia' }, 'province'],
    ['empty city', { ...validAddress, city: '  ' }, 'city'],
    ['empty district', { ...validAddress, district: '' }, 'district'],
    ['4-digit postal code', { ...validAddress, postalCode: '4013' }, 'postalCode'],
    ['non-numeric postal code', { ...validAddress, postalCode: '4O132' }, 'postalCode'],
    ['detail shorter than 10', { ...validAddress, addressDetail: 'Jl. A 1' }, 'addressDetail'],
    ['detail longer than 300', { ...validAddress, addressDetail: 'x'.repeat(301) }, 'addressDetail'],
  ])('rejects %s', (_label, input, path) => {
    const result = addressSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(fieldErrorPaths(result)).toContain(path)
  })
})

describe('checkoutSchema', () => {
  it('parses a valid checkout and leaves notes trimmed', () => {
    const data = checkoutSchema.parse(validCheckout())
    expect(data.idempotencyKey).toBe(IDEMPOTENCY_KEY)
    expect(data.customer.phone).toBe('6281234567890')
    expect(data.items).toEqual([{ variantId: VARIANT_ID, quantity: 2 }])
    expect(data.notes).toBe('Tolong dibungkus rapi.')
  })

  it('treats empty notes as absent', () => {
    expect(checkoutSchema.parse({ ...validCheckout(), notes: '   ' }).notes).toBeUndefined()
  })

  it('drops price and total fields sent by the client', () => {
    const data = checkoutSchema.parse({
      ...validCheckout(),
      subtotal: 1,
      shippingCost: 0,
      grandTotal: 1,
      total: 1,
      items: [{ variantId: VARIANT_ID, quantity: 1, price: 1, unitPrice: 1, lineTotal: 1 }],
    })
    expect(data).not.toHaveProperty('subtotal')
    expect(data).not.toHaveProperty('shippingCost')
    expect(data).not.toHaveProperty('grandTotal')
    expect(data).not.toHaveProperty('total')
    expect(data.items[0]).toEqual({ variantId: VARIANT_ID, quantity: 1 })
  })

  it.each([
    ['invalid idempotency key', { idempotencyKey: 'abc' }, 'idempotencyKey'],
    ['empty items', { items: [] }, 'items'],
    ['more than 30 lines', {
      items: Array.from({ length: 31 }, () => ({ variantId: VARIANT_ID, quantity: 1 })),
    }, 'items'],
    ['quantity 0', { items: [{ variantId: VARIANT_ID, quantity: 0 }] }, 'items.0.quantity'],
    ['quantity 21', { items: [{ variantId: VARIANT_ID, quantity: 21 }] }, 'items.0.quantity'],
    ['fractional quantity', { items: [{ variantId: VARIANT_ID, quantity: 1.5 }] }, 'items.0.quantity'],
    ['non-uuid variant', { items: [{ variantId: 'variant-1', quantity: 1 }] }, 'items.0.variantId'],
    ['notes longer than 300', { notes: 'x'.repeat(301) }, 'notes'],
    ['invalid nested customer', { customer: { ...validCustomer, phone: '' } }, 'customer.phone'],
    ['invalid nested address', { address: { ...validAddress, postalCode: '' } }, 'address.postalCode'],
  ])('rejects %s', (_label, override, path) => {
    const result = checkoutSchema.safeParse({ ...validCheckout(), ...override })
    expect(result.success).toBe(false)
    expect(fieldErrorPaths(result)).toContain(path)
  })

  it('accepts exactly 30 lines with quantity 20', () => {
    const items = Array.from({ length: 30 }, () => ({ variantId: VARIANT_ID, quantity: 20 }))
    expect(checkoutSchema.safeParse({ ...validCheckout(), items }).success).toBe(true)
  })
})
