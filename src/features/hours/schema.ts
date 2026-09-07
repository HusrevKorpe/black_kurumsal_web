import { z } from 'zod'
import { hmSchema } from '@/lib/validation/common'

export const dayHoursSchema = z
  .object({
    dayOfWeek: z.int().min(1).max(7),
    isClosed: z.boolean(),
    opensAt: hmSchema.nullable(),
    closesAt: hmSchema.nullable(),
  })
  .refine((day) => day.isClosed || (day.opensAt !== null && day.closesAt !== null), {
    message: 'Açık günlerde açılış ve kapanış saati gerekli',
    path: ['opensAt'],
  })

/**
 * Haftalık saat formu. useOwnHours=false ise dükkanın kendi kaydı silinir, mekan saatleri devralınır.
 * days her zaman 7 gün, her gün bir kez.
 */
export const weeklyHoursSchema = z
  .object({
    useOwnHours: z.boolean(),
    days: z.array(dayHoursSchema).length(7, 'Haftanın 7 günü de gerekli'),
  })
  .refine((week) => new Set(week.days.map((d) => d.dayOfWeek)).size === 7, {
    message: 'Her gün yalnızca bir kez olmalı',
    path: ['days'],
  })
export type WeeklyHoursInput = z.infer<typeof weeklyHoursSchema>
