import { z } from 'zod'
import { hmSchema, optionalText } from '@/lib/validation/common'
import { DATE_KEY_PATTERN, dbDateFromKey } from './time'

const dayHoursBase = z.object({
  dayOfWeek: z.int().min(1).max(7),
  isClosed: z.boolean(),
  opensAt: hmSchema.nullable(),
  closesAt: hmSchema.nullable(),
})

const DAY_TIMES_MESSAGE = 'Açık günlerde açılış ve kapanış saati gerekli'
const dayHasTimes = (day: z.infer<typeof dayHoursBase>) =>
  day.isClosed || (day.opensAt !== null && day.closesAt !== null)

export const dayHoursSchema = dayHoursBase.refine(dayHasTimes, {
  message: DAY_TIMES_MESSAGE,
  path: ['opensAt'],
})

/**
 * Haftalık saat formu. useOwnHours=false ise dükkanın kendi kaydı silinir, mekan saatleri devralınır.
 * days her zaman 7 gün, her gün bir kez. Gün saatleri yalnız useOwnHours=true iken aranır: kapalıyken
 * form günleri gizler, gizli bir boş alan devralmaya geçişi engellememeli.
 */
export const weeklyHoursSchema = z
  .object({
    useOwnHours: z.boolean(),
    days: z.array(dayHoursBase).length(7, 'Haftanın 7 günü de gerekli'),
  })
  .refine((week) => new Set(week.days.map((d) => d.dayOfWeek)).size === 7, {
    message: 'Her gün yalnızca bir kez olmalı',
    path: ['days'],
  })
  .superRefine((week, ctx) => {
    if (!week.useOwnHours) return
    week.days.forEach((day, index) => {
      if (!dayHasTimes(day)) {
        ctx.addIssue({
          code: 'custom',
          message: DAY_TIMES_MESSAGE,
          path: ['days', index, 'opensAt'],
        })
      }
    })
  })
export type WeeklyHoursInput = z.infer<typeof weeklyHoursSchema>

/**
 * Tek bir istisna gün. Tarih "YYYY-MM-DD"; takvim günü olduğu için saat dilimi taşımaz.
 * Kapalıysa saatler yok sayılır, açıksa ikisi de gerekir (veritabanındaki CHECK ile aynı kural).
 */
export const hoursExceptionSchema = z
  .object({
    date: z.string().regex(DATE_KEY_PATTERN, 'Bir tarih seçin'),
    isClosed: z.boolean(),
    opensAt: hmSchema.nullable(),
    closesAt: hmSchema.nullable(),
    note: optionalText(80),
  })
  .refine((entry) => entry.isClosed || (entry.opensAt !== null && entry.closesAt !== null), {
    message: 'Açık günlerde açılış ve kapanış saati gerekli',
    path: ['opensAt'],
  })
  .refine((entry) => dbDateFromKey(entry.date) !== null, {
    message: 'Geçerli bir tarih seçin',
    path: ['date'],
  })
export type HoursExceptionFormInput = z.infer<typeof hoursExceptionSchema>
