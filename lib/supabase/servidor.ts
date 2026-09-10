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
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
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
            // Server Components nao podem escrever cookies. Ignorar aqui e
            // correto: quem grava de verdade e o proxy.ts, a cada requisicao.
          }
        },
      },
    },
  )
}
