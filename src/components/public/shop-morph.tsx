import { ViewTransition } from 'react'

/**
 * Dükkan kartından dükkan sayfasına geçişte aynı kalan iki parça: kapak ve ad. Kartta ve sayfada aynı
 * `name` ile sarılınca tarayıcı eski yerinden yenisine büyüterek taşır (View Transitions; Next'te
 * sayfa geçişi zaten bir transition). Desteklemeyen tarayıcıda sayfa normal açılır, animasyon olmaz.
 * `default="none"`: başka bir geçişte (ör. kampanyalar sayfası) kendi kendine solup belirmesin.
 * Bir sayfada her dükkan yalnız bir kez sarılmalı; aynı ad iki kez olursa tarayıcı geçişi atlar.
 * Süre ve kırpma globals.css `.shop-cover` / `.shop-name`.
 */
export function ShopCoverMorph({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={`shop-cover-${slug}`} share="shop-cover" default="none">
      {children}
    </ViewTransition>
  )
}

export function ShopNameMorph({ slug, children }: { slug: string; children: React.ReactNode }) {
  return (
    <ViewTransition name={`shop-name-${slug}`} share="shop-name" default="none">
      {children}
    </ViewTransition>
  )
}
