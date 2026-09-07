import { Badge } from '@/components/ui/badge'

interface FeatureChipsProps {
  features: readonly string[]
}

export function FeatureChips({ features }: FeatureChipsProps) {
  if (features.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-2">
      {features.map((feature) => (
        <li key={feature}>
          <Badge variant="outline" className="px-2.5 py-1 text-sm">
            {feature}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
