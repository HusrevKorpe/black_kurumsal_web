import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { getSiteSettings } from '@/features/settings/queries'
import { RETENTION_DAYS } from '@/features/analytics/prune'
import { DATA_CONTROLLER, PRIVACY_UPDATED_AT } from '@/lib/constants/legal'
import { SITE_CITY } from '@/lib/constants/site'
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref } from '@/lib/utils/format'

export const revalidate = 3600

export const metadata: Metadata = {
  title: tr.footer.privacy,
  description:
    'Black dükkanları sitesinin KVKK aydınlatma metni: hangi verinin neden işlendiği, çerezler ve başvuru yolu.',
  alternates: { canonical: '/kvkk' },
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-2xl font-bold uppercase lg:text-3xl">{title}</h2>
      {children}
    </section>
  )
}

const LIST = 'list-disc space-y-2 pl-5 marker:text-muted-foreground'

/**
 * 6698 sayılı KVKK md. 10 aydınlatma metni + çerez açıklaması. Metin sitenin bugün gerçekten
 * yaptığını anlatır (src/features/analytics, src/lib/sentry, src/lib/browser/theme.ts): bu
 * davranışlardan biri değişirse burası da güncellenmeli.
 */
export default async function PrivacyPage() {
  const settings = await getSiteSettings()
  const phone = settings.contactPhone
  const phoneHref = phone ? telHref(phone) : null
  const email = settings.contactEmail
  const controller = DATA_CONTROLLER.legalName ?? `${settings.brandName} dükkanlarının işletmecisi`

  return (
    <article className="mx-auto w-full max-w-3xl space-y-10 px-4 py-12 leading-relaxed sm:px-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl leading-tight font-bold uppercase lg:text-5xl">
          KVKK Aydınlatma Metni
        </h1>
        <p className="text-muted-foreground">
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu&apos;nun (KVKK) 10. maddesi
          gereği, bu internet sitesini kullanırken hangi verilerinizin, neden ve nasıl işlendiğini
          anlatır. Son güncelleme: {PRIVACY_UPDATED_AT}.
        </p>
      </header>

      <Section title="Veri sorumlusu">
        <p>
          Veri sorumlusu: <strong>{controller}</strong> ({SITE_CITY}).
        </p>
        {DATA_CONTROLLER.address || DATA_CONTROLLER.kep ? (
          <ul className={LIST}>
            {DATA_CONTROLLER.address ? <li>Adres: {DATA_CONTROLLER.address}</li> : null}
            {DATA_CONTROLLER.kep ? <li>KEP: {DATA_CONTROLLER.kep}</li> : null}
          </ul>
        ) : null}
      </Section>

      <Section title="Kısaca">
        <p>
          Bu site üyelik, form ya da sipariş almaz; adınızı, telefonunuzu veya e-postanızı istemez.
          Reklam ya da takip çerezi kullanılmaz. Yalnızca sitenin çalışması ve hangi sayfaların ilgi
          gördüğünü anlamak için, sizi tanımlamaya yetmeyen sınırlı teknik bilgi işlenir.
        </p>
      </Section>

      <Section title="Hangi veriler işlenir?">
        <ul className={LIST}>
          <li>
            <strong>Ziyaret istatistiği:</strong> açılan sayfa, basılan düğme (ara, WhatsApp, yol
            tarifi, Instagram gibi), siteye hangi siteden gelindiği (ör. Google, Instagram) ve
            cihazın telefon mu bilgisayar mı olduğu. Aynı gün içinde aynı ziyaretçiyi iki kez
            saymamak için IP adresiniz ve tarayıcı bilginiz, her gün değişen gizli bir anahtarla
            geri döndürülemez bir özete çevrilir. <strong>Ham IP adresi kaydedilmez</strong>; ertesi
            gün aynı kişi farklı bir özet alır, yani kişi günler boyunca izlenemez. Bu kayıtlar{' '}
            {RETENTION_DAYS} gün sonra kendiliğinden silinir.
          </li>
          <li>
            <strong>Hata kayıtları:</strong> bir sayfa hata verirse, hatayı düzeltebilmek için
            teknik hata bilgisi (hata mesajı, sayfa adresi, tarayıcı ve işletim sistemi türü)
            kaydedilir. Bu kayda IP adresi ve çerez eklenmez.
          </li>
          <li>
            <strong>Sunucu erişim kayıtları:</strong> siteyi barındıran altyapı, her internet
            sitesinde olduğu gibi güvenlik ve arıza takibi için isteğin IP adresini ve zamanını kısa
            bir süre teknik günlükte tutar.
          </li>
          <li>
            <strong>Telefon, WhatsApp, Instagram ve harita bağlantıları:</strong> bu düğmelere
            basınca telefonunuzun ilgili uygulaması açılır. Bu site görüşme ya da mesaj içeriğini
            görmez; o andan sonra ilgili hizmetin (WhatsApp, Instagram, Google Haritalar) kendi
            gizlilik koşulları geçerlidir.
          </li>
          <li>
            <strong>Yönetim paneli:</strong> yalnızca işletme çalışanlarını ilgilendirir. Panele
            giriş yapan çalışanın adı soyadı, e-posta adresi, yetkisi ve panelde yaptığı
            değişikliklerin kaydı tutulur.
          </li>
        </ul>
      </Section>

      <Section title="Neden ve hangi hukuki sebeple?">
        <p>
          Ziyaret istatistiği, hata ve erişim kayıtları; sitenin güvenli ve kesintisiz çalışması,
          hataların giderilmesi ve hangi dükkan ile hizmetin ilgi gördüğünün ölçülmesi amacıyla,
          KVKK md. 5/2-f uyarınca{' '}
          <em>
            temel hak ve özgürlüklerinize zarar vermemek kaydıyla veri sorumlusunun meşru menfaati
          </em>{' '}
          hukuki sebebine dayanılarak işlenir. Panel kullanıcılarının verileri, iş ilişkisinin
          yürütülmesi için KVKK md. 5/2-c (sözleşmenin ifası) ve 5/2-f kapsamında işlenir. Veriler,
          internet sitesi üzerinden otomatik yollarla toplanır.
        </p>
      </Section>

      <Section title="Kimlere aktarılır?">
        <p>
          Veriler satılmaz, reklam amacıyla kimseyle paylaşılmaz. Site, aşağıdaki hizmet
          sağlayıcıların altyapısında çalışır; veriler yalnızca bu hizmetin sunulması için ve
          onların sunucularında işlenir:
        </p>
        <ul className={LIST}>
          <li>Vercel Inc.: sitenin barındırılması ve sunulması.</li>
          <li>Supabase Inc.: veritabanı, görsellerin saklanması ve panel girişi.</li>
          <li>Functional Software Inc. (Sentry): hata kayıtları.</li>
        </ul>
        <p>
          Bu sağlayıcıların sunucuları yurt dışında bulunabilir. Yurt dışına aktarım, KVKK&apos;nın
          9. maddesinde öngörülen usullere uygun olarak yapılır. Kanunen yetkili kamu kurum ve
          kuruluşlarının talebi hâlinde, ilgili mevzuat çerçevesinde bu kurumlarla paylaşılabilir.
        </p>
      </Section>

      <Section title="Çerezler ve tarayıcı hafızası">
        <ul className={LIST}>
          <li>
            Herkese açık sayfalarda{' '}
            <strong>reklam, pazarlama ya da takip çerezi kullanılmaz</strong>; üçüncü taraf analiz
            aracı (Google Analytics, Meta Pixel vb.) yoktur.
          </li>
          <li>
            Açık/koyu tema seçiminiz yalnızca kendi tarayıcınızın hafızasında (localStorage)
            saklanır ve sunucuya gönderilmez. Tarayıcı ayarlarından silebilirsiniz.
          </li>
          <li>
            Yönetim paneline giriş yapan çalışanlar için oturumu açık tutan zorunlu bir çerez
            kullanılır. Bu çerez olmadan panele giriş yapılamaz.
          </li>
        </ul>
      </Section>

      <Section title="Haklarınız">
        <p>
          KVKK&apos;nın 11. maddesi uyarınca veri sorumlusuna başvurarak şunları isteyebilirsiniz:
        </p>
        <ul className={LIST}>
          <li>Kişisel verinizin işlenip işlenmediğini öğrenmek, işlenmişse bilgi istemek,</li>
          <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenmek,</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilmek,</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini istemek,</li>
          <li>KVKK md. 7 şartları çerçevesinde silinmesini veya yok edilmesini istemek,</li>
          <li>
            Düzeltme ve silme işlemlerinin, verinin aktarıldığı üçüncü kişilere bildirilmesini
            istemek,
          </li>
          <li>
            Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç çıkmasına
            itiraz etmek,
          </li>
          <li>
            Kanuna aykırı işlenme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep
            etmek.
          </li>
        </ul>
      </Section>

      <Section title="Nasıl başvurulur?">
        <p>
          Başvurunuzu, kimliğinizi ve talebinizi açıkça belirterek
          {email || phone ? ' aşağıdaki iletişim kanallarından ' : ' '}
          veri sorumlusuna yazılı olarak iletebilirsiniz. Başvurular en geç 30 gün içinde ücretsiz
          olarak yanıtlanır (KVKK md. 13).
        </p>
        {email || phone ? (
          <ul className={LIST}>
            {email ? (
              <li>
                E-posta:{' '}
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>
              </li>
            ) : null}
            {phone && phoneHref ? (
              <li>
                Telefon:{' '}
                <a href={phoneHref} data-track="call" className="underline underline-offset-4">
                  {formatTrPhone(phone)}
                </a>
              </li>
            ) : null}
          </ul>
        ) : null}
        <p>
          Başvurunuz reddedilir, yanıtı yetersiz bulursanız ya da süresinde yanıt verilmezse,
          Kişisel Verileri Koruma Kurulu&apos;na şikâyette bulunabilirsiniz.
        </p>
      </Section>
    </article>
  )
}
