export const MEDIA_OWNER_KINDS = ['shop', 'location', 'campaign', 'settings', 'price-item'] as const
export type MediaOwnerKind = (typeof MEDIA_OWNER_KINDS)[number]

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number]

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

const EXTENSIONS: Record<AllowedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
}

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value)
}

/** `<kind>/<ownerId>/<uuid>.<ext>` — yetki, yoldan geri okunabilir. */
export function buildMediaPath(
  kind: MediaOwnerKind,
  ownerId: string,
  mimeType: AllowedImageType,
  uuid: string,
): string {
  return `${kind}/${ownerId}/${uuid}.${EXTENSIONS[mimeType]}`
}

const PATH_PATTERN = new RegExp(
  `^(${MEDIA_OWNER_KINDS.join('|')})/([A-Za-z0-9_-]{1,64})/([0-9a-f-]{36})\\.(jpg|png|webp|avif)$`,
)

export interface ParsedMediaPath {
  kind: MediaOwnerKind
  ownerId: string
}

export function parseMediaPath(path: string): ParsedMediaPath | null {
  const match = PATH_PATTERN.exec(path)
  if (!match) return null
  return { kind: match[1] as MediaOwnerKind, ownerId: match[2] as string }
}
