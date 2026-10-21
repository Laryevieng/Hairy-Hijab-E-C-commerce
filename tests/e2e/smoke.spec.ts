import { expect, test } from '@playwright/test'

test('halaman utama menampilkan identitas Hairy Hijab', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Hairy Hijab/i)
})
