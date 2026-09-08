import { beforeEach, describe, expect, it } from 'vitest'
import { REPEAT_WINDOW_MS } from '@/lib/analytics/repeat'
import { isRepeatEvent, resetDedupe } from './dedupe'

beforeEach(resetDedupe)

const NOW = 1_000_000

describe('tekrar penceresi', () => {
  it('ilk olayı geçirir, penceredeki tekrarını eler', () => {
    expect(isRepeatEvent('ziyaretci|whatsapp|/black-tost||', NOW)).toBe(false)
    expect(isRepeatEvent('ziyaretci|whatsapp|/black-tost||', NOW + 1)).toBe(true)
    expect(isRepeatEvent('ziyaretci|whatsapp|/black-tost||', NOW + REPEAT_WINDOW_MS - 1)).toBe(true)
  })

  it('pencere dolunca yeniden sayar', () => {
    isRepeatEvent('anahtar', NOW)
    expect(isRepeatEvent('anahtar', NOW + REPEAT_WINDOW_MS)).toBe(false)
  })

  it('tekrarlar pencereyi uzatmaz', () => {
    isRepeatEvent('anahtar', NOW)
    isRepeatEvent('anahtar', NOW + REPEAT_WINDOW_MS - 1)
    expect(isRepeatEvent('anahtar', NOW + REPEAT_WINDOW_MS)).toBe(false)
  })

  it('farklı olaylar ve farklı ziyaretçiler birbirini etkilemez', () => {
    isRepeatEvent('ziyaretci|whatsapp|/black-tost||', NOW)
    expect(isRepeatEvent('ziyaretci|call|/black-tost||', NOW)).toBe(false)
    expect(isRepeatEvent('baskasi|whatsapp|/black-tost||', NOW)).toBe(false)
  })
})
