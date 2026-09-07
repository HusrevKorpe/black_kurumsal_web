'use client'

import { XIcon } from 'lucide-react'
import { useState, type KeyboardEvent } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

interface FeaturesInputProps {
  id: string
  value: string[]
  onChange: (next: string[]) => void
  max?: number
  placeholder?: string
}

/** Etiket girişi: Enter veya virgül ile ekler, çarpı ile siler. Telefonda da rahat çalışır. */
export function FeaturesInput({ id, value, onChange, max = 12, placeholder }: FeaturesInputProps) {
  const [draft, setDraft] = useState('')

  function commit() {
    const text = draft.trim().replace(/,+$/, '').trim()
    if (!text) return
    if (value.length >= max || value.some((v) => v.toLowerCase() === text.toLowerCase())) {
      setDraft('')
      return
    }
    onChange([...value, text.slice(0, 40)])
    setDraft('')
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commit()
    } else if (event.key === 'Backspace' && draft === '' && value.length > 0) {
      onChange(value.slice(0, -1))
    }
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((feature) => (
            <li key={feature}>
              <Badge variant="secondary" className="gap-1 py-1 pr-1 pl-2.5 text-sm">
                {feature}
                <button
                  type="button"
                  onClick={() => onChange(value.filter((v) => v !== feature))}
                  className="rounded-full p-0.5 hover:bg-foreground/10"
                  aria-label={`${feature} özelliğini kaldır`}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <Input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        disabled={value.length >= max}
        className="h-10"
        enterKeyHint="done"
      />
    </div>
  )
}
