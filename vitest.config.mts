import 'dotenv/config'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const alias = {
  '@': path.resolve(import.meta.dirname, 'src'),
  // Next dışında (Vitest) `server-only` paketi hata fırlatır; boş stub ile değiştirilir.
  'server-only': path.resolve(import.meta.dirname, 'tests/stubs/server-only.ts'),
}

export default defineConfig({
  plugins: [react()],
  resolve: { alias },
  test: {
    globals: false,
    coverage: {
      provider: 'v8',
      include: ['src/features/**', 'src/lib/**'],
      exclude: ['**/*.test.*', 'src/lib/supabase/**'],
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'ui',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./vitest.setup.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          environment: 'node',
          include: ['tests/integration/**/*.test.ts'],
          setupFiles: ['./tests/integration/setup.ts'],
          globalSetup: ['./tests/integration/global-setup.ts'],
          fileParallelism: false,
          testTimeout: 20_000,
        },
      },
    ],
  },
})
