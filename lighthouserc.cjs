/**
 * Lighthouse CI: üretim derlemesine karşı mobil denetim (Lighthouse varsayılanı mobil emülasyon).
 * Önce `pnpm build`; sonra `pnpm lighthouse` sunucuyu kendisi açıp kapatır.
 */
const BASE = 'http://localhost:3000'

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready',
      startServerReadyTimeout: 60_000,
      url: [
        `${BASE}/`,
        `${BASE}/black-playstation-carsi`,
        `${BASE}/mekan/black-garden`,
        `${BASE}/kampanyalar`,
      ],
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
