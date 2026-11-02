'use client'

import { useLayoutEffect, useRef, type CSSProperties } from 'react'

/** Sayfa içi gezinmede ana sayfaya dönünce yazı yeniden yanmasın; tam yenileme yeni giriş sayılır. */
let playedThisVisit = false

/**
 * Süs yazısı: açılışta ışık harf harf soldan sağa geçer, sonra normal rengine oturur. Sonraki hareket
 * CSS'te (`.hero-wordmark-letter`), JS gelmeden de oynar. Tek seferlik ve 5 sn'den kısa olduğu için
 * durdurma düğmesine bağlı değil (WCAG 2.2.2).
 */
export function HeroWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null)
  const letters = Array.from(text)

  // Boyamadan önce çalışır ki dönüşte yazı bir kare bile karanlık görünmesin.
  useLayoutEffect(() => {
    if (playedThisVisit && ref.current) ref.current.dataset.played = 'true'
  }, [])

  return (
    <p
      ref={ref}
      aria-hidden
      className="hero-wordmark font-display font-bold uppercase"
      style={{ '--brand-length': letters.length } as CSSProperties}
      onAnimationEnd={() => {
        playedThisVisit = true
      }}
    >
      {letters.map((letter, index) => (
        <span
          key={index}
          className="hero-wordmark-letter"
          style={{ '--letter-index': index } as CSSProperties}
        >
          {letter}
        </span>
      ))}
    </p>
  )
}
