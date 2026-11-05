/**
 * Açık / koyu tema. Tercih tarayıcıda (`localStorage`) durur; sayfalar ISR ile önbellekten geldiği
 * için sunucu tercihi bilemez. Sunucu HTML'i koyu gelir, `<head>`'deki küçük betik (THEME_SCRIPT)
 * ilk boyamadan önce `<html>`'in `dark` sınıfını tercihe göre düzeltir; böylece beyaz/siyah parlama
 * olmaz. Tercih yoksa varsayılan koyu: markanın kimliği siyah cephe.
 */
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'tema'
export const DEFAULT_THEME: Theme = 'dark'

/** Tarayıcı çubuğunun rengi; açık sitenin zeminiyle aynı. */
export const THEME_COLORS: Record<Theme, string> = {
  dark: '#0a0a0a',
  light: '#fbfbf8',
}

export function parseTheme(value: unknown): Theme | null {
  return value === 'light' || value === 'dark' ? value : null
}

/**
 * `<head>` içine satır içi konur, React'tan önce çalışır. Gizli sekme / kapalı depolama hata
 * fırlatabilir; o durumda sunucunun koyu teması kalır. `applyTheme` ile aynı işi yapar.
 * `theme-color` etiketini de betik kurar: JSX'te olsaydı React hidrasyonda değiştirilmiş `content`'i
 * eşleştiremez, yanına koyu renkli ikinci bir etiket eklerdi.
 */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});if(t!=="light"&&t!=="dark")t=${JSON.stringify(DEFAULT_THEME)};var d=document.documentElement;d.classList.toggle("dark",t==="dark");d.style.colorScheme=t;var m=document.querySelector('meta[name="theme-color"]');if(!m){m=document.createElement("meta");m.name="theme-color";document.head.appendChild(m)}m.setAttribute("content",t==="dark"?${JSON.stringify(THEME_COLORS.dark)}:${JSON.stringify(THEME_COLORS.light)})}catch(e){}})()`

export function readTheme(): Theme {
  if (typeof document === 'undefined') return DEFAULT_THEME
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.appendChild(meta)
  }
  meta.content = THEME_COLORS[theme]
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Depolama kapalıysa tercih yalnız bu sayfada geçerli kalır.
  }
}

/** `<html>` sınıfı değişince (bu sekmede ya da başka sekmeden) haber verir. */
export function subscribeTheme(onChange: () => void): () => void {
  const observer = new MutationObserver(onChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY) return
    applyTheme(parseTheme(event.newValue) ?? DEFAULT_THEME)
  }
  window.addEventListener('storage', onStorage)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onStorage)
  }
}

/**
 * Temayı değiştirir. Renk geçişi (`transition-colors`) olan her öğe ayrı ayrı solmasın diye geçişler
 * bir kare kapatılır; değişim tek seferde olur.
 */
export function setTheme(theme: Theme): void {
  const style = document.createElement('style')
  style.textContent = '*,*::before,*::after{transition:none!important}'
  document.head.appendChild(style)
  applyTheme(theme)
  storeTheme(theme)
  // Stil hesaplansın, sonra geçişler geri gelsin.
  void window.getComputedStyle(document.body).opacity
  window.requestAnimationFrame(() => style.remove())
}
