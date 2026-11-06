interface FeatureChipsProps {
  features: readonly string[]
}

/** Öne çıkanlar: Pafta etiketi (çerçeveli, köşesiz). Bilgi verir, tıklanmaz. */
export function FeatureChips({ features }: FeatureChipsProps) {
  if (features.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {features.map((feature) => (
        <li key={feature} className="pafta-chip">
          {feature}
        </li>
      ))}
    </ul>
  )
}
