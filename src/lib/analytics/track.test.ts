// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

beforeEach(() => {
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
