import type { Metadata } from 'next'
import { tr } from '@/lib/i18n/tr'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: tr.admin.login.title,
  robots: { index: false, follow: false },
}

export default async function LoginPage({ searchParams }: PageProps<'/admin/giris'>) {
  const params = await searchParams
  const next =
    typeof params.next === 'string' && params.next.startsWith('/admin') ? params.next : '/admin'
  const reason = typeof params.reason === 'string' ? params.reason : null

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border bg-card p-6 shadow-lg">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 inline-flex size-10 items-center justify-center rounded-lg bg-brand text-lg font-bold text-brand-foreground">
            B
          </span>
          <h1 className="text-xl font-semibold">{tr.admin.login.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{tr.admin.login.subtitle}</p>
        </div>
        <LoginForm next={next} reason={reason} />
      </div>
    </main>
  )
}
