'use server'

import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as gallery from './gallery-service'

async function withRevalidate<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return runAction(async () => {
    const result = await fn()
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function addGalleryImagesAction(
  input: unknown,
): Promise<ActionResult<{ count: number }>> {
  return withRevalidate(async () => gallery.addGalleryImages(await requireStaff(), input))
}

export async function removeGalleryImageAction(
  galleryImageId: string,
): Promise<ActionResult<null>> {
  return withRevalidate(async () =>
    gallery.removeGalleryImage(await requireStaff(), galleryImageId),
  )
}

export async function reorderGalleryAction(input: unknown): Promise<ActionResult<null>> {
  return withRevalidate(async () => gallery.reorderGallery(await requireStaff(), input))
}

export async function updateGalleryCaptionAction(input: unknown): Promise<ActionResult<null>> {
  return withRevalidate(async () => gallery.updateGalleryCaption(await requireStaff(), input))
}
