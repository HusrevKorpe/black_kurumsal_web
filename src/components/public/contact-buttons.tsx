import { MapPinIcon, MessageCircleIcon, PhoneIcon } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import type { ResolvedContact } from '@/features/shops/contact'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { telHref, whatsappHref } from '@/lib/utils/format'

interface ContactButtonsProps {
  contact: ResolvedContact
  whatsappMessage?: string
  className?: string
  /**
   * Sayfada `ContactActionBar` da varsa Ara/WhatsApp telefonda yalnızca alt çubukta görünür;
   * aynı iki düğme ilk ekranda iki kez çıkmaz.
   */
  hasActionBar?: boolean
}

const WHATSAPP_CLASS =
  'bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 border-transparent'

/** Ara / WhatsApp / Yol Tarifi / Instagram. Var olan bilgiye göre butonlar çıkar. */
export function ContactButtons({
  contact,
  whatsappMessage,
  className,
  hasActionBar = false,
}: ContactButtonsProps) {
  const tel = contact.phone ? telHref(contact.phone) : null
  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp, whatsappMessage) : null
  const hasSecondary = Boolean(contact.mapUrl || contact.instagramUrl)
  // Telefonda gösterilecek düğme kalmıyorsa kapsayıcının boşluğu da gitsin.
  const wrapperClass = hasActionBar && !hasSecondary ? 'hidden md:flex' : undefined
  const primaryClass = hasActionBar ? 'hidden md:inline-flex' : undefined

  return (
    <div className={cn('flex flex-wrap gap-2', wrapperClass, className)}>
      {tel ? (
        <a
          href={tel}
          data-track="call"
          className={cn(buttonVariants({ size: 'lg' }), primaryClass)}
        >
          <PhoneIcon data-icon="inline-start" /> {tr.common.call}
        </a>
      ) : null}
      {wa ? (
        <a
          href={wa}
          data-track="whatsapp"
          target="_blank"
          rel="noopener noreferrer"
          className={cn(buttonVariants({ size: 'lg' }), WHATSAPP_CLASS, primaryClass)}
        >
          <MessageCircleIcon data-icon="inline-start" /> {tr.common.whatsapp}
        </a>
      ) : null}
      {contact.mapUrl ? (
        <a
          href={contact.mapUrl}
          data-track="directions"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: 'lg', variant: 'outline' })}
        >
          <MapPinIcon data-icon="inline-start" /> {tr.common.directions}
        </a>
      ) : null}
      {contact.instagramUrl ? (
        <a
          href={contact.instagramUrl}
          data-track="instagram"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size: 'lg', variant: 'outline' })}
        >
          <InstagramIcon data-icon="inline-start" /> {tr.common.instagram}
        </a>
      ) : null}
    </div>
  )
}

/** Başparmakla ana eylem: mobil hedef boyutu en az 44 px, burada 48 px. */
const BAR_BUTTON_CLASS = 'h-12 flex-1 text-base'

/** Mobilde ekranın altına yapışan Ara / WhatsApp çubuğu. */
export function ContactActionBar({
  contact,
  whatsappMessage,
}: Pick<ContactButtonsProps, 'contact' | 'whatsappMessage'>) {
  const tel = contact.phone ? telHref(contact.phone) : null
  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp, whatsappMessage) : null
  if (!tel && !wa) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-6xl gap-2">
        {tel ? (
          <a
            href={tel}
            data-track="call"
            className={cn(buttonVariants({ size: 'lg' }), BAR_BUTTON_CLASS)}
          >
            <PhoneIcon data-icon="inline-start" /> {tr.common.call}
          </a>
        ) : null}
        {wa ? (
          <a
            href={wa}
            data-track="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ size: 'lg' }), WHATSAPP_CLASS, BAR_BUTTON_CLASS)}
          >
            <MessageCircleIcon data-icon="inline-start" /> {tr.common.whatsapp}
          </a>
        ) : null}
      </div>
    </div>
  )
}
