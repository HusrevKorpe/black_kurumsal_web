import 'server-only'
import { logAudit } from '@/features/audit/log'
import { deleteMediaRow, removeObjects } from '@/features/media/service'
import type { Campaign } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { AuthorizationError, canAccessShop, isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { campaignFormSchema, type CampaignFormInput } from './schema'

/** Sorumlu yalnızca erişebildiği dükkan için SHOP kapsamlı kampanya yönetir. */
function assertCampaignScope(staff: StaffContext, scope: string, shopId: string | null): void {
  if (isOwner(staff)) return
  if (scope !== 'SHOP' || !shopId || !canAccessShop(staff, shopId)) throw new AuthorizationError()
}

/** Görsel, kampanya klasöründen gelmeli; sorumlu için kendi yüklediği olmalı. */
async function assertCampaignImage(staff: StaffContext, imageId: string): Promise<string | null> {
  const media = await db.media.findUnique({ where: { id: imageId }, select: { path: true } })
  if (!media) return 'Kampanya görseli bulunamadı.'
  const allowed = isOwner(staff)
    ? media.path.startsWith('campaign/')
    : media.path.startsWith(`campaign/${staff.id}/`)
  return allowed ? null : 'Görsel bu kullanıcıya ait değil.'
}

function toData(data: CampaignFormInput) {
  return {
    title: data.title,
    description: data.description,
    imageId: data.imageId,
    scope: data.scope,
    shopId: data.shopId,
    locationId: data.locationId,
    ctaLabel: data.ctaLabel,
    ctaUrl: data.ctaUrl,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    isActive: data.isActive,
    sortOrder: data.sortOrder,
  }
}

export async function createCampaign(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<Campaign>> {
  const parsed = campaignFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  assertCampaignScope(staff, parsed.data.scope, parsed.data.shopId)
  const imageError = await assertCampaignImage(staff, parsed.data.imageId)
  if (imageError) return fail(imageError)

  const campaign = await db.$transaction(async (tx) => {
    const created = await tx.campaign.create({
      data: { ...toData(parsed.data), createdById: staff.id },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'campaign.create',
      entityType: 'Campaign',
      entityId: created.id,
      summary: `"${created.title}" kampanyası oluşturuldu`,
    })
    return created
  })
  return ok(campaign)
}

export async function updateCampaign(
  staff: StaffContext,
  campaignId: string,
  input: unknown,
): Promise<ActionResult<Campaign>> {
  const existing = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { scope: true, shopId: true, imageId: true },
  })
  if (!existing) return fail('Kampanya bulunamadı.')
  assertCampaignScope(staff, existing.scope, existing.shopId)

  const parsed = campaignFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  assertCampaignScope(staff, parsed.data.scope, parsed.data.shopId)
  if (parsed.data.imageId !== existing.imageId) {
    const imageError = await assertCampaignImage(staff, parsed.data.imageId)
    if (imageError) return fail(imageError)
  }

  const { updated, oldPath } = await db.$transaction(async (tx) => {
    const result = await tx.campaign.update({
      where: { id: campaignId },
      data: toData(parsed.data),
    })
    const removed =
      parsed.data.imageId !== existing.imageId ? await deleteMediaRow(tx, existing.imageId) : null
    await logAudit(tx, {
      staffId: staff.id,
      action: 'campaign.update',
      entityType: 'Campaign',
      entityId: campaignId,
      summary: `"${result.title}" kampanyası güncellendi`,
    })
    return { updated: result, oldPath: removed }
  })
  if (oldPath) await removeObjects([oldPath])
  return ok(updated)
}

export async function deleteCampaign(
  staff: StaffContext,
  campaignId: string,
): Promise<ActionResult<null>> {
  const existing = await db.campaign.findUnique({
    where: { id: campaignId },
    select: { title: true, scope: true, shopId: true, imageId: true },
  })
  if (!existing) return fail('Kampanya bulunamadı.')
  assertCampaignScope(staff, existing.scope, existing.shopId)

  const path = await db.$transaction(async (tx) => {
    await tx.campaign.delete({ where: { id: campaignId } })
    const removed = await deleteMediaRow(tx, existing.imageId)
    await logAudit(tx, {
      staffId: staff.id,
      action: 'campaign.delete',
      entityType: 'Campaign',
      entityId: campaignId,
      summary: `"${existing.title}" kampanyası silindi`,
    })
    return removed
  })
  if (path) await removeObjects([path])
  return ok(null)
}
