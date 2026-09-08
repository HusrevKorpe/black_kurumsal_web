// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { REPEAT_WINDOW_MS } from './repeat'
import { initAnalytics, trackNavigation } from './track'

const beacon = vi.fn((_url: string, _body?: BodyInit | null) => true)

/** jsdom bağlantıyı gerçekten izlemeye kalkar; varsayılan davranış engellenir (sayaç yakalama aşamasında). */
function click(element: Element): void {
  const preventNavigation = (event: Event) => event.preventDefault()
  document.addEventListener('click', preventNavigation)
  element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
  document.removeEventListener('click', preventNavigation)
}

function payloads(): Record<string, string>[] {
  return beacon.mock.calls.map(([, body]) =>
    JSON.parse((body as unknown as { _text: string })._text),
  )
}

/** Sayaç son gönderimleri modül belleğinde tutar (tekrar penceresi). Her test saatin
 * ilerlemiş hâliyle başlar ki bir testteki tıklama sonrakini "tekrar" saymasın. */
let clock = Date.UTC(2026, 8, 8, 12)

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  clock += 60 * 60_000
  vi.setSystemTime(clock)
  // jsdom Blob'u okunur değil; gönderilen gövdeyi doğrudan iliştiriyoruz.
  vi.stubGlobal(
    'Blob',
    class {
      _text: string
      constructor(parts: string[]) {
        this._text = parts.join('')
      }
    },
  )
  vi.stubGlobal('navigator', { sendBeacon: beacon })
  beacon.mockClear()
  document.body.innerHTML = ''
  window.history.pushState({}, '', '/black-tost')
  initAnalytics()
  beacon.mockClear()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('tıklama sayacı', () => {
  it('data-track taşıyan bağlantıyı bulunduğu sayfayla birlikte gönderir', () => {
    document.body.innerHTML =
      '<a href="https://wa.me/905321234567" data-track="whatsapp"><span>Yaz</span></a>'
    click(document.querySelector('span')!)

    expect(payloads()).toEqual([{ type: 'whatsapp', path: '/black-tost' }])
  })

  it('kendi sitemize giden bağlantıda hedef yolu da gider', () => {
    document.body.innerHTML = '<a href="/kalender-ps" data-track="shop">Kart</a>'
    click(document.querySelector('a')!)

    expect(payloads()[0]).toMatchObject({
      type: 'shop',
      path: '/black-tost',
      target: '/kalender-ps',
    })
  })

  it('kampanya kimliğini taşır', () => {
    document.body.innerHTML =
      '<a href="https://x.example/kampanya" data-track="campaign" data-track-campaign="c-1">Git</a>'
    click(document.querySelector('a')!)

    expect(payloads()[0]).toMatchObject({ type: 'campaign', campaignId: 'c-1' })
  })

  it('işaretsiz tıklama sayılmaz', () => {
    document.body.innerHTML = '<a href="/baska">Başka</a>'
    click(document.querySelector('a')!)

    expect(beacon).not.toHaveBeenCalled()
  })

  it('panel sayfasındaki tıklama sayılmaz', () => {
    window.history.pushState({}, '', '/admin/dukkanlar')
    document.body.innerHTML = '<a href="/x" data-track="shop">Kart</a>'
    click(document.querySelector('a')!)

    expect(beacon).not.toHaveBeenCalled()
  })
})

describe('gezinme sayacı', () => {
  it('yeni yolu sayfa görüntülemesi olarak gönderir', () => {
    trackNavigation('/mekan/black-garden?utm=x')
    expect(payloads()[0]).toMatchObject({ type: 'view', path: '/mekan/black-garden' })
  })

  it('panel yolunu göndermez', () => {
    trackNavigation('/admin')
    expect(beacon).not.toHaveBeenCalled()
  })
})

describe('tekrar penceresi', () => {
  it('aynı düğmeye arka arkaya basmak tek sayılır', () => {
    document.body.innerHTML = '<a href="https://wa.me/905321234567" data-track="whatsapp">Yaz</a>'
    const link = document.querySelector('a')!

    click(link)
    click(link)
    click(link)

    expect(beacon).toHaveBeenCalledTimes(1)
  })

  it('pencere dolunca yeniden sayılır', () => {
    document.body.innerHTML = '<a href="https://wa.me/905321234567" data-track="whatsapp">Yaz</a>'
    const link = document.querySelector('a')!

    click(link)
    vi.setSystemTime(clock + REPEAT_WINDOW_MS)
    click(link)

    expect(beacon).toHaveBeenCalledTimes(2)
  })

  it('aynı sayfadaki başka düğme ve başka dükkanın kartı ayrı sayılır', () => {
    document.body.innerHTML =
      '<a href="tel:+905321234567" data-track="call">Ara</a>' +
      '<a href="https://wa.me/905321234567" data-track="whatsapp">Yaz</a>' +
      '<a href="/kalender-ps" data-track="shop">Bir</a>' +
      '<a href="/black-tost-2" data-track="shop">İki</a>'

    for (const link of document.querySelectorAll('a')) click(link)

    expect(payloads().map((payload) => payload.type ?? '')).toEqual([
      'call',
      'whatsapp',
      'shop',
      'shop',
    ])
    expect(payloads().at(-1)).toMatchObject({ target: '/black-tost-2' })
  })

  it('aynı sayfa üst üste görüntülenmiş sayılmaz', () => {
    trackNavigation('/mekan/black-garden')
    trackNavigation('/mekan/black-garden?utm=x')

    expect(beacon).toHaveBeenCalledTimes(1)
  })
})
