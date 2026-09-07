import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { removeObjects } from './storage'

type Client = Prisma.TransactionClient

/**
 * Media satırını siler ve dosya yolunu döndürür. Storage silme işlemi transaction
 * commit'inden SONRA `removeObjects` ile yapılmalıdır (DB geri alınırsa dosya kaybolmasın).
 */
export async function deleteMediaRow(client: Client, mediaId: string): Promise<string | null> {
  const media = await client.media.findUnique({ where: { id: mediaId }, select: { path: true } })
  if (!media) return null
  await client.media.delete({ where: { id: mediaId } })
  return media.path
}

export { removeObjects }
