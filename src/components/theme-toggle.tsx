'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useSyncExternalStore } from 'react'
import { DEFAULT_THEME, readTheme, setTheme, subscribeTheme } from '@/lib/browser/theme'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

/** Temayı `<html>` sınıfından okur; sunucuda ve hidrasyonda varsayılan, sonra gerçek değer. */
export function useTheme() {
  return useSyncExternalStore(subscribeTheme, readTheme, () => DEFAULT_THEME)
}

/**
 * Açık / koyu tema düğmesi. Simge CSS ile seçilir (`dark:`), hidrasyondan önce de doğru görünür;
 * etiket ise geçilecek temayı söyler.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useTheme()
  const next = theme === 'dark' ? 'light' : 'dark'
  const label = next === 'light' ? tr.theme.toLight : tr.theme.toDark

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={() => setTheme(next)}
      className={cn(
        'inline-flex size-12 items-center justify-center rounded-lg text-muted-foreground outline-none hover:bg-muted/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 [&_svg]:size-5',
        className,
      )}
    >
      <SunIcon aria-hidden className="hidden dark:block" />
      <MoonIcon aria-hidden className="dark:hidden" />
    </button>
  )
}
