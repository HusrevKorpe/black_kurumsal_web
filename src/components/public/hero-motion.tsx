'use client'

import { PauseIcon, PlayIcon } from 'lucide-react'
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { tr } from '@/lib/i18n/tr'

const VIDEO_WIDE = '/media/hero-genis.mp4'
const VIDEO_PHONE = '/media/hero-telefon.mp4'
const WIDE_MEDIA_QUERY = '(min-width: 1024px)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

function connectionSavesData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection
  return connection?.saveData === true
}

function subscribeReducedMotion(onChange: () => void): () => void {
  const query = matchMedia(REDUCED_MOTION_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Açılışın arka planı: sessiz, döngülü video, altında aynı karenin afişi (LCP). Video sayfa yüklendikten
 * sonra iner. Veri tasarrufunda, azaltılmış harekette ya da tarayıcı oynatmayı reddederse (iOS Düşük Güç
 * Modu) afiş kalır. Ekran dışında, sekme gizliyken ve kullanıcı durdurunca durur (WCAG 2.2.2).
 */
export function HeroMotion({ poster }: { poster: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [userPaused, setUserPaused] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [pageVisible, setPageVisible] = useState(true)
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )

  const paused = userPaused || !onScreen || !pageVisible || reducedMotion

  useEffect(() => {
    // Hidrasyonun ilk geçişinde `reducedMotion` henüz sunucu değeridir (false); tercih doğrudan okunur.
    if (matchMedia(REDUCED_MOTION_QUERY).matches) return
    const start = () => {
      if (connectionSavesData()) setUnavailable(true)
      else setSrc(matchMedia(WIDE_MEDIA_QUERY).matches ? VIDEO_WIDE : VIDEO_PHONE)
    }
    // Boşta beklenmez: Safari'de requestIdleCallback yok, video gereksiz yere 1 sn gecikirdi.
    if (document.readyState === 'complete') {
      start()
      return
    }
    window.addEventListener('load', start, { once: true })
    return () => window.removeEventListener('load', start)
  }, [reducedMotion])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (paused) {
      video.pause()
      return
    }
    // Durdurmanın kestiği play() AbortError verir; gerçek ret ise afişte kalmak demektir.
    video.play().catch((error: unknown) => {
      if (!(error instanceof DOMException) || error.name !== 'AbortError') setUnavailable(true)
    })
  }, [paused, src])

  // Harf maskesi hero'nun metin katmanlarında; video gerçekten oynamadan açılmaz, yazı dolu kalır.
  const videoShown = playing && !unavailable
  useEffect(() => {
    const hero = stageRef.current?.closest<HTMLElement>('.hero')
    if (!hero) return
    if (videoShown) hero.dataset.video = 'playing'
    else delete hero.dataset.video
  }, [videoShown])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const observer = new IntersectionObserver(([entry]) =>
      setOnScreen(entry?.isIntersecting ?? true),
    )
    observer.observe(stage)
    const onVisibility = () => setPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      observer.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div ref={stageRef} className="hero-stage" data-paused={paused}>
      {poster}
      {src && !unavailable ? (
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden
          tabIndex={-1}
          disablePictureInPicture
          className="hero-video"
          data-playing={playing}
          onPlaying={() => setPlaying(true)}
          onError={() => setUnavailable(true)}
        />
      ) : null}
      <div className="hero-scrim" aria-hidden />
      {unavailable ? null : (
        <button
          type="button"
          onClick={() => setUserPaused((current) => !current)}
          aria-pressed={userPaused}
          aria-label={userPaused ? tr.home.motionPlay : tr.home.motionPause}
          className="absolute right-1 bottom-1 z-20 inline-flex size-12 items-center justify-center text-foreground/80 hover:text-foreground focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring motion-reduce:hidden sm:right-3 sm:bottom-3"
        >
          {userPaused ? <PlayIcon className="size-4" /> : <PauseIcon className="size-4" />}
        </button>
      )}
    </div>
  )
}
