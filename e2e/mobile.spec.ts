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
    test(`${viewport.width}×${viewport.height}: ilk ekranda ağaç ve dükkanlar, yatay taşma yok`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')
      const shops = page.locator('#dukkanlar .tree-shop')
      await expect(shops.first()).toBeInViewport()
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow).toBe(0)
    })
  }

  test('azaltılmış harekette ağaç baştan çizili, hiçbir şey kıpırdamaz', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/', { waitUntil: 'load' })
    await expect(page.locator('#dukkanlar')).toHaveAttribute('data-grown', 'still')
    await expect(page.locator('.tree-branches .tree-bark').first()).toBeVisible()
    const running = await page
      .locator('#dukkanlar')
      .evaluate((el) => el.getAnimations({ subtree: true }).length)
    expect(running).toBe(0)
    await context.close()
  })

  test('ana kontroller en az 48 px', async ({ page }) => {
    await page.goto('/')
    // Düğümler açılırken hafif küçük başlar; ölçü açılış bitince alınır (sonsuz öz ışığı hariç).
    await page.locator('#dukkanlar').evaluate(async (el) => {
      await new Promise((r) => setTimeout(r, 300))
      await Promise.all(
        el
          .getAnimations({ subtree: true })
          .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
          .map((a) => a.finished),
      )
    })
    const targets = [
      page.getByRole('button', { name: 'Menü' }),
      page.locator('#dukkanlar .tree-group').first(),
      page.locator('#dukkanlar .tree-shop').first(),
    ]
    for (const target of targets) {
      const box = await target.boundingBox()
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(48)
    }
  })
})
