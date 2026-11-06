import { MapPinIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import type { ResolvedContact } from '@/features/shops/contact'
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref, whatsappHref } from '@/lib/utils/format'

interface ShopContactCardProps {
  contact: ResolvedContact
}

export function ShopContactCard({ contact }: ShopContactCardProps) {
  const tel = contact.phone ? telHref(contact.phone) : null
  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp) : null
  const hasAny = tel || wa || contact.address || contact.instagramUrl
  if (!hasAny) return null

  return (
    <section aria-labelledby="iletisim">
      <h2 id="iletisim" className="pafta-heading mb-4">
        {tr.shop.contact}
      </h2>
      <ul className="pafta-box px-4 py-2 text-[15px]">
        {contact.address ? (
          <li className="flex items-start gap-3 py-2">
            <MapPinIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
            <div>
              <p>{contact.address}</p>
              {contact.mapUrl ? (
                <a
                  href={contact.mapUrl}
                  data-track="directions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center font-medium text-brand hover:underline"
                >
                  {tr.common.directions}
                </a>
              ) : null}
            </div>
          </li>
        ) : null}
        {tel && contact.phone ? (
          <li className="flex items-center gap-3">
            <PhoneIcon className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={tel}
              data-track="call"
              className="inline-flex min-h-12 items-center hover:underline"
            >
              {formatTrPhone(contact.phone)}
            </a>
          </li>
        ) : null}
        {wa && contact.whatsapp ? (
          <li className="flex items-center gap-3">
            <MessageCircleIcon className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={wa}
              data-track="whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center hover:underline"
            >
              {tr.common.whatsapp} · {formatTrPhone(contact.whatsapp)}
            </a>
          </li>
        ) : null}
        {contact.instagramUrl ? (
          <li className="flex items-center gap-3">
            <InstagramIcon className="size-4 shrink-0 text-muted-foreground" />
            <a
              href={contact.instagramUrl}
              data-track="instagram"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center hover:underline"
            >
              {tr.common.instagram}
            </a>
          </li>
        ) : null}
      </ul>
    </section>
  )
}
