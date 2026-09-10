import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente para codigo que roda no navegador.
 * createBrowserClient ja usa padrao singleton internamente: chamar esta funcao
 * varias vezes nao cria varias conexoes.
 */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
