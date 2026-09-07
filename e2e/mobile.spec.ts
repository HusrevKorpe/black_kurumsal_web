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
