import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { normalizeWeek } from '@/features/hours'
import { OpenStatusBadge } from './open-status-badge'

const daily = (opensAt: string, closesAt: string) =>
  normalizeWeek(
    [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({ dayOfWeek, opensAt, closesAt, isClosed: false })),
  )

describe('OpenStatusBadge', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('açık saatte "Şu an açık" ve kapanış saatini gösterir', () => {
    vi.setSystemTime(new Date('2026-09-05T12:00:00+03:00'))
    render(<OpenStatusBadge week={daily('10:00', '02:00')} detailed />)
    expect(screen.getByText(/Şu an açık/)).toBeInTheDocument()
    expect(screen.getByText(/Kapanış 02:00/)).toBeInTheDocument()
  })

  it('kapalı saatte sonraki açılışı gösterir', () => {
    vi.setSystemTime(new Date('2026-09-05T05:00:00+03:00')) // Cumartesi 05:00
    render(<OpenStatusBadge week={daily('10:00', '02:00')} detailed />)
    expect(screen.getByText(/Şu an kapalı/)).toBeInTheDocument()
    expect(screen.getByText(/Açılış Cumartesi 10:00/)).toBeInTheDocument()
  })

  it('saat bilgisi yoksa hiçbir şey çizmez', () => {
    const { container } = render(<OpenStatusBadge week={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
