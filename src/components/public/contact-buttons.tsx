import { MapPinIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import type { ResolvedContact } from '@/features/shops/contact'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { formatTrPhone, telHref, whatsappHref } from '@/lib/utils/format'

interface ContactProps {
  contact: ResolvedContact
  whatsappMessage?: string
}

/** Ara / WhatsApp / Yol tarifi; eksik bilgide düğme çıkmaz. Çubuk ve şerit aynı listeden kurulur. */
function contactLinks({ contact, whatsappMessage }: ContactProps) {
  return {
    tel: contact.phone ? telHref(contact.phone) : null,
    wa: contact.whatsapp ? whatsappHref(contact.whatsapp, whatsappMessage) : null,
    map: contact.mapUrl,
  }
}

/** Sayfanın alt çubuğu olacak mı: telefonda Ara / WhatsApp / Yol yalnız orada durur. */
export function hasActionBar(contact: ResolvedContact): boolean {
  const { tel, wa, map } = contactLinks({ contact })
  return Boolean(tel || wa || map)
}

/**
 * Pafta bilgi şeridindeki düğmeler. Telefonda Ara / WhatsApp / Yol alt çubukta olduğu için burada
 * yalnız geniş ekranda görünür (aynı düğme ilk ekranda iki kez çıkmaz); Instagram her yerde.
 * Geniş ekranda Ara numarayı yazar.
 */
export function PaftaActions({ contact, whatsappMessage }: ContactProps) {
  const { tel, wa, map } = contactLinks({ contact, whatsappMessage })
  // `!`: .pafta-btn katmansız CSS'te `display: inline-flex` der ve katmanlı `hidden`ı ezer; telefonda
  // aynı düğmeler alt çubukla birlikte iki kez çıkıyordu.
  const desktopOnly = 'max-md:hidden!'
  if (!tel && !wa && !map && !contact.instagramUrl) return null

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2.5 md:flex-nowrap',
        !contact.instagramUrl && 'hidden md:flex',
      )}
    >
      {tel && contact.phone ? (
        <a href={tel} data-track="call" className={cn('pafta-btn pafta-btn-call', desktopOnly)}>
          <PhoneIcon aria-hidden />
          <span className="sr-only">{tr.common.call}: </span>
          <span className="tabular-nums">{formatTrPhone(contact.phone)}</span>
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          data-track="whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          className={cn('pafta-btn pafta-btn-wa', desktopOnly)}
        >
          <MessageCircleIcon aria-hidden /> {tr.common.whatsapp}
        </a>
      ) : null}
      {map ? (
        <a
          href={map}
          data-track="directions"
          target="_blank"
          rel="noopener noreferrer"
          className={cn('pafta-btn pafta-btn-plain', desktopOnly)}
        >
          <MapPinIcon aria-hidden /> {tr.common.directions}
        </a>
      ) : null}
      {contact.instagramUrl ? (
        <a
          href={contact.instagramUrl}
          data-track="instagram"
          target="_blank"
          rel="noopener noreferrer"
          className="pafta-btn pafta-btn-plain max-md:flex-1"
        >
          <InstagramIcon aria-hidden /> {tr.common.instagram}
        </a>
      ) : null}
    </div>
  )
}

/**
 * Telefonda ekranın altına yapışan Ara / WhatsApp / Yol çubuğu: ilk ekranda, başparmağın yetiştiği
 * yerde. Her düğme 48 px; eksik olan çıkar, kalanlar eşit genişler.
 */
export function ContactActionBar({ contact, whatsappMessage }: ContactProps) {
  const { tel, wa, map } = contactLinks({ contact, whatsappMessage })
  if (!tel && !wa && !map) return null

  return (
    // `contact-action-bar`: sayfanın altına çubuk kadar boşluk bırakır (pafta.css).
    <div className="contact-action-bar pafta fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-[var(--pafta-strip-rule)] bg-none! p-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] md:hidden">
      <div className="mx-auto flex max-w-6xl gap-2">
        {tel ? (
          <a href={tel} data-track="call" className="pafta-btn pafta-btn-call flex-1 px-3">
            <PhoneIcon aria-hidden /> {tr.common.call}
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            data-track="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className="pafta-btn pafta-btn-wa flex-1 px-3"
          >
            <MessageCircleIcon aria-hidden /> {tr.common.whatsapp}
          </a>
        ) : null}
        {map ? (
          <a
            href={map}
            data-track="directions"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tr.common.directions}
            className="pafta-btn pafta-btn-plain flex-1 px-3"
          >
            <MapPinIcon aria-hidden /> {tr.common.directionsShort}
          </a>
        ) : null}
      </div>
    </div>
  )
}
