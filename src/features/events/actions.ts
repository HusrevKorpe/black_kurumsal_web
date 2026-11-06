'use server'

import type { CalendarEvent } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as service from './service'

async function withRevalidate<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return runAction(async () => {
    const result = await fn()
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function createEventAction(input: unknown): Promise<ActionResult<CalendarEvent>> {
  return withRevalidate(async () => service.createEvent(await requireStaff(), input))
}
export async function updateEventAction(
  eventId: string,
  input: unknown,
): Promise<ActionResult<CalendarEvent>> {
  return withRevalidate(async () => service.updateEvent(await requireStaff(), eventId, input))
}
export async function deleteEventAction(eventId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.deleteEvent(await requireStaff(), eventId))
}
