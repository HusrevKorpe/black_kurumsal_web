import { z } from 'zod'

/**
 * Kapak odak noktası: kırpılan kapak şeridinde fotoğrafın görünecek dikey yeri, yüzde
 * (0 = üst, 100 = alt). null ortası demektir (50). Dik telefon fotoğrafı geniş şeritte ince bir
 * dilime iner; tabelanın kesilmemesi bununla seçilir. Patron bulanık zemin istemediği için
 * fotoğraf her zaman şeridi kırparak doldurur, yalnızca dilim değişir.
 */
export const DEFAULT_FOCUS_Y = 50

export const coverFocusSchema = z.object({
  focusY: z
    .number({ error: 'Odak 0 ile 100 arasında olmalı' })
    .int('Odak tam sayı olmalı')
    .min(0, 'Odak 0 ile 100 arasında olmalı')
    .max(100, 'Odak 0 ile 100 arasında olmalı')
    .nullable(),
})

export type CoverFocusInput = z.infer<typeof coverFocusSchema>

/** 50 kaydetmek "ortası" ile aynıdır; boş bırakılır ki varsayılan değişirse o da izlesin. */
export function normalizeFocusY(focusY: number | null): number | null {
  return focusY === DEFAULT_FOCUS_Y ? null : focusY
}

/** `object-position` değeri; odak yoksa undefined (tarayıcı varsayılanı zaten ortası). */
export function coverObjectPosition(focusY: number | null | undefined): string | undefined {
  return focusY == null ? undefined : `50% ${focusY}%`
}
