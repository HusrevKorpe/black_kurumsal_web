'use client'

import { useCallback, useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { ActionResult, FieldErrors } from './result'

interface UseActionOptions<TData> {
  successMessage?: string
  onSuccess?: (data: TData) => void
}

/**
 * Server action çağrısını tek yerden yönetir: bekleme durumu, alan hataları, toast.
 * Formlar `run(input)` çağırır; sonuç ok değilse hata alanlara dağıtılır.
 */
export function useAction<TInput, TData>(
  action: (input: TInput) => Promise<ActionResult<TData>>,
  options: UseActionOptions<TData> = {},
) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const run = useCallback(
    (input: TInput) =>
      new Promise<ActionResult<TData>>((resolve) => {
        startTransition(async () => {
          const result = await action(input)
          if (result.ok) {
            setError(null)
            setFieldErrors({})
            if (options.successMessage) toast.success(options.successMessage)
            options.onSuccess?.(result.data)
          } else {
            setError(result.error)
            setFieldErrors(result.fieldErrors ?? {})
            toast.error(result.error)
          }
          resolve(result)
        })
      }),
    // options nesnesi her render'da yeni; alanları ayrı ayrı bağımlılık yapıyoruz.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action, options.successMessage, options.onSuccess],
  )

  const clearErrors = useCallback(() => {
    setError(null)
    setFieldErrors({})
  }, [])

  return { run, pending, error, fieldErrors, clearErrors }
}

/** Alan hatasının ilk mesajı. */
export function firstError(fieldErrors: FieldErrors, key: string): string | undefined {
  return fieldErrors[key]?.[0]
}
