/** Alt satırdaki sözler; değiştirmek için yalnız burayı düzenle. */
const TAGLINE = ['Kalite', 'Güven', 'Eğlence']

/**
 * Üst satırdaki marka kilidi: mor taç, gümüş marka adı, altında mor kavis ve küçük sözler. Taç ve
 * kavis süs (aria-hidden); bağlantının adı marka adıdır.
 */
export function BrandLockup({ name }: { name: string }) {
  return (
    <span className="flex flex-col items-center leading-none">
      <svg
        viewBox="0 0 24 14"
        aria-hidden="true"
        focusable="false"
        className="h-2.5 w-auto text-(--brand-display)"
      >
        <path
          d="M2 3.5 7 8l5-7 5 7 5-4.5L20 13H4Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="2" cy="3" r="1.6" fill="currentColor" />
        <circle cx="12" cy="1.2" r="1.6" fill="currentColor" />
        <circle cx="22" cy="3" r="1.6" fill="currentColor" />
      </svg>
      <span className="brand-lockup-name mt-0.5 font-display text-[1.7rem] font-bold tracking-wide uppercase">
        {name}
      </span>
      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
        className="-mt-px h-1.5 w-[112%] text-(--brand-display)"
      >
        <path d="M0 6Q50 -2 100 6Q50 2.5 0 6Z" fill="currentColor" />
      </svg>
      <span className="mt-1 font-sans text-[0.5rem] font-semibold tracking-[0.2em] whitespace-nowrap text-foreground/85 uppercase">
        {TAGLINE.join(' • ')}
      </span>
    </span>
  )
}
