import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente para codigo que roda no navegador.
 *
 * Nenhum arquivo importa esta funcao ainda. Isso e proposital, nao sobra
 * esquecida: ela existe para o Plano 3 (paginas que precisam falar com o
 * Supabase direto do cliente) e para login com Google (o redirecionamento de
 * OAuth acontece no navegador, nao no servidor).
 *
 * createBrowserClient ja usa padrao singleton internamente: chamar esta funcao
 * varias vezes nao cria varias conexoes.
 */
export function criarClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // Mesmo padrao de servidor.ts e sessao.ts: falhar com mensagem clara em vez
  // de passar undefined! ao SDK.
  if (!url || !chave) {
    throw new Error(
      '[navegador] Variaveis do Supabase ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  return createBrowserClient(url, chave)
}
