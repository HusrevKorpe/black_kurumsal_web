import type { CSSProperties } from 'react'

/** `HeroWordmark` ile aynı harf kutuları (animasyonsuz); üst üste binen katmanlar milimetrik çakışsın. */
export function HeroWordmarkGhost({ text }: { text: string }) {
  const letters = Array.from(text)
  return (
    <p
      className="hero-wordmark font-display font-bold uppercase"
      style={{ '--brand-length': letters.length } as CSSProperties}
    >
      {letters.map((letter, index) => (
        <span key={index} className="hero-wordmark-ghost-letter">
          {letter}
        </span>
      ))}
    </p>
  )
}
