import { fireEvent, render, screen } from '@testing-library/react'
import { lazy, Suspense, type ComponentType } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MobileNav, type NavItem } from './mobile-nav'

const idle = vi.hoisted(() => ({
  schedule: vi.fn<(cb: () => void) => () => void>(),
  cancel: vi.fn(),
}))

vi.mock('@/lib/browser/idle', () => ({
  whenIdleAfterLoad: (cb: () => void) => {
    idle.schedule(cb)
    return idle.cancel
  },
}))

// next/dynamic yerine düz React.lazy: test Next'in yükleyicisine değil bileşen davranışına bakar.
vi.mock('next/dynamic', () => ({
  default: (loader: () => Promise<ComponentType<Record<string, unknown>>>) => {
    const Lazy = lazy(() => loader().then((component) => ({ default: component })))
    return (props: Record<string, unknown>) => (
      <Suspense fallback={null}>
        <Lazy {...props} />
      </Suspense>
    )
  },
}))

vi.mock('./mobile-nav-sheet', () => ({
  MobileNavSheet: (props: {
    id: string
    open: boolean
    brandName: string
    items: NavItem[]
    onOpenChange: (open: boolean) => void
  }) => (
    <div data-testid="sheet" id={props.id} data-open={props.open}>
      <span>{props.brandName}</span>
      {props.items.map((item) => (
        <a key={item.href} href={item.href}>
          {item.label}
        </a>
      ))}
      <button type="button" onClick={() => props.onOpenChange(false)}>
        kapat
      </button>
    </div>
  ),
}))

const items: NavItem[] = [
  { href: '/#dukkanlar', label: 'Dükkanlar' },
  { href: '/kampanyalar', label: 'Kampanyalar' },
]

afterEach(() => {
  vi.clearAllMocks()
})

describe('MobileNav', () => {
  it('düğme sunucuda hazır gelir; çekmece açılana kadar render edilmez', () => {
    render(<MobileNav items={items} brandName="Black" />)
    const trigger = screen.getByRole('button', { name: 'Menü' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')
    expect(screen.queryByTestId('sheet')).not.toBeInTheDocument()
  })

  it('çekmece kodu sayfa boşa çıkınca önceden istenir; sökülünce plan iptal edilir', () => {
    const { unmount } = render(<MobileNav items={items} brandName="Black" />)
    expect(idle.schedule).toHaveBeenCalledTimes(1)
    unmount()
    expect(idle.cancel).toHaveBeenCalledTimes(1)
  })

  it('düğmeye basınca çekmece yüklenir ve açık gelir; kapanınca takılı kalır', async () => {
    render(<MobileNav items={items} brandName="Black" />)
    const trigger = screen.getByRole('button', { name: 'Menü' })
    fireEvent.click(trigger)

    const sheet = await screen.findByTestId('sheet')
    expect(sheet).toHaveAttribute('data-open', 'true')
    expect(sheet).toHaveAttribute('id', 'mobil-menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveAttribute('aria-controls', 'mobil-menu')
    expect(screen.getByRole('link', { name: 'Kampanyalar' })).toHaveAttribute(
      'href',
      '/kampanyalar',
    )

    fireEvent.click(screen.getByRole('button', { name: 'kapat' }))
    expect(screen.getByTestId('sheet')).toHaveAttribute('data-open', 'false')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toHaveAttribute('aria-controls')
  })
})
