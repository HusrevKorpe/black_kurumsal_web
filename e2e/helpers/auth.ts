import { expect, type Page } from '@playwright/test'

export const OWNER = {
  email: 'patron@black.local',
  password: process.env.SEED_OWNER_PASSWORD ?? 'Patron123!',
}
export const MANAGER = {
  email: 'sorumlu@black.local',
  password: process.env.SEED_MANAGER_PASSWORD ?? 'Sorumlu123!',
}

export async function login(page: Page, user: { email: string; password: string }) {
  await page.goto('/admin/giris')
  await page.getByLabel('E-posta').fill(user.email)
  await page.getByLabel('Şifre').fill(user.password)
  await page.getByRole('button', { name: 'Giriş Yap' }).click()
  await expect(page).toHaveURL(/\/admin(\?|$)/)
}

export async function signOut(page: Page) {
  await page.getByRole('button', { name: 'Çıkış' }).click()
  await expect(page).toHaveURL(/\/admin\/giris/)
}
