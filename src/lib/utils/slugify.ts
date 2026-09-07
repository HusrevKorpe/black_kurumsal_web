import { RESERVED_SLUGS } from '@/lib/constants/routes'

const TR_MAP: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
}

/** Türkçe karakterleri sadeleştirip URL dostu slug üretir: "Black İnternet Kafe Çarşı" → "black-internet-kafe-carsi" */
export function slugify(input: string): string {
  return input
    .trim()
    .replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function isValidSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && slug.length >= 2 && slug.length <= 80
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug)
}
