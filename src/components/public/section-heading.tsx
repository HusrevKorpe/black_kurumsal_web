import Link from 'next/link'
import type { ComponentProps } from 'react'

interface SectionHeadingProps {
  title: string
  subtitle?: string
  action?: { href: ComponentProps<typeof Link>['href']; label: string }
  as?: 'h1' | 'h2'
  /** Bölümün aria-labelledby'ı buna bağlanır. */
  id?: string
}

export function SectionHeading({
  title,
  subtitle,
  action,
  as: Tag = 'h2',
  id,
}: SectionHeadingProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 lg:mb-6">
      <div>
        <Tag
          id={id}
          className="font-display text-3xl leading-tight font-bold uppercase lg:text-5xl"
        >
          {title}
        </Tag>
        {subtitle ? <p className="mt-1 text-muted-foreground lg:text-lg">{subtitle}</p> : null}
      </div>
      {action ? (
        <Link
          href={action.href}
          className="-my-2 inline-flex min-h-12 shrink-0 items-center text-sm font-medium text-brand hover:underline"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}
