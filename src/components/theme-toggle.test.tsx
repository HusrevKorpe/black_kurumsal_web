import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_COLORS, THEME_SCRIPT, THEME_STORAGE_KEY } from '@/lib/browser/theme'
import { ThemeToggle } from './theme-toggle'

const root = document.documentElement

function runScript() {
  // Sunucu HTML'i gibi: koyu sınıf ve theme-color etiketiyle başla, sonra betik çalışsın.
  root.className = 'dark'
  root.style.colorScheme = 'dark'
  document.head.innerHTML = `<meta name="theme-color" content="${THEME_COLORS.dark}">`
  new Function(THEME_SCRIPT)()
}

const themeColor = () => document.querySelector('meta[name="theme-color"]')?.getAttribute('content')

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('tema betiği', () => {
  it('tercih yoksa koyu kalır', () => {
    runScript()
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(themeColor()).toBe(THEME_COLORS.dark)
  })

  it('kayıtlı açık temayı ilk boyamadan önce uygular', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    runScript()
    expect(root).not.toHaveClass('dark')
    expect(root.style.colorScheme).toBe('light')
    expect(themeColor()).toBe(THEME_COLORS.light)
  })

  it('theme-color etiketi yoksa tek bir tane kurar', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    document.head.innerHTML = ''
    new Function(THEME_SCRIPT)()
    expect(document.querySelectorAll('meta[name="theme-color"]')).toHaveLength(1)
    expect(themeColor()).toBe(THEME_COLORS.light)
  })

  it('bozuk değeri yok sayar', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'mor')
    runScript()
    expect(root).toHaveClass('dark')
  })

  it('depolama kapalıysa hata vermeden koyu kalır', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(runScript).not.toThrow()
    expect(root).toHaveClass('dark')
  })
})

describe('ThemeToggle', () => {
  it('koyudan açığa geçer, tercihi saklar, etiketi günceller', async () => {
    runScript()
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Açık temaya geç' })

    await act(async () => {
      fireEvent.click(button)
    })

    expect(root).not.toHaveClass('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')
    expect(themeColor()).toBe(THEME_COLORS.light)
    expect(await screen.findByRole('button', { name: 'Koyu temaya geç' })).toBeInTheDocument()
  })

  it('başka sekmedeki değişikliği izler', async () => {
    runScript()
    render(<ThemeToggle />)
    await act(async () => {
      window.dispatchEvent(
        new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'light' }),
      )
    })
    expect(root).not.toHaveClass('dark')
    expect(await screen.findByRole('button', { name: 'Koyu temaya geç' })).toBeInTheDocument()
  })
})
