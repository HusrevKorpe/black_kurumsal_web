import { expect, test } from '@playwright/test'
import { login, MANAGER, OWNER } from './helpers/auth'

test.describe('İstatistik', () => {
  test('açık sitedeki tıklama sayaca gider', async ({ page }) => {
    // WhatsApp bağlantısı dışarı çıkar; testte gezinme engellenir, sayaç isteği yine de gitmeli.
    await page.route('https://wa.me/**', (route) => route.abort())
    await page.goto('/black-playstation-carsi')

    const beacon = page.waitForResponse(
      (response) => response.url().includes('/api/olay') && response.status() === 204,
    )
    await page.getByRole('link', { name: 'WhatsApp' }).first().click()
    await beacon
  })

  test('arka arkaya basılan aynı düğme bir kez sayılır', async ({ page }) => {
    await page.route('https://wa.me/**', (route) => route.abort())
    const beacons: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/api/olay')) beacons.push(request.postData() ?? '')
    })
    await page.goto('/black-playstation-carsi')

    const button = page.getByRole('link', { name: 'WhatsApp' }).first()
    for (let i = 0; i < 3; i += 1) await button.click()
    // İlk olay yolda; sonrakiler gönderilmediği için beklenecek istek de yok, kısa soluk yeter.
    await page.waitForTimeout(500)

    expect(beacons.filter((body) => body.includes('whatsapp'))).toHaveLength(1)
  })

  test('patron istatistik sayfasını görür, aralığı ve sıralamayı değiştirir', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/istatistik')

    await expect(page.getByRole('heading', { level: 1, name: 'İstatistik' })).toBeVisible()
    await expect(page.getByText(/Son 30 gün/)).toBeVisible()

    await page.getByRole('link', { name: '7 gün' }).click()
    await expect(page).toHaveURL(/gun=7/)
    await expect(page.getByText(/Son 7 gün/)).toBeVisible()

    // Sayaç boşken tablolar yerine açıklama çıkar; iki durumda da sayfa çalışır.
    const hasData = await page
      .getByRole('heading', { name: 'Dükkan dükkan' })
      .isVisible()
      .catch(() => false)
    if (hasData) {
      await page.getByRole('link', { name: 'WhatsApp' }).first().click()
      await expect(page).toHaveURL(/sirala=whatsapp/)
    } else {
      await expect(page.getByText(/henüz ölçüm yok/)).toBeVisible()
    }
  })

  test('sorumlu istatistik sayfasına giremez', async ({ page }) => {
    await login(page, MANAGER)
    await page.goto('/admin/istatistik')
    await expect(page).toHaveURL(/\/admin\?yetki=yok/)
    await expect(page.getByRole('link', { name: 'İstatistik' })).toHaveCount(0)
  })
})
