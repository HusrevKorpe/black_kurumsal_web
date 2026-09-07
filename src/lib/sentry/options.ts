export interface SentryEnvInput {
  /** Boşsa SDK kapalı kalır (yerel geliştirme, test). */
  dsn: string | undefined
  /** Vercel'de VERCEL_ENV (production | preview | development), yoksa NODE_ENV. */
  environment: string | undefined
  /** Vercel commit SHA'sı; yoksa build eklentisinin enjekte ettiği sürüm kullanılır. */
  release: string | undefined
}

export interface SentryBaseOptions {
  dsn: string | undefined
  enabled: boolean
  environment: string
  release: string | undefined
  sendDefaultPii: false
}

/**
 * Tarayıcı, Node ve Edge için ortak Sentry ayarları. Tek yerden üretilir ki üç ortam
 * birbirinden farklı davranmasın. DSN yoksa SDK tamamen kapalıdır: hiçbir şey gönderilmez.
 * Yalnızca hata izleme yapılır; performans izleme (tracing) build'de paketten çıkarılır
 * (next.config.ts → bundleSizeOptimizations), bu yüzden burada örnekleme oranı yoktur.
 */
export function buildSentryOptions(input: SentryEnvInput): SentryBaseOptions {
  const dsn = input.dsn?.trim() || undefined
  const environment = input.environment?.trim() || 'development'
  return {
    dsn,
    enabled: Boolean(dsn),
    environment,
    release: input.release?.trim() || undefined,
    // KVKK: IP adresi, çerez gibi kişisel veriler olaylara eklenmez.
    sendDefaultPii: false,
  }
}
