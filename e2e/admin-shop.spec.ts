import { expect, test } from '@playwright/test'
import { login, OWNER } from './helpers/auth'

test.describe('Dükkan yönetimi', () => {
  test('açıklama değişir ve açık siteye yansır', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/dukkanlar')
    await page.getByRole('link', { name: /Black Tost Iyaş/ }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Black Tost Iyaş' })).toBeVisible()

    const marker = `E2E ${Date.now()}`
    const description = page.locator('#description')
    await description.fill(`Iyaş bölgesinde tost, kahvaltı ve sıcak içecekler. ${marker}`)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()

    await page.goto('/black-tost-iyas')
    await expect(page.getByText(marker)).toBeVisible()
  })

  test('slug rezerve kelime olamaz', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/dukkanlar/yeni')
    await page.getByLabel('Dükkan adı').fill('Admin')
    await expect(page.getByLabel('Web adresi (slug)')).toHaveValue('admin')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.locator('#slug-error')).toHaveText('Bu adres sistem tarafından kullanılıyor')
  })

  test('çalışma saati değişir ve sitede görünür', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/dukkanlar')
    await page.getByRole('link', { name: /Black Tost Çarşı/ }).click()
    await page.getByRole('link', { name: 'Saatler' }).click()
    await expect(page.getByText('Bu dükkanın kendi saatleri var')).toBeVisible()

    const mondayOpens = page.getByLabel('Pazartesi Açılış')
    await mondayOpens.fill('07:30')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Çalışma saatleri kaydedildi.')).toBeVisible()

    await page.goto('/black-tost-carsi')
    await expect(page.getByText('07:30 – 23:00')).toBeVisible()

    // Geri al: seed değerine döndür.
    await page.goto('/admin/dukkanlar')
    await page.getByRole('link', { name: /Black Tost Çarşı/ }).click()
    await page.getByRole('link', { name: 'Saatler' }).click()
    await page.getByLabel('Pazartesi Açılış').fill('08:00')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Çalışma saatleri kaydedildi.')).toBeVisible()
  })

  test('fiyat kategorisi ve kalemi eklenir, sitede görünür, sonra silinir', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/dukkanlar')
    await page.getByRole('link', { name: /Black Makarna/ }).click()
    await page.getByRole('link', { name: 'Fiyat Listesi' }).click()

    await page.getByRole('button', { name: 'Kategori Ekle' }).click()
    await page.getByLabel('Kategori adı').fill('E2E Tatlılar')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByRole('heading', { name: 'E2E Tatlılar' })).toBeVisible()

    const card = page.locator('section', {
      has: page.getByRole('heading', { name: 'E2E Tatlılar' }),
    })
    await card.getByRole('button', { name: 'Kalem Ekle' }).click()
    await page.getByLabel('Ad').fill('Tiramisu')
    await page.getByLabel('Fiyat (₺)').fill('145')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(card.getByText('Tiramisu')).toBeVisible()
    await expect(card.getByText('₺145 / porsiyon')).toBeVisible()

    await page.goto('/black-makarna-garden')
    await expect(page.getByRole('heading', { name: 'E2E Tatlılar' })).toBeVisible()
    await expect(page.getByText('Tiramisu')).toBeVisible()

    await page.goto('/admin/dukkanlar')
    await page.getByRole('link', { name: /Black Makarna/ }).click()
    await page.getByRole('link', { name: 'Fiyat Listesi' }).click()
    const card2 = page.locator('section', {
      has: page.getByRole('heading', { name: 'E2E Tatlılar' }),
    })
    await card2.getByRole('button', { name: 'Kategoriyi sil' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sil' }).click()
    await expect(page.getByRole('heading', { name: 'E2E Tatlılar' })).toHaveCount(0)
  })
})
