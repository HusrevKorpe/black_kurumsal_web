import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { NavShopGroup } from '@/features/shops/nav'
import type { NavContact, NavItem } from './mobile-nav'
import { MobileNavSheet } from './mobile-nav-sheet'

const items: NavItem[] = [
  { href: '/#dukkanlar', label: 'Dükkanlar' },
  { href: '/kampanyalar', label: 'Kampanyalar' },
]

function renderSheet(contact: NavContact, shopGroups: NavShopGroup[] = []) {
  return render(
    <MobileNavSheet
      id="mobil-menu"
      open
      onOpenChange={vi.fn()}
      items={items}
      brandName="Black"
      contact={contact}
      shopGroups={shopGroups}
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

  it('dükkan rehberi varsa dükkanlar bölgeleriyle listelenir, ana sayfa bölümü satırı düşer', () => {
    renderSheet({ phone: null, instagramUrl: null }, [
      {
        key: 'carsi',
        title: { href: '/mekan/carsi', label: 'Çarşı' },
        links: [{ href: '/black-tost-carsi', label: 'Black Tost Çarşı', type: 'FOOD', note: null }],
      },
      {
        key: 'garden',
        title: null,
        links: [
          { href: '/mekan/black-garden', label: 'Black Garden', type: null, note: '7 dükkan' },
          { href: '/lulu-kafe', label: 'Lulu Kafe', type: 'FOOD', note: 'Tadilatta' },
        ],
      },
    ])
    const directory = screen.getByRole('region', { name: 'Dükkanlar' })
    expect(screen.getByRole('link', { name: 'Çarşı' })).toHaveAttribute('href', '/mekan/carsi')
    expect(screen.getByRole('link', { name: 'Black Tost Çarşı' })).toHaveAttribute(
      'href',
      '/black-tost-carsi',
    )
    expect(directory).toHaveTextContent('Black Garden7 dükkan')
    expect(directory).toHaveTextContent('Lulu KafeTadilatta')
    expect(screen.queryByRole('link', { name: 'Dükkanlar' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Kampanyalar' })).toHaveAttribute(
      'href',
      '/kampanyalar',
    )
    expect(screen.getByRole('link', { name: 'KVKK ve Gizlilik' })).toHaveAttribute('href', '/kvkk')
  })
})
