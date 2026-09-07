// Tembel yükleyicinin (client.ts) `import()` ettiği köprü. `import('@sentry/nextjs')` bütün ad
// alanını (replay, feedback, tracing…) chunk'a alır ve tree-shaking'i bozar (~164 KB gz);
// yalnızca kullanılan iki fonksiyon yeniden dışa aktarılınca chunk küçük kalır.
export { captureException, init } from '@sentry/nextjs'
