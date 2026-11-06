import { expect, test } from '@playwright/test'

test.describe('Açık site', () => {
  test('mekan sayfası: dükkanlar numaralı bilet, bilet dükkan sayfasına gider', async ({
    page,
  }) => {
    await page.goto('/mekan/carsi')
    const tickets = page.locator('#dukkanlar ~ ul .pafta-ticket')
    await expect(tickets.first()).toBeVisible()
    await expect(tickets.first().locator('.pafta-no')).toHaveText(/^01 \/ \d{2}$/)
    await tickets.filter({ hasText: /Lavinya Apart/i }).click()
    await expect(page).toHaveURL(/\/lavinya-apart$/)
  })

  test('açılış ağacı: kökten dükkanlara, her uç dükkan sayfasına gider', async ({ page }) => {
    await page.goto('/')
    const tree = page.locator('#dukkanlar .tree')
    await expect(tree.getByRole('link', { name: /Çarşı/ }).first()).toHaveAttribute(
      'href',
      '/mekan/carsi',
    )
    await tree.getByRole('link', { name: /Black PlayStation Çarşı/ }).click()
    await expect(page).toHaveURL(/\/black-playstation-carsi$/)
  })

  test('açılışta ağaç kökten büyür: dallar her düğüme varır, düğümler sonra açılır', async ({
    page,
  }) => {
    await page.goto('/')
    const section = page.locator('#dukkanlar')
    await expect(section).toHaveAttribute('data-grown', /play|still/)
    const shops = await section.locator('.tree-shop').count()
    const groups = await section.locator('.tree-group').count()
    await expect(section.locator('.tree-bud')).toHaveCount(shops + groups)
    await expect
      .poll(() =>
        section.evaluate((el) =>
          [...el.querySelectorAll<HTMLElement>('.tree-shop, .tree-group')].every(
            (n) => getComputedStyle(n).opacity === '1',
          ),
        ),
      )
      .toBe(true)
  })

  test('açılışta video yok', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.locator('video')).toHaveCount(0)
  })

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
    await expect(page.getByText(/Şu an (açık|kapalı)|dk sonra kapanıyor/)).toBeVisible()
  })

  test('ağaç: Çarşı ve Iyaş dal, Black Garden tek uç ve kendi sayfasına gider', async ({
    page,
  }) => {
    await page.goto('/')
    const tree = page.locator('#dukkanlar')
    for (const name of ['Black Espor Çarşı', 'Black Tost Iyaş', 'Lulu Kafe']) {
      await expect(tree.getByRole('link', { name: new RegExp(name) })).toBeVisible()
    }
    const garden = tree.getByRole('link', { name: /Black Garden/ })
    await expect(garden).toHaveAttribute('href', '/mekan/black-garden')
    await garden.click()
    await expect(page.getByRole('heading', { level: 1, name: 'Black Garden' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Buradaki dükkanlar' })).toBeVisible()
  })

  test('bölge sayfası dükkanları listeler', async ({ page }) => {
    await page.goto('/mekan/carsi')
    await expect(page.getByRole('heading', { level: 1, name: 'Çarşı' })).toBeVisible()
    await expect(page.getByRole('link', { name: /Lavinya Apart/ })).toBeVisible()
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
