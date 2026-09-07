import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import React from 'react'
import { afterEach, vi } from 'vitest'

// globals=false olduğundan Testing Library otomatik temizlemez; her testten sonra DOM sıfırlanır.
afterEach(() => {
  cleanup()
})

// next/image jsdom'da optimizasyon yapılandırması ister; düz <img> yeter.
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, sizes: _sizes, ...rest } = props
    return React.createElement('img', rest as React.ImgHTMLAttributes<HTMLImageElement>)
  },
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
