import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { PriceCategoryView } from '@/features/pricing/view'
import { PriceList } from './price-list'

const categories: PriceCategoryView[] = [
  {
    id: 'c1',
    name: 'Oyun Ücretleri',
    description: 'Saatlik',
    isActive: true,
    items: [
      {
        id: 'i1',
        name: 'PS5 Saatlik',
        description: null,
        price: '120',
        unit: 'saat',
        isAvailable: true,
        isFeatured: true,
        image: null,
      },
      {
        id: 'i2',
        name: 'PS4 Saatlik',
        description: 'Eski nesil',
        price: '90.5',
        unit: 'saat',
        isAvailable: false,
        isFeatured: false,
        image: null,
      },
      {
        id: 'i3',
        name: 'EA FC 26',
        description: null,
        price: null,
        unit: null,
        isAvailable: true,
        isFeatured: false,
        image: null,
      },
    ],
  },
]

describe('PriceList', () => {
  it('kategori, fiyat, birim, öne çıkan ve tükendi rozetlerini gösterir', () => {
    render(<PriceList categories={categories} />)
    expect(screen.getByRole('heading', { name: 'Oyun Ücretleri' })).toBeInTheDocument()
    expect(screen.getByText('₺120 / saat')).toBeInTheDocument()
    expect(screen.getByText('₺90,50 / saat')).toBeInTheDocument()
    expect(screen.getByText('Öne çıkan')).toBeInTheDocument()
    expect(screen.getByText('Tükendi')).toBeInTheDocument()
    expect(screen.getByText('Eski nesil')).toBeInTheDocument()
  })

  it('fiyatsız kalemde fiyat yazmaz', () => {
    render(<PriceList categories={categories} />)
    const row = screen.getByText('EA FC 26').closest('li')
    expect(row).not.toBeNull()
    expect(row?.textContent).not.toMatch(/₺/)
  })

  it('boş listede bilgi mesajı', () => {
    render(<PriceList categories={[]} />)
    expect(screen.getByText('Fiyat listesi henüz eklenmedi.')).toBeInTheDocument()
  })
})
