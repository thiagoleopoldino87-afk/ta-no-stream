import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Renova o token de autenticacao a cada requisicao e repassa os cookies
 * atualizados tanto para o servidor quanto para o navegador.
 *
 * Existe porque Server Components nao conseguem ESCREVER cookies: alguem
 * precisa renovar a sessao antes da pagina rodar.
 *
 * DIFERENCA PROPOSITAL em relacao ao exemplo oficial do Supabase: la existe um
 * bloco que redireciona quem nao tem conta para /login. Aqui ele NAO existe.
 * O catalogo do ta-no-stream e publico por decisao de produto; redirecionar
 * visitantes anonimos quebraria o app inteiro.
 */
export async function atualizarSessao(request: NextRequest) {
  let respostaSupabase = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          respostaSupabase = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            respostaSupabase.cookies.set(name, value, options),
          )
          // Cabecalhos de cache: impedem que uma CDN guarde a resposta e
          // entregue a sessao de uma pessoa para outra.
          Object.entries(headers).forEach(([chave, valor]) =>
            respostaSupabase.headers.set(chave, valor),
          )
        },
      },
    },
  )

  // Nao inserir codigo entre createServerClient e getClaims(). Um engano aqui
  // causa usuarios sendo deslogados aleatoriamente, e e dificil de diagnosticar.
  try {
    await supabase.auth.getClaims()
  } catch {
    // Isolamento de falhas: se o Supabase estiver fora do ar ou hibernado, a
    // pessoa e tratada como deslogada e o catalogo publico segue funcionando.
    // Sem isto, uma pagina que nem usa banco devolveria 500. Ver secao 9 da spec.
  }

  // Devolver ESTE objeto, sem substitui-lo: ele carrega os cookies renovados.
  return respostaSupabase
}
