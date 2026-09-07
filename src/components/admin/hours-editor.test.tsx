import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { HoursInput } from '@/features/hours'
import { HoursEditor } from './hours-editor'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const shopHours: HoursInput[] = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  opensAt: '10:00',
  closesAt: '22:00',
  isClosed: false,
}))
const venueHours: HoursInput[] = [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
  dayOfWeek,
  opensAt: '11:00',
  closesAt: '23:30',
  isClosed: false,
}))

describe('HoursEditor', () => {
  it('kendi saatleri kapatılınca mekan saatleri önizlenir', async () => {
    const user = userEvent.setup()
    render(
      <HoursEditor
        initialHours={shopHours}
        inherited={{ name: 'Black Garden', hours: venueHours }}
        useOwnLabel="Bu dükkanın kendi saatleri var"
        hint="ipucu"
        saveAction={vi.fn(async (_input: unknown) => ({ ok: true as const, data: null }))}
      />,
    )
    expect(screen.getByLabelText('Pazartesi Açılış')).toHaveValue('10:00')
    await user.click(screen.getByRole('switch'))
    expect(screen.getByText('Black Garden saatleri (devralınan)')).toBeInTheDocument()
    expect(screen.getAllByText('11:00 – 23:30')).toHaveLength(7)
  })

  it('"Pazartesiyi tüm günlere uygula" kopyalar ve kaydet 7 gün gönderir', async () => {
    const user = userEvent.setup()
    const save = vi.fn(async (_input: unknown) => ({ ok: true as const, data: null }))
    render(
      <HoursEditor
        initialHours={[]}
        inherited={null}
        useOwnLabel="Kendi saatleri"
        hint=""
        saveAction={save}
      />,
    )

    await user.click(screen.getByRole('switch'))
    const monday = screen.getByLabelText('Pazartesi Açılış')
    await user.clear(monday)
    await user.type(monday, '08:15')
    await user.click(screen.getByRole('button', { name: 'Pazartesiyi tüm günlere uygula' }))
    expect(screen.getByLabelText('Pazar Açılış')).toHaveValue('08:15')

    await user.click(screen.getByRole('button', { name: 'Kaydet' }))
    expect(save).toHaveBeenCalledTimes(1)
    const payload = save.mock.calls[0]?.[0] as {
      useOwnHours: boolean
      days: { opensAt: string | null }[]
    }
    expect(payload.useOwnHours).toBe(true)
    expect(payload.days).toHaveLength(7)
    expect(payload.days.every((d) => d.opensAt === '08:15')).toBe(true)
  })
})
