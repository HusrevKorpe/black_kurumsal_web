import { expect, test } from '@playwright/test'

test.describe('Açık site', () => {
  test('ana sayfa: kampanyalar, mekanlar ve dükkanlar görünür', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Kampanyalar' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Black Garden/ }).first()).toBeVisible()
    const shops = page.locator('#dukkanlar')
    await expect(shops.getByRole('link', { name: /Black PlayStation Çarşı/ })).toBeVisible()
    await expect(shops.getByRole('link', { name: /Lavinya Apart/ })).toBeVisible()
  })

  test('dükkan sayfası: iletişim, saatler ve fiyat listesi', async ({ page }) => {
    await page.goto('/black-playstation-carsi')
    await expect(
      page.getByRole('heading', { level: 1, name: 'Black PlayStation Çarşı' }),
    ).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ara' }).first()).toHaveAttribute(
      'href',
      /^tel:\+90/,
    )
    await expect(page.getByRole('link', { name: 'WhatsApp' }).first()).toHaveAttribute(
      'href',
      /wa\.me\/90/,
    )
    await expect(page.getByRole('heading', { name: 'Fiyat Listesi' })).toBeVisible()
    await expect(page.getByText('PS5 Saatlik')).toBeVisible()
    await expect(page.getByText('₺120 / saat')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Çalışma Saatleri' })).toBeVisible()
    await expect(page.getByText('Pazartesi')).toBeVisible()
    await expect(page.getByText(/Şu an (açık|kapalı)/)).toBeVisible()
  })

  test('Garden içindeki dükkan mekanın saatini ve adresini devralır', async ({ page }) => {
    await page.goto('/black-tavuk-garden')
    await expect(page.getByText('Black Garden içinde').first()).toBeVisible()
    await expect(page.getByText('Saatler Black Garden ile aynı')).toBeVisible()
    await expect(page.getByText('11:00 – 23:30').first()).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ara' }).first()).toHaveAttribute(
      'href',
      'tel:+905550000001',
    )
  })

  test('mekan sayfası dükkanları listeler', async ({ page }) => {
    await page.goto('/mekan/black-garden')
    await expect(page.getByRole('heading', { level: 1, name: 'Black Garden' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Buradaki dükkanlar' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Black Sushi/ })).toBeVisible()
  })

  test('kampanyalar sayfası ve 404', async ({ page }) => {
    await page.goto('/kampanyalar')
    await expect(page.getByRole('heading', { level: 1, name: 'Kampanyalar' })).toBeVisible()
    await expect(page.getByText('Black Garden Açıldı')).toBeVisible()

    const response = await page.goto('/boyle-bir-dukkan-yok')
    expect(response?.status()).toBe(404)
    await expect(page.getByText('Sayfa bulunamadı')).toBeVisible()
  })

  test('sitemap ve robots', async ({ request }) => {
    const sitemap = await request.get('/sitemap.xml')
    expect(sitemap.ok()).toBeTruthy()
    expect(await sitemap.text()).toContain('/black-playstation-carsi')
    const robots = await request.get('/robots.txt')
    expect(await robots.text()).toContain('Disallow: /admin')
  })
})
