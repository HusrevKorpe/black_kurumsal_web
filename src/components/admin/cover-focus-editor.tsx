'use client'

import { CrosshairIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, useTransition, type KeyboardEvent, type PointerEvent } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { coverObjectPosition, DEFAULT_FOCUS_Y } from '@/features/media/cover-focus'
import type { ActionResult } from '@/lib/actions/result'
import { tr } from '@/lib/i18n/tr'

interface CoverFocusEditorProps {
  url: string
  alt: string
  /** Kaydedilmiş boyut; yoksa (eski kayıt) dik telefon oranı varsayılır, yüklenince gerçeğine döner. */
  width: number | null
  height: number | null
  focusY: number | null
  saveAction: (input: { focusY: number }) => Promise<ActionResult<null>>
}

/**
 * Kapağın sitede görünen dilimini seçtirir. Önizlemeler açık sitedeki şeritle aynı kırpar:
 * bilgisayarda geniş şerit (tam genişlik × 28rem, 1440 px ekranda ≈ 16:5), telefonda 16:10, altta
 * başlığın bindiği karartmayla. Fotoğrafa dokunulan nokta her iki şeritte de görünür kalır, çünkü
 * `object-position: 50% y%` fotoğrafın y% noktasını kutunun y% noktasına oturtur.
 */
export function CoverFocusEditor({
  url,
  alt,
  width,
  height,
  focusY,
  saveAction,
}: CoverFocusEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const saved = focusY ?? DEFAULT_FOCUS_Y
  const [value, setValue] = useState(saved)
  const t = tr.admin.coverFocus
  const position = coverObjectPosition(value)
  const band = desktopBand(width ?? 3, height ?? 4, value)

  function pick(event: PointerEvent<HTMLButtonElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    const y = ((event.clientY - box.top) / box.height) * 100
    setValue(Math.min(100, Math.max(0, Math.round(y))))
  }

  /** Klavyeyle de seçilebilsin: oklar 5'er adım. */
  function nudge(event: KeyboardEvent<HTMLButtonElement>) {
    const step = event.key === 'ArrowUp' ? -5 : event.key === 'ArrowDown' ? 5 : 0
    if (step === 0) return
    event.preventDefault()
    setValue((v) => Math.min(100, Math.max(0, v + step)))
  }

  function save() {
    startTransition(async () => {
      const result = await saveAction({ focusY: value })
      if (result.ok) {
        toast.success(t.saved)
        router.refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  return (
    <section
      className="space-y-4 rounded-xl border bg-card p-4"
      aria-labelledby="cover-focus-title"
    >
      <div>
        <h2 id="cover-focus-title" className="font-semibold">
          {t.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.hint}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
        <figure className="space-y-1.5">
          <figcaption className="text-xs text-muted-foreground">{t.full}</figcaption>
          <button
            type="button"
            onPointerDown={pick}
            onKeyDown={nudge}
            aria-label={`${t.slider}: %${value}`}
            className="relative block w-full max-w-40 cursor-crosshair overflow-hidden rounded-md border focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            {/* Fotoğrafın kendi oranında, kırpılmadan: dokunulan yer = görünecek yer. */}
            <Image
              src={url}
              alt={alt}
              width={width ?? 3}
              height={height ?? 4}
              sizes="160px"
              className="h-auto w-full"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 flex items-center justify-center border-y-2 border-brand bg-brand/15"
              style={{ top: `${band.top}%`, height: `${band.height}%` }}
            >
              <CrosshairIcon className="size-4 text-brand drop-shadow" />
            </span>
          </button>
        </figure>

        <div className="space-y-3">
          <figure className="space-y-1.5">
            <figcaption className="text-xs text-muted-foreground">{t.desktop}</figcaption>
            <Preview url={url} position={position} className="aspect-[16/5]" />
          </figure>
          <figure className="max-w-72 space-y-1.5">
            <figcaption className="text-xs text-muted-foreground">{t.mobile}</figcaption>
            <Preview url={url} position={position} className="aspect-[16/10]" />
          </figure>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-w-56 flex-1 items-center gap-2 text-xs text-muted-foreground">
          <span>{t.top}</span>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={value}
            onChange={(event) => setValue(Number(event.target.value))}
            aria-label={t.slider}
            className="h-11 flex-1 accent-brand"
          />
          <span>{t.bottom}</span>
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => setValue(DEFAULT_FOCUS_Y)}
          disabled={pending || value === DEFAULT_FOCUS_Y}
        >
          {t.center}
        </Button>
        <Button type="button" onClick={save} disabled={pending || value === saved}>
          {t.save}
        </Button>
      </div>
    </section>
  )
}

/** Bilgisayar şeridinin oranı (önizlemeyle aynı): 1440 px ekranda tam genişlik × 28rem ≈ 16:5. */
const DESKTOP_STRIP_RATIO = 16 / 5

/**
 * Bilgisayarda fotoğrafın görünen bandı, fotoğraf yüksekliğinin yüzdesi olarak. Şerit fotoğraftan
 * daha yatıksa yalnız `visible` kadarı görünür; `object-position` kalan payı odak oranında böler.
 */
export function desktopBand(
  width: number,
  height: number,
  focusY: number,
): { top: number; height: number } {
  const visible = Math.min(1, width / height / DESKTOP_STRIP_RATIO)
  return { top: (1 - visible) * focusY, height: visible * 100 }
}

function Preview({
  url,
  position,
  className,
}: {
  url: string
  position: string | undefined
  className: string
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-md border ${className}`}>
      <Image
        src={url}
        alt=""
        fill
        sizes="(min-width: 640px) 50vw, 100vw"
        className="object-cover"
        style={position ? { objectPosition: position } : undefined}
      />
      {/* Açık sitedeki karartmanın aynısı: başlık bu bölgeye biner, tabela orada kalmasın. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background via-background/25 via-35% to-transparent"
      />
    </div>
  )
}
