import { clsx } from 'clsx'

/** Şeritteki sayı kutusu: üstte dükkan renginde kalın çizgi, büyük sayı, küçük açıklama. */
export function PaftaTile({
  value,
  label,
  placeholder = false,
}: {
  value: string
  label: string
  placeholder?: boolean
}) {
  return (
    <div className={clsx('pafta-tile', placeholder && 'opacity-60')} aria-hidden={placeholder}>
      <b className="pafta-tile-num">{value}</b>
      <span className="pafta-tile-label">{label}</span>
    </div>
  )
}
