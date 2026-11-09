import { describe, expect, it } from 'vitest'
import { isPlaceholderCampaignImage } from './placeholder'

describe('isPlaceholderCampaignImage', () => {
  it('yükleyeni olmayan, alt metni başlık olan görsel yer tutucudur', () => {
    expect(
      isPlaceholderCampaignImage({ alt: 'Cuma Gecesi', uploadedById: null }, 'Cuma Gecesi'),
    ).toBe(true)
  })

  it('panelden yüklenen görsel yer tutucu değildir', () => {
    expect(
      isPlaceholderCampaignImage({ alt: 'Cuma Gecesi', uploadedById: 's1' }, 'Cuma Gecesi'),
    ).toBe(false)
  })

  it('yükleyen bilgisi seçilmemişse (undefined) gerçek sayılır', () => {
    expect(isPlaceholderCampaignImage({ alt: 'Cuma Gecesi' }, 'Cuma Gecesi')).toBe(false)
  })

  it('alt metni farklıysa gerçek sayılır', () => {
    expect(isPlaceholderCampaignImage({ alt: 'Afiş', uploadedById: null }, 'Cuma Gecesi')).toBe(
      false,
    )
  })
})
