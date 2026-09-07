import { Geist_Mono } from 'next/font/google'
import { AdminShell } from '@/components/admin/admin-shell'
import { requireStaff } from '@/lib/auth/session'

/** Slug, e-posta ve şifre alanları eş genişlikli yazı tipi ister; yalnızca panel sayfalarında yüklenir. */
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin', 'latin-ext'] })

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const staff = await requireStaff()
  return (
    // display: contents — yerleşimi bozmadan yalnızca CSS değişkenini alt ağaca tanımlar.
    <div className={`${geistMono.variable} contents`}>
      <AdminShell staff={{ fullName: staff.fullName, role: staff.role }}>{children}</AdminShell>
    </div>
  )
}
