import Link from 'next/link'
import type { ComponentProps } from 'react'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: { href: ComponentProps<typeof Link>['href']; label: string }
  as?: 'h1' | 'h2'
}

export function SectionHeading({ title, subtitle, action, as: Tag = 'h2' }: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <Tag className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</Tag>
        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground sm:text-base">{subtitle}</p>
        ) : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="shrink-0 text-sm font-medium text-brand hover:underline"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
