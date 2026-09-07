import { expect, test } from '@playwright/test'
import { login, MANAGER, OWNER, signOut } from './helpers/auth'

test.describe('Panel kimlik doğrulama', () => {
  test('giriş yapılmamışsa /admin giriş sayfasına yönlenir', async ({ page }) => {
    await page.goto('/admin/dukkanlar')
    await expect(page).toHaveURL(/\/admin\/giris\?next=/)
  })

  test('yanlış şifre hata verir', async ({ page }) => {
    await page.goto('/admin/giris')
    await page.getByLabel('E-posta').fill(OWNER.email)
    await page.getByLabel('Şifre').fill('yanlis-sifre-123')
    await page.getByRole('button', { name: 'Giriş Yap' }).click()
    await expect(page.getByText('E-posta veya şifre hatalı.')).toBeVisible()
  })

  test('patron girer, tüm menüyü görür, çıkar', async ({ page }) => {
    await login(page, OWNER)
    await expect(page.getByRole('heading', { name: /Hoş geldin/ })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Kullanıcılar' }).first()).toBeVisible()
    await signOut(page)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin\/giris/)
  })

  test('sorumlu yalnızca atanan dükkanları görür, kullanıcı sayfasına giremez', async ({
    page,
  }) => {
    await login(page, MANAGER)
    await page.goto('/admin/dukkanlar')
    await expect(page.getByRole('link', { name: /Black PlayStation Çarşı/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Black İnternet Kafe Çarşı/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Lavinya Apart/ })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Yeni Dükkan' })).toHaveCount(0)

    await page.goto('/admin/kullanicilar')
    await expect(page).toHaveURL(/\/admin\?yetki=yok/)
    await expect(page.getByText('Bu işlem için yetkiniz yok.')).toBeVisible()
  })
})
