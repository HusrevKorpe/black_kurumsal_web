import Image from 'next/image'
import type { Media } from '@/generated/prisma/client'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'

type CoverMedia = Pick<Media, 'bucket' | 'path' | 'alt' | 'width' | 'height'>

interface CoverBannerProps {
  media: CoverMedia | null
  alt: string
}

/** Şeridin masaüstündeki yüksekliği genişliğinin bu kadarı: aşağıdaki `sm:aspect-[21/9]` ile aynı oran. */
const DESKTOP_HEIGHT_RATIO = 9 / 21

/**
 * Dükkan ve mekan sayfasının üstündeki kapak şeridi.
 *
 * Telefonda fotoğraf şeridi kırpılarak tümüyle doldurur: ekran dar, elimizdeki kapaklar zaten o
 * çözünürlükte, birebir oturuyor.
 *
 * Bilgisayarda aynısı fotoğrafı gerdiriyordu. Şerit 1500 px'in üstünde, 2x ekranda ~3000 px'lik
 * görsel ister; kapaklarımız 1080–2048 px geniş. Next görseli büyütmez, tarayıcı gerer, sonuç
 * piksellenme — üstüne 21/9 kırpma kare ve dikey fotoğraftan ince bir bant bırakıyordu. Bu yüzden
 * masaüstünde iki katman var: arkada aynı fotoğrafın 256 px'lik bulanık kopyası şeridi doldurur
 * (bulanıklık büyütmeyi görünmez kılar), önde fotoğrafın kendisi kırpılmadan, kendi oranında durur.
 * Kare, dikey, yatay — patron ne gönderirse göndersin net görünür.
 */
export function CoverBanner({ media, alt }: CoverBannerProps) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted sm:aspect-[21/9]">
      {media ? <CoverLayers media={media} alt={alt} /> : <EmptyCover />}
    </div>
  )
}

function CoverLayers({ media, alt }: { media: CoverMedia; alt: string }) {
  const src = mediaPublicUrl(media)
  return (
    <>
      <Image
        src={src}
        alt=""
        aria-hidden
        fill
        // Bulanıklaşacağı için küçük boy yetiyor; şerit dolsun diye büyütülüp kenarları taşırılır.
        sizes="256px"
        className="hidden scale-125 object-cover opacity-60 blur-2xl sm:block"
      />
      {/* Masaüstünde perde net fotoğrafın altında kalır: yalnızca bulanık zemini karartır. */}
      <Scrim className="hidden sm:block" />
      {/* Başlık şeridin üstüne biniyor (`sm:-mt-24`); net fotoğrafın alt ucu o payın üstünde kalır. */}
      <div className="absolute inset-0 sm:bottom-24">
        <Image
          src={src}
          alt={media.alt ?? alt}
          fill
          sizes={coverSizes(media)}
          priority
          // priority yalnızca preload ekler; LCP görselinin ağ kuyruğunda öne geçmesi için gerekir.
          fetchPriority="high"
          className="object-cover sm:object-contain"
        />
      </div>
      {/* Telefonda başlık fotoğrafın üstüne biniyor; perde orada fotoğrafın üstünde olmalı. */}
      <Scrim className="sm:hidden" />
    </>
  )
}

function EmptyCover() {
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-brand/30 via-transparent to-background"
      />
      <Scrim />
    </>
  )
}

/** Şeridin altını sayfaya bağlayan ve üstüne binen başlığı okunur kılan perde. */
function Scrim({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent',
        className,
      )}
    />
  )
}

/**
 * Tarayıcıya görselin kaç piksel yer kaplayacağını söyler; eksik söylenirse bulanık iner, fazla
 * söylenirse boşuna büyük. Masaüstünde `object-contain` olduğundan genişlik = şerit yüksekliği ×
 * fotoğrafın en/boy oranı. Başlığın bindiği pay hesaba katılmaz: fazla tahmin zararsız yönde.
 * Ölçü bilinmiyorsa güvenli üst sınır olan tam genişlik verilir.
 */
function coverSizes(media: CoverMedia): string {
  if (!media.width || !media.height) return '100vw'
  const ratio = media.width / media.height
  const desktopVw = Math.min(100, Math.ceil(DESKTOP_HEIGHT_RATIO * ratio * 100))
  return `(min-width: 640px) ${desktopVw}vw, 100vw`
}
