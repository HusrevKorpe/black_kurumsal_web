import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Proje kuralı: hiçbir kod dosyası 500 satırı geçmez (boş satır ve yorum dahil).
      'max-lines': ['error', { max: 500, skipBlankLines: false, skipComments: false }],
      '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'src/generated/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    '.lighthouseci/**',
    'supabase/**',
  ]),
])

export default eslintConfig
