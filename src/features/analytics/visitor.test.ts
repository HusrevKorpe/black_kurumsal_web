import { describe, expect, it } from 'vitest'
import {
  clientIpFromHeaders,
  deviceFromUserAgent,
  hashVisitor,
  isBotUserAgent,
  looksLikeStaffRequest,
  normalizeSource,
} from './visitor'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

describe('ziyaretçi imzası', () => {
  it('aynı gün aynı ziyaretçi için aynı, ertesi gün farklı', () => {
    const today = hashVisitor('tuz', '2026-09-07', '1.2.3.4', CHROME)
    expect(hashVisitor('tuz', '2026-09-07', '1.2.3.4', CHROME)).toBe(today)
    expect(hashVisitor('tuz', '2026-09-08', '1.2.3.4', CHROME)).not.toBe(today)
  })

  it('farklı IP ve farklı tuz farklı imza verir', () => {
    const base = hashVisitor('tuz', '2026-09-07', '1.2.3.4', CHROME)
    expect(hashVisitor('tuz', '2026-09-07', '5.6.7.8', CHROME)).not.toBe(base)
    expect(hashVisitor('baska-tuz', '2026-09-07', '1.2.3.4', CHROME)).not.toBe(base)
  })

  it('16 hane uzunluğunda ve IP içermez', () => {
    const hash = hashVisitor('tuz', '2026-09-07', '1.2.3.4', CHROME)
    expect(hash).toHaveLength(16)
    expect(hash).not.toContain('1.2.3.4')
  })
})

describe('istek başlıkları', () => {
  it('x-forwarded-for zincirinden ilk adresi alır', () => {
    const headers = new Headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1' })
    expect(clientIpFromHeaders(headers)).toBe('9.9.9.9')
  })

  it('başlık yoksa sabit bir değere düşer', () => {
    expect(clientIpFromHeaders(new Headers())).toBe('bilinmiyor')
  })

  it('Supabase oturum çerezi personel demektir', () => {
    expect(looksLikeStaffRequest('sb-isqneubs-auth-token=abc; theme=dark')).toBe(true)
    expect(looksLikeStaffRequest('theme=dark')).toBe(false)
    expect(looksLikeStaffRequest(null)).toBe(false)
  })
})

describe('robot ayıklama', () => {
  it('gerçek tarayıcıları geçirir', () => {
    expect(isBotUserAgent(CHROME)).toBe(false)
    expect(isBotUserAgent(IPHONE)).toBe(false)
  })

  it('robotları, boş ve kısa imzaları eler', () => {
    expect(isBotUserAgent('Mozilla/5.0 (compatible; Googlebot/2.1)')).toBe(true)
    expect(isBotUserAgent('HeadlessChrome/141.0.0.0')).toBe(true)
    expect(isBotUserAgent('WhatsApp/2.23')).toBe(true)
    expect(isBotUserAgent('')).toBe(true)
    expect(isBotUserAgent(null)).toBe(true)
  })
})

describe('cihaz', () => {
  it('telefon ve bilgisayarı ayırır', () => {
    expect(deviceFromUserAgent(IPHONE)).toBe('MOBILE')
    expect(deviceFromUserAgent(CHROME)).toBe('DESKTOP')
  })
})

describe('kaynak', () => {
  const site = 'black.com.tr'

  it('bilinen siteleri sadeleştirir', () => {
    expect(normalizeSource('https://www.google.com/search?q=black', site)).toBe('google')
    expect(normalizeSource('https://l.instagram.com/?u=x', site)).toBe('instagram')
    expect(normalizeSource('https://t.co/abc', site)).toBe('x')
  })

  it('kendi sitemizden gelen gezinme ve boş referrer doğrudan sayılır', () => {
    expect(normalizeSource('https://black.com.tr/kampanyalar', site)).toBeNull()
    expect(normalizeSource('https://www.black.com.tr/', site)).toBeNull()
    expect(normalizeSource('', site)).toBeNull()
    expect(normalizeSource(null, site)).toBeNull()
    expect(normalizeSource('bozuk-adres', site)).toBeNull()
  })

  it('tanımadığı siteyi alan adı olarak bırakır', () => {
    expect(normalizeSource('https://forum.example.org/konu/5', site)).toBe('forum.example.org')
  })
})
