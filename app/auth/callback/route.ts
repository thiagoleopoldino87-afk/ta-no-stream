import { NextResponse, type NextRequest } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/servidor'

const DESTINO_PADRAO = '/auth/redefinir'

/**
 * Troca o "code" que chega por e-mail (recuperacao de senha, e no futuro
 * outros fluxos que usem link por e-mail) por uma sessao de verdade.
 *
 * O cliente de servidor usa o fluxo PKCE: o link do e-mail aponta para ca com
 * ?code=xxx, e so exchangeCodeForSession grava os cookies de sessao que uma
 * Server Action como redefinirSenha precisa para funcionar. Sem esta troca,
 * updateUser roda sem sessao e o Supabase devolve "Auth session missing!",
 * que a tela traduzia (errado) como "link expirado".
 */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const destino = destinoSeguro(request.nextUrl.searchParams.get('destino'))

  // O endereco final vem SEMPRE de configuracao, nunca de request.url, origin
  // ou headers(): usar qualquer um destes reabriria o mesmo password reset
  // poisoning ja corrigido em pedirRecuperacao — quem faz a requisicao
  // controla esses valores, nao o servidor.
  const site = process.env.SITE_URL
  if (!site) {
    console.error('[callback] SITE_URL ausente. Nao e possivel redirecionar com seguranca.')
    return new NextResponse('Configuracao do servidor ausente.', { status: 500 })
  }

  if (!code) {
    return NextResponse.redirect(`${site}/entrar/recuperar?erro=link-invalido`)
  }

  let falhouTroca: boolean
  try {
    const supabase = await criarClienteServidor()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    falhouTroca = Boolean(error)
  } catch (erro) {
    console.error('[callback] Falha ao trocar o codigo por uma sessao:', erro)
    falhouTroca = true
  }

  if (falhouTroca) {
    return NextResponse.redirect(`${site}/entrar/recuperar?erro=link-invalido`)
  }

  return NextResponse.redirect(`${site}${destino}`)
}

/**
 * So aceita um caminho relativo comecando com uma unica barra. Impede que um
 * "destino" fora do nosso controle vire redirecionamento para outro site
 * (open redirect) — mesma familia de cuidado do password reset poisoning.
 */
function destinoSeguro(valor: string | null): string {
  if (!valor) return DESTINO_PADRAO
  if (!valor.startsWith('/') || valor.startsWith('//')) return DESTINO_PADRAO
  return valor
}
