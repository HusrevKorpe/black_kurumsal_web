'use client'

import { useEffect, useRef } from 'react'

/**
 * Sahnenin ışığı imleci (dokununca parmağı) izler: ebeveyne `--mx` / `--my` yazar, gerisi CSS.
 * Kare başına bir kez yazılır; azaltılmış harekette hiç bağlanmaz, ışık ortada durur.
 */
export function RenovationPointer() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const stage = ref.current?.parentElement
    if (!stage || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const rect = stage.getBoundingClientRect()
        stage.style.setProperty('--mx', `${((event.clientX - rect.left) / rect.width) * 100}%`)
        stage.style.setProperty('--my', `${((event.clientY - rect.top) / rect.height) * 100}%`)
        stage.dataset.pointer = ''
      })
    }
    stage.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      stage.removeEventListener('pointermove', onMove)
    }
  }, [])

  return <span ref={ref} hidden />
}
