import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'
import { login, OWNER } from './helpers/auth'

/** WCAG 2.2 AA + axe'in en iyi uygulama kuralları. Tek ihlal bile testi düşürür. */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']

async function expectNoViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = violations.map(
    (v) =>
      `${v.id} [${v.impact}] ${v.help}\n` +
      v.nodes
        .map((n) => `  ${n.target.join(' ')}\n    ${n.failureSummary?.replace(/\n/g, ' ')}`)
        .join('\n'),
  )
  expect(summary, summary.join('\n\n')).toEqual([])
}

const PUBLIC_PAGES = [
  '/',
  '/black-playstation-carsi',
  '/black-tavuk-garden',
  '/lavinya-apart',
  '/mekan/black-garden',
  '/mekan/carsi',
  '/kampanyalar',
  '/admin/giris',
  '/olmayan-sayfa',
]

test.describe('Erişilebilirlik (axe)', () => {
  for (const path of PUBLIC_PAGES) {
    test(`açık site: ${path}`, async ({ page }) => {
      await page.goto(path)
      await expectNoViolations(page)
    })
  }

  test('mobil menü açıkken', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'yalnızca mobil projede')
    await page.goto('/')
    await page.getByRole('button', { name: 'Menü' }).click()
    await expect(page.getByRole('navigation', { name: 'Mobil menü' })).toBeVisible()
    // Panel 200 ms'lik opaklık geçişiyle açılır; yarı saydamken kontrast ölçümü yanlış çıkar.
    await expect(page.getByRole('dialog')).toHaveCSS('opacity', '1')
    await expectNoViolations(page)
  })

  test('panel: özet, dükkan sekmeleri ve patron sayfaları', async ({ page }) => {
    await login(page, OWNER)
    await expectNoViolations(page)

    await page.goto('/admin/dukkanlar')
    await expectNoViolations(page)
    await page.getByRole('link', { name: /Black PlayStation Çarşı/ }).click()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Black PlayStation Çarşı' }),
    ).toBeVisible()
    await expectNoViolations(page)
    const tabs = page.getByRole('navigation', { name: 'Dükkan sekmeleri' })
    for (const [tab, segment] of [
      ['Saatler', 'saatler'],
      ['Galeri', 'galeri'],
      ['Fiyat Listesi', 'fiyatlar'],
    ] as const) {
      await tabs.getByRole('link', { name: tab }).click()
      await expect(page).toHaveURL(new RegExp(`/admin/dukkanlar/[^/]+/${segment}$`))
      await expect(tabs.getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page')
      await expectNoViolations(page)
    }

    for (const path of [
      '/admin/dukkanlar/yeni',
      '/admin/kampanyalar',
      '/admin/kampanyalar/yeni',
      '/admin/mekanlar',
      '/admin/kullanicilar',
      '/admin/kullanicilar/yeni',
      '/admin/ayarlar',
      '/admin/cop',
      '/admin/gunluk',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expectNoViolations(page)
    }
  })
})
