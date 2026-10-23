import { describe, expect, it } from 'vitest'
import { DEFAULT_NEXT_PATH, safeNextPath } from '@/lib/auth/next-path'

describe('safeNextPath', () => {
  it.each([
    ['//evil.com'],
    ['https://evil.com'],
    ['/\\evil'],
    ['/\\/evil.com'],
    ['\\\\evil.com'],
    ['/\t/evil.com'],
    ['/\n/evil.com'],
    ['http:/evil.com'],
    ['javascript:alert(1)'],
    ['account'],
    [''],
    ['/' + 'a'.repeat(2048)],
  ])('menolak %j', (value) => {
    expect(safeNextPath(value)).toBe(DEFAULT_NEXT_PATH)
  })

  it.each([[undefined], [null], [42], [['/admin']], [{ path: '/admin' }]])(
    'menolak nilai bukan string %j',
    (value) => {
      expect(safeNextPath(value)).toBe(DEFAULT_NEXT_PATH)
    },
  )

  it.each([
    ['/account', '/account'],
    ['/admin', '/admin'],
    ['/admin/orders?status=pending', '/admin/orders?status=pending'],
    ['/products/pashmina#ulasan', '/products/pashmina#ulasan'],
    ['/', '/'],
  ])('menerima path relatif %j', (value, expected) => {
    expect(safeNextPath(value)).toBe(expected)
  })

  it('path ter-encode tetap menjadi path di situs ini', () => {
    expect(safeNextPath('/%2F%2Fevil.com')).toBe('/%2F%2Fevil.com')
  })

  it('memakai fallback yang diberikan', () => {
    expect(safeNextPath('//evil.com', '/')).toBe('/')
  })
})
