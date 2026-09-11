// defineConfig vem de 'vitest/config': o do 'vite' nao conhece a secao "test"
// e o TypeScript recusaria o arquivo. loadEnv so existe no 'vite'.
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // Os testes de RLS falam com um Supabase real, pela internet.
    testTimeout: 30000,
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
