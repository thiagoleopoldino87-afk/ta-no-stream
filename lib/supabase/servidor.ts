import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente para Server Components, Server Actions e Route Handlers.
 *
 * Precisa ser criado a CADA requisicao: ele carrega os cookies daquela
 * requisicao especifica. Reaproveitar um cliente entre requisicoes misturaria
 * a sessao de uma pessoa com a de outra.
 */
export async function criarClienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // Falhar aqui com mensagem clara, em vez de passar undefined! ao SDK: quem
  // ler o log sabe na hora qual variavel falta, em vez de vasculhar uma pilha
  // de erro vinda de dentro do @supabase/ssr. Mesmo padrao de sessao.ts.
  if (!url || !chave) {
    throw new Error(
      '[servidor] Variaveis do Supabase ausentes. Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    )
  }

  const cookieStore = await cookies()

  return createServerClient(url, chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          )
        } catch {
          // So falha em Server Components, que nao podem escrever cookies —
          // la, quem renova de verdade e o proxy.ts, a cada requisicao. Em
          // Server Actions e Route Handlers (onde entrar, sair e redefinir a
          // senha realmente rodam) a escrita acima funciona e e essencial:
          // e ela que grava a sessao.
        }
      },
    },
  })
}
