// Paylaşım yedek görselini (public/og.png) üretir: node scripts/og-image.mjs public/og.png
// Fotoğrafı olmayan sayfa WhatsApp/Instagram'da paylaşılınca bu görsel çıkar.
import { createRequire } from 'node:module'
const sharp = createRequire(process.cwd() + '/package.json')('sharp')
const W = 1200,
  H = 630,
  gold = '#f2b544'
const grid = Array.from(
  { length: 30 },
  (_, i) =>
    `<path d="M${i * 48} 0V${H}" stroke="#ffffff" stroke-opacity="0.04"/><path d="M0 ${i * 48}H${W}" stroke="#ffffff" stroke-opacity="0.04"/>`,
).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
 <radialGradient id="glow" cx="50%" cy="42%" r="55%"><stop offset="0" stop-color="${gold}" stop-opacity="0.16"/><stop offset="1" stop-color="${gold}" stop-opacity="0"/></radialGradient>
 <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#b9bcc2"/></linearGradient>
</defs>
<rect width="100%" height="100%" fill="#0a0a0a"/>${grid}
<rect width="100%" height="100%" fill="url(#glow)"/>
<g transform="translate(${W / 2 - 84} 92) scale(7)">
 <path d="M2 3.5 7 8l5-7 5 7 5-4.5L20 13H4Z" fill="${gold}" stroke="${gold}" stroke-width="1.2" stroke-linejoin="round"/>
 <circle cx="2" cy="3" r="1.6" fill="${gold}"/><circle cx="12" cy="1.2" r="1.6" fill="${gold}"/><circle cx="22" cy="3" r="1.6" fill="${gold}"/>
</g>
<text x="50%" y="368" text-anchor="middle" font-family="Helvetica Neue" font-stretch="condensed" font-weight="bold" font-size="200" letter-spacing="10" fill="url(#silver)">BLACK</text>
<path d="M330 400Q600 352 870 400Q600 384 330 400Z" fill="${gold}"/>
<text x="50%" y="458" text-anchor="middle" font-family="Helvetica Neue" font-weight="bold" font-size="26" letter-spacing="9" fill="#e8e8e8">KALİTE • GÜVEN • EĞLENCE</text>
<text x="50%" y="560" text-anchor="middle" font-family="Helvetica Neue" font-size="28" letter-spacing="4" fill="${gold}">ISPARTA · PLAYSTATION · ESPOR · TOST · APART</text>
</svg>`
await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9, palette: true, quality: 90 })
  .toFile(process.argv[2])
