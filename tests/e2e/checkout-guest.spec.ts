import { expect, test } from '@playwright/test'

test.describe('E2E Alur Belanja Tamu (P6-08)', () => {
  test('katalog → keranjang → checkout tamu → halaman pesanan', async ({ page }) => {
    // 1. Buka katalog produk
    await page.goto('/products')
    await expect(page).toHaveTitle(/Semua Produk/i)

    // Cari kartu produk yang berstatus persis "Tersedia" (bukan "Foto belum tersedia")
    const inStockCard = page
      .locator('article')
      .filter({ has: page.getByText('Tersedia', { exact: true }) })
      .first()
    const productLink = inStockCard.locator('a[href^="/products/"]').first()
    await expect(productLink).toBeVisible()
    await productLink.click()

    // 2. Pada halaman detail produk, pastikan tombol Tambah ke Keranjang aktif
    await page.waitForURL(/\/products\/[a-z0-9-]+/)

    const addToCartBtn = page.getByRole('button', { name: /Tambah ke Keranjang/i })
    await expect(addToCartBtn).toBeVisible()
    await expect(addToCartBtn).toBeEnabled()

    // Klik tambah ke keranjang
    await addToCartBtn.click()

    // 3. Buka halaman keranjang
    await page.goto('/cart')
    await expect(page).toHaveTitle(/Keranjang/i)

    // Pastikan item produk tampil dan tombol checkout aktif
    const checkoutLink = page.getByRole('link', { name: /Lanjut ke Checkout/i })
    await expect(checkoutLink).toBeVisible()
    await checkoutLink.click()

    // 4. Pada halaman checkout, isi formulir tamu
    await page.waitForURL('/checkout')
    await expect(page).toHaveTitle(/Checkout/i)

    // Data Pembeli
    await page.getByPlaceholder('Contoh: Aisyah Putri').fill('Aisyah E2E Guest')
    await page.getByPlaceholder('08123456789').fill('081234567890')
    await page.getByPlaceholder('nama@contoh.com').fill('aisyah.guest@example.com')

    // Alamat Pengiriman
    const provinceSelect = page.locator('select')
    await provinceSelect.selectOption('Jawa Barat')

    await page.getByPlaceholder('Contoh: Kota Bandung').fill('Kota Bandung')
    await page.getByPlaceholder('Contoh: Coblong').fill('Coblong')
    await page.getByPlaceholder('5 angka (contoh: 40132)').fill('40132')
    await page
      .getByPlaceholder('Nama jalan, nomor rumah, RT/RW, patokan lokasi (minimal 10 karakter)')
      .fill('Jl. Tamu Pengujian E2E No. 42 Blok B')

    // 5. Submit pesanan
    const submitBtn = page.getByRole('button', { name: /Buat Pesanan/i })
    await expect(submitBtn).toBeEnabled()
    await submitBtn.click()

    // 6. Verifikasi pengalihan ke halaman pesanan dengan token tamu
    await page.waitForURL(/\/orders\/HH-\d{6}-[A-Z0-9]{5}\?token=[a-f0-9]{32}/, { timeout: 30_000 })
    expect(page.url()).toMatch(/\/orders\/HH-\d{6}-[A-Z0-9]{5}\?token=[a-f0-9]{32}/)

    // Verifikasi konten halaman pesanan tamu
    await expect(page.getByText('Menunggu Pembayaran', { exact: true })).toBeVisible()
    await expect(page.getByText(/Instruksi Pembayaran Transfer Bank/i)).toBeVisible()
    await expect(page.getByText('Aisyah E2E Guest', { exact: true })).toBeVisible()
  })
})
