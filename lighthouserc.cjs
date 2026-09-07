/**
 * Lighthouse CI: üretim derlemesine karşı mobil denetim (Lighthouse varsayılanı mobil emülasyon).
 * Önce `pnpm build`; sonra `pnpm lighthouse` sunucuyu kendisi açıp kapatır.
 * Sunucu `scripts/lighthouse-server.sh` ile açılır ve ölçüm başlamadan her URL bir kez ısıtılır
 * (soğuk ilk istek CI'da ilk koşuya TBT olarak yansıyordu). Yerelde 3000 doluysa: `PORT=3100 pnpm lighthouse`.
 */
const PORT = process.env.PORT ?? '3000'
const BASE = `http://localhost:${PORT}`
const URLS = [
  `${BASE}/`,
  `${BASE}/black-playstation-carsi`,
  `${BASE}/mekan/black-garden`,
  `${BASE}/kampanyalar`,
]

module.exports = {
  ci: {
    collect: {
      startServerCommand: `sh scripts/lighthouse-server.sh ${URLS.join(' ')}`,
      startServerReadyPattern: 'LIGHTHOUSE_READY',
      startServerReadyTimeout: 90_000,
      url: URLS,
      numberOfRuns: 3,
      settings: { chromeFlags: '--no-sandbox --headless=new' },
    },
    assert: {
      aggregationMethod: 'median',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
}
