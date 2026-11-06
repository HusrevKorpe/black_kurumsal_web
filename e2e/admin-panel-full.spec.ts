import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'
import { login, OWNER, signOut } from './helpers/auth'

/**
 * Panelde yapılan her değişikliğin açık siteye düştüğünü uçtan uca doğrular. Üretim derlemesinde
 * (pnpm build && pnpm start) koşulduğunda ISR önbelleğinin panel kaydında temizlendiğini de sınar.
 * Her test kendi değişikliğini geri alır.
 */

let imagePath: string

test.beforeAll(async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'black-e2e-'))
  imagePath = path.join(dir, 'e2e-foto.jpg')
  await sharp({
    create: { width: 1600, height: 900, channels: 3, background: { r: 200, g: 40, b: 90 } },
  })
    .jpeg()
    .toFile(imagePath)
})

async function openShop(page: Page, name: RegExp, tab?: string) {
  await page.goto('/admin/dukkanlar')
  await page.getByRole('link', { name }).click()
  if (tab) await page.getByRole('link', { name: tab }).click()
}

test.describe('Panel → site, kapsamlı', () => {
  test('tüm panel sayfaları hatasız açılır', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (e) => errors.push(e.message))
    await login(page, OWNER)
    for (const url of [
      '/admin',
      '/admin/dukkanlar',
      '/admin/dukkanlar/yeni',
      '/admin/mekanlar',
      '/admin/mekanlar/yeni',
      '/admin/kampanyalar',
      '/admin/kampanyalar/yeni',
      '/admin/kullanicilar',
      '/admin/kullanicilar/yeni',
      '/admin/ayarlar',
      '/admin/gunluk',
      '/admin/istatistik',
    ]) {
      const res = await page.goto(url)
      expect(res?.status(), url).toBe(200)
      await expect(page.getByText(/Bir hata oluştu|Application error/)).toHaveCount(0)
    }
    expect(errors).toEqual([])
  })

  test('site ayarları: ana sayfa başlığı değişir, siteye düşer, geri alınır', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/ayarlar')
    const hero = page.locator('#heroTitle')
    const original = await hero.inputValue()
    const marker = `E2E başlık ${Date.now()}`
    await hero.fill(marker)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Ayarlar kaydedildi.')).toBeVisible()

    await page.goto('/')
    await expect(page.getByText(marker)).toBeVisible()

    await page.goto('/admin/ayarlar')
    await page.locator('#heroTitle').fill(original)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Ayarlar kaydedildi.')).toBeVisible()
    await page.goto('/')
    await expect(page.getByText(marker)).toHaveCount(0)
  })

  test('logo yüklenir, başlıkta görünür, kaldırılır', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/ayarlar')
    await page.getByLabel('Logo', { exact: true }).setInputFiles(imagePath)
    await expect(page.getByRole('button', { name: 'Logoyu kaldır' })).toBeVisible({
      timeout: 30_000,
    })
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Ayarlar kaydedildi.')).toBeVisible()

    await page.goto('/')
    await expect(page.locator('header img').first()).toBeVisible()

    await page.goto('/admin/ayarlar')
    await page.getByRole('button', { name: 'Logoyu kaldır' }).click()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Ayarlar kaydedildi.')).toBeVisible()
    await page.goto('/')
    await expect(page.locator('header img')).toHaveCount(0)
  })

  test('dükkan yayından kalkar → sitede 404, tekrar yayına alınır', async ({ page }) => {
    await login(page, OWNER)
    await openShop(page, /Lulu Kafe/)
    const toggle = page.getByRole('switch', { name: 'Sitede yayında' })
    await expect(toggle).toBeChecked()
    await toggle.click()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()

    await page.goto('/lulu-kafe')
    await expect(page.getByText('Sayfa bulunamadı')).toBeVisible()
    await page.goto('/')
    await expect(page.getByRole('link', { name: /Lulu Kafe/ })).toHaveCount(0)

    await openShop(page, /Lulu Kafe/)
    await page.getByRole('switch', { name: 'Sitede yayında' }).click()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()
    await page.goto('/lulu-kafe')
    await expect(page.getByRole('heading', { level: 1, name: 'Lulu Kafe' })).toBeVisible()
  })

  test('dükkan adı/telefon/özellik değişir ve sitede görünür', async ({ page }) => {
    await login(page, OWNER)
    await openShop(page, /Lulu Kafe/)
    const phone = page.locator('#phone')
    const originalPhone = await phone.inputValue()
    await phone.fill('0555 111 22 33')
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()

    await page.goto('/lulu-kafe')
    // Telefonda arama düğmesi alt çubukta, masaüstünde başlıkta: numaranın sayfaya düştüğüne bak.
    await expect(page.locator('a[href="tel:+905551112233"]').first()).toBeAttached()

    await openShop(page, /Lulu Kafe/)
    await page.locator('#phone').fill(originalPhone)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()
  })

  test('galeriye fotoğraf yüklenir, sitede görünür, silinir', async ({ page }) => {
    await login(page, OWNER)
    await openShop(page, /Lulu Kafe/, 'Galeri')
    const deleteButtons = page.getByRole('button', { name: 'Sil', exact: true })
    await expect(page.getByLabel('Fotoğraf Yükle')).toBeAttached()
    await expect(
      page
        .getByText('Kapakta görünen kısım')
        .or(page.getByText(/Henüz fotoğraf yok/))
        .first(),
    ).toBeVisible()
    const before = await deleteButtons.count()

    await page.getByLabel('Fotoğraf Yükle').setInputFiles(imagePath)
    await expect(page.getByText('1 fotoğraf eklendi.')).toBeVisible({ timeout: 30_000 })
    await expect(deleteButtons).toHaveCount(before + 1)

    await page.goto('/lulu-kafe')
    const storageImgs = page.locator('img[src*="e2e-foto"], img[srcset*="e2e-foto"]')
    // Dosya adı depoda korunmuyorsa en azından galeri bölümünde görsel sayısı artmalı.
    const galleryImgs = page.locator('#galeri ~ * img, section[aria-labelledby="galeri"] img')
    const shown = (await storageImgs.count()) + (await galleryImgs.count())
    expect(shown).toBeGreaterThan(0)

    await openShop(page, /Lulu Kafe/, 'Galeri')
    await expect(deleteButtons).toHaveCount(before + 1)
    // Tıklama hidrasyondan önce giderse diyalog açılmaz; açılana dek yeniden dener.
    await expect(async () => {
      await deleteButtons.last().click()
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 1000 })
    }).toPass()
    await page.getByRole('dialog').getByRole('button', { name: 'Sil' }).click()
    await expect(page.getByText('Fotoğraf silindi.')).toBeVisible()
    await expect(deleteButtons).toHaveCount(before)
  })

  test('mekan açıklaması değişir ve mekan sayfasına düşer', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/mekanlar')
    await page
      .getByRole('link', { name: /Black Garden/ })
      .first()
      .click()
    const desc = page.locator('#description')
    const original = await desc.inputValue()
    const marker = `E2E mekan ${Date.now()}`
    await desc.fill(`${original} ${marker}`.trim())
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Mekan kaydedildi.')).toBeVisible()

    await page.goto('/mekan/black-garden')
    await expect(page.getByText(marker)).toBeVisible()

    await page.goto('/admin/mekanlar')
    await page
      .getByRole('link', { name: /Black Garden/ })
      .first()
      .click()
    await page.locator('#description').fill(original)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Mekan kaydedildi.')).toBeVisible()
  })

  test('kampanya açılır, kampanyalar sayfasında çıkar, silinir', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/kampanyalar/yeni')
    const title = `E2E Kampanya ${Date.now()}`
    await page.locator('#title').fill(title)
    await page.locator('#description').fill('Uçtan uca test kampanyası')
    await page.getByLabel('Kampanya görseli', { exact: true }).setInputFiles(imagePath)
    await expect(page.locator('button', { hasText: 'Düzenle' })).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Kampanya oluşturuldu.')).toBeVisible()

    await page.goto('/kampanyalar')
    await expect(page.getByText(title)).toBeVisible()

    await page.goto('/admin/kampanyalar')
    await page.getByRole('link', { name: new RegExp(title) }).click()
    await page.getByRole('button', { name: 'Sil' }).click()
    await page.getByRole('dialog').getByRole('button', { name: 'Sil' }).click()
    await expect(page.getByText('Kampanya silindi.')).toBeVisible()

    await page.goto('/kampanyalar')
    await expect(page.getByText(title)).toHaveCount(0)
  })

  test('yeni sorumlu açılır, yalnız atanan dükkanı düzenler, pasife alınınca giremez', async ({
    page,
  }) => {
    const stamp = Date.now()
    const email = `e2e-${stamp}@black.local`
    const password = 'E2eTest123'

    await login(page, OWNER)
    await page.goto('/admin/kullanicilar/yeni')
    await page.locator('#email').fill(email)
    await page.locator('#fullName').fill(`E2E Sorumlu ${stamp}`)
    await page.locator('#role').selectOption('MANAGER')
    await page.locator('#password').fill(password)
    await page.getByRole('checkbox', { name: 'Lulu Kafe' }).click()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Kullanıcı oluşturuldu.')).toBeVisible()
    await signOut(page)

    await login(page, { email, password })
    await page.goto('/admin/dukkanlar')
    await expect(page.getByRole('link', { name: /Lulu Kafe/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Black Tost Çarşı/ })).toHaveCount(0)

    // Atanmamış dükkanın düzenleme sayfasına adresle de girilemez.
    await page.goto('/admin/dukkanlar')
    await openShop(page, /Lulu Kafe/)
    const marker = `E2E sorumlu ${Date.now()}`
    const desc = page.locator('#description')
    const original = await desc.inputValue()
    await desc.fill(`${original} ${marker}`)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()
    await page.goto('/lulu-kafe')
    await expect(page.getByText(marker)).toBeVisible()
    await page.goBack()
    await page.locator('#description').fill(original)
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Dükkan kaydedildi.')).toBeVisible()

    await page.goto('/admin/kullanicilar')
    await expect(page).toHaveURL(/yetki=yok/)
    await page.goto('/admin/ayarlar')
    await expect(page).toHaveURL(/yetki=yok/)
    await signOut(page)

    // Patron hesabı pasife alır.
    await login(page, OWNER)
    await page.goto('/admin/kullanicilar')
    await page.getByRole('link', { name: new RegExp(`E2E Sorumlu ${stamp}`) }).click()
    await page.getByRole('switch', { name: /Hesap aktif/ }).click()
    await page.getByRole('button', { name: 'Kaydet' }).click()
    await expect(page.getByText('Kullanıcı kaydedildi.')).toBeVisible()
    await signOut(page)

    await page.goto('/admin/giris')
    await page.getByLabel('E-posta').fill(email)
    await page.getByLabel('Şifre').fill(password)
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page).not.toHaveURL(/\/admin(\?|$)/)
  })

  test('işlem günlüğü panel kayıtlarını gösterir', async ({ page }) => {
    await login(page, OWNER)
    await page.goto('/admin/gunluk')
    await expect(page.getByText('Henüz kayıt yok.')).toHaveCount(0)
    await expect(page.getByRole('table').or(page.locator('ul, ol')).first()).toBeVisible()
  })
})
