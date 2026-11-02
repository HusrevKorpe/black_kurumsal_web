import { expect, test } from '@playwright/test'

test.describe('Açık site', () => {
  test('geniş ekranda yan pano tıklamayı başka dükkana kaçırmaz', async ({ page, isMobile }) => {
    test.skip(isMobile, 'pano yalnızca geniş ekranda')
    await page.goto('/')
    const photos = page.locator('.shop-row-photo')
    const pointerEvents = await photos.last().evaluate((el) => getComputedStyle(el).pointerEvents)
    expect(pointerEvents).toBe('none')
  })

  test('arka planda video oynar, durdurulabilir', async ({ page }) => {
    await page.goto('/')
    const video = page.locator('video.hero-video')
    await expect(video).toHaveAttribute('data-playing', 'true', { timeout: 15_000 })
    await page.getByRole('button', { name: 'Arka plan hareketini durdur' }).click()
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true)
    await page.getByRole('button', { name: 'Arka plan hareketini başlat' }).click()
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(false)
  })

  test('marka yazısı açılışta harf harf yanar, normal rengine oturur', async ({ page }) => {
    await page.goto('/')
    const letters = page.locator('.hero-wordmark-letter')
    const delays = await letters.evaluateAll((els) =>
      els.map((el) => parseFloat(getComputedStyle(el).animationDelay)),
    )
    expect(delays.length).toBeGreaterThan(1)
    expect(delays).toEqual([...delays].sort((a, b) => a - b))
    await expect
      .poll(() => letters.evaluateAll((els) => els.flatMap((el) => el.getAnimations()).length), {
        timeout: 6000,
      })
      .toBe(0)
    await expect(letters.first()).toHaveCSS('background-position', '0px 0px')
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
    await expect(page.getByRole('link', { name: /Black Makarna/ })).toBeVisible()
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
