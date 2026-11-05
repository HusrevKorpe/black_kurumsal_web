import { expect, test } from '@playwright/test'

/** Açık / koyu tema: varsayılan koyu, düğme değiştirir, tercih yenilemede ve sayfalar arasında kalır. */
test.describe('Tema', () => {
  test('varsayılan koyu; düğmeyle açığa geçer ve tercih kalır', async ({ page }) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text())
    })
    await page.goto('/')
    const html = page.locator('html')
    await expect(html).toHaveClass(/\bdark\b/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#0a0a0a')

    await page.getByRole('button', { name: 'Açık temaya geç' }).click()
    await expect(html).not.toHaveClass(/\bdark\b/)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fbfbf8')
    await expect(page.locator('.public-theme').first()).toHaveCSS(
      'background-color',
      'rgb(251, 251, 248)',
    )

    await page.reload()
    await expect(html).not.toHaveClass(/\bdark\b/)
    // Hidrasyondan sonra da tek etiket, açık renkte.
    await expect(page.locator('meta[name="theme-color"]')).toHaveCount(1)
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#fbfbf8')
    await expect(page.getByRole('button', { name: 'Koyu temaya geç' })).toBeVisible()

    // İstemci gezinmesinde de korunur.
    await page.locator('a.tree-shop').first().click()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(html).not.toHaveClass(/\bdark\b/)

    await page.getByRole('button', { name: 'Koyu temaya geç' }).click()
    await expect(html).toHaveClass(/\bdark\b/)
    expect(errors.filter((e) => /hydrat|script tag/i.test(e))).toEqual([])
  })

  test('kayıtlı açık tema ilk boyamada uygulanır (parlama yok)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('tema', 'light'))
    // JS paketi gelmeden, yalnız HTML ayrıştırılırken: betik <head>'de çalışmış olmalı.
    await page.route(/\/_next\/static\/.*\.js/, (route) => route.abort())
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/)
    await expect(page.locator('.public-theme').first()).toHaveCSS(
      'background-color',
      'rgb(251, 251, 248)',
    )
  })
})
