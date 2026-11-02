import { expect, test } from '@playwright/test'
import { login, OWNER } from './helpers/auth'

test.describe('Mobil deneyim', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnızca mobil projede')

  test('dükkan sayfasında alt eylem çubuğu görünür', async ({ page }) => {
    await page.goto('/black-playstation-carsi')
    const bar = page.locator('div.fixed.bottom-0')
    await expect(bar.getByRole('link', { name: 'Ara' })).toBeVisible()
    await expect(bar.getByRole('link', { name: 'WhatsApp' })).toBeVisible()
  })

  test('mobil menü açılır ve kampanyalara gider', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Menü' }).click()
    await page
      .getByRole('navigation', { name: 'Mobil menü' })
      .getByRole('link', { name: 'Kampanyalar' })
      .click()
    await expect(page).toHaveURL(/\/kampanyalar/)
  })

  test('panelde alt sekme çubuğu çalışır', async ({ page }) => {
    await login(page, OWNER)
    const bottomNav = page.getByRole('navigation', { name: 'Panel menüsü' }).last()
    await bottomNav.getByRole('link', { name: 'Dükkanlar' }).click()
    await expect(page).toHaveURL(/\/admin\/dukkanlar/)
    await expect(page.getByRole('heading', { level: 1, name: 'Dükkanlar' })).toBeVisible()
  })
})

test.describe('Telefondan giriş', () => {
  test.skip(({ isMobile }) => !isMobile, 'yalnızca mobil projede')

  for (const viewport of [
    { width: 390, height: 664 },
    { width: 360, height: 640 },
  ]) {
    test(`${viewport.width}×${viewport.height}: ilk ekranda yalnız açılış, işaret listeye indirir`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const hero = await page.locator('.hero').boundingBox()
      expect((hero?.y ?? 0) + (hero?.height ?? 0)).toBeGreaterThanOrEqual(viewport.height - 1)
      const rows = page.locator('#dukkanlar .shop-row')
      await expect(rows).toHaveCount(5)
      await expect(rows.first()).not.toBeInViewport()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBe(0)
      await page.locator('.hero-scroll-cue').click()
      await expect(rows.first()).toBeInViewport()
    })
  }

  test('telefonda sayfa yüklenince hafif sürüm oynar', async ({ page }) => {
    const videoRequests: string[] = []
    page.on('request', (request) => {
      if (request.url().includes('/media/hero-') && request.url().endsWith('.mp4')) {
        videoRequests.push(request.url())
      }
    })
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.locator('video.hero-video')).toHaveAttribute('data-playing', 'true', {
      timeout: 15_000,
    })
    expect(videoRequests.length).toBeGreaterThan(0)
    expect(videoRequests.every((url) => url.includes('hero-telefon'))).toBe(true)
  })

  test('azaltılmış harekette video hiç inmez, afiş kalır', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/', { waitUntil: 'load' })
    await page.waitForTimeout(4000)
    await expect(page.locator('video')).toHaveCount(0)
    await expect(page.locator('.hero-stage img')).toBeVisible()
    await context.close()
  })

  test('ana kontroller en az 48 px', async ({ page }) => {
    await page.goto('/')
    const targets = [
      page.getByRole('button', { name: 'Menü' }),
      page.locator('#dukkanlar a').first(),
      page.locator('.hero-scroll-cue'),
    ]
    for (const target of targets) {
      const box = await target.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
    }
  })
})
