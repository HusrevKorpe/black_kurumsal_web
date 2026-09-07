'use client'

import { useSyncExternalStore } from 'react'

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, 60_000)
  return () => window.clearInterval(id)
}

function getSnapshot() {
  return Math.floor(Date.now() / 60_000)
}

function getServerSnapshot(): number | null {
  return null
}

/**
 * Dakika bazlı tik. Sunucuda null (statik sayfa "şu an"ı bilemez), tarayıcıda dakika sayısı.
 * setState-in-effect yerine useSyncExternalStore: hidrasyon uyumsuzluğu ve ardışık render yok.
 */
export function useMinuteTick(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
