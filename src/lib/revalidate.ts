import 'server-only'
import { revalidatePath } from 'next/cache'

/**
 * Panelden yapılan her içerik değişikliği tüm açık siteyi yeniler.
 * Site küçük; "hangi sayfa etkilendi" hesabındaki hata riskine girmeye değmez.
 */
export function revalidatePublicSite(): void {
  revalidatePath('/', 'layout')
}
