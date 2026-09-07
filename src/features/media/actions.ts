'use server'

import { randomUUID } from 'node:crypto'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { mediaPublicUrl } from '@/lib/media/url'
import { assertMediaOwnerAccess } from './authorize'
import { buildMediaPath, parseMediaPath } from './paths'
import { finalizeUploadSchema, requestUploadSchema } from './schema'
import { createSignedUpload, objectExists, type SignedUpload } from './storage'

/** 1. adım: yetkiyi doğrula, yol üret, imzalı URL ver. */
export async function requestUploadUrl(input: unknown): Promise<ActionResult<SignedUpload>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const parsed = requestUploadSchema.safeParse(input)
    if (!parsed.success) return fromZodError(parsed.error)
    const { ownerKind, ownerId, mimeType } = parsed.data
    const effectiveOwnerId = ownerKind === 'campaign' ? staff.id : ownerId
    await assertMediaOwnerAccess(staff, ownerKind, effectiveOwnerId)
    const path = buildMediaPath(ownerKind, effectiveOwnerId, mimeType, randomUUID())
    return ok(await createSignedUpload(path))
  })
}

export interface FinalizedMedia {
  mediaId: string
  url: string
  width: number
  height: number
}

/** 2. adım: dosya gerçekten yüklendi mi, yol bu kişiye mi ait; Media kaydını oluştur. */
export async function finalizeUpload(input: unknown): Promise<ActionResult<FinalizedMedia>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const parsed = finalizeUploadSchema.safeParse(input)
    if (!parsed.success) return fromZodError(parsed.error)
    const { path, mimeType, sizeBytes, width, height, alt } = parsed.data

    const owner = parseMediaPath(path)
    if (!owner) return fail('Geçersiz dosya yolu.')
    await assertMediaOwnerAccess(staff, owner.kind, owner.ownerId)
    if (!(await objectExists(path)))
      return fail('Dosya bulunamadı. Yükleme tamamlanmamış olabilir.')

    const media = await db.media.create({
      data: { path, mimeType, sizeBytes, width, height, alt: alt ?? null, uploadedById: staff.id },
      select: { id: true, bucket: true, path: true },
    })
    return ok({ mediaId: media.id, url: mediaPublicUrl(media), width, height })
  })
}
