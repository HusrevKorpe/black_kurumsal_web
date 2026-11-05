/**
 * İlk boyamadan önce çalışan satır içi betik (Next kılavuzu: preventing-flash-before-hydration).
 * Tarayıcıda React betiği yeniden çizerse `text/plain` olur: çalışmaz, geliştirmede "script tag"
 * uyarısı da çıkmaz. Tür farkını `suppressHydrationWarning` kabul eder.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === 'undefined' ? 'text/javascript' : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
