import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { NavContact, NavItem } from './mobile-nav'
import { MobileNavSheet } from './mobile-nav-sheet'

const items: NavItem[] = [
  { href: '/#dukkanlar', label: 'Dükkanlar' },
  { href: '/kampanyalar', label: 'Kampanyalar' },
]

function renderSheet(contact: NavContact) {
  return render(
    <MobileNavSheet
      id="mobil-menu"
      open
      onOpenChange={vi.fn()}
      items={items}
      brandName="Black"
      contact={contact}
      finalFocus={{ current: null }}
    />,
  )
}

describe('MobileNavSheet', () => {
  it('menü bağlantılarının altında sitenin telefonu ve Instagram’ı çıkar', () => {
    renderSheet({ phone: '0555 000 00 00', instagramUrl: 'https://instagram.com/black' })
    const nav = screen.getByRole('navigation', { name: 'Mobil menü' })
    expect(nav).toHaveTextContent('Dükkanlar')
    expect(nav).toHaveTextContent('Kampanyalar')

    const contact = screen.getByRole('region', { name: 'İletişim' })
    const call = screen.getByRole('link', { name: /Ara 0555 000 00 00/ })
    expect(contact).toContainElement(call)
    expect(call).toHaveAttribute('href', 'tel:+905550000000')
    expect(call).toHaveAttribute('data-track', 'call')
    const instagram = screen.getByRole('link', { name: 'Instagram' })
    expect(instagram).toHaveAttribute('href', 'https://instagram.com/black')
    expect(instagram).toHaveAttribute('target', '_blank')
  })

  it('ayarlarda iletişim yoksa bölüm hiç basılmaz', () => {
    renderSheet({ phone: null, instagramUrl: null })
    expect(screen.queryByRole('region', { name: 'İletişim' })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Ara/ })).not.toBeInTheDocument()
  })
})
