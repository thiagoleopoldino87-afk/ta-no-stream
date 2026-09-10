import { criarClienteServidor } from '@/lib/supabase/servidor'

export type Usuario = { id: string; email: string }

/**
 * Quem esta logado agora, ou null.
 *
 * Usa getClaims() e NAO getSession(): getSession apenas le o cookie, que
 * qualquer pessoa pode forjar. getClaims valida a assinatura do token contra
 * as chaves publicas do projeto a cada chamada. A propria documentacao do
 * Supabase marca isso como questao de seguranca.
 *
 * Devolve null tambem quando o Supabase esta fora do ar. E proposital: o
 * catalogo nao pode cair porque o banco hibernou.
 */
export async function usuarioAtual(): Promise<Usuario | null> {
  try {
    const supabase = await criarClienteServidor()
    const { data } = await supabase.auth.getClaims()

    const claims = data?.claims
    if (!claims?.sub) return null

    return { id: String(claims.sub), email: String(claims.email ?? '') }
  } catch (erro) {
    // Registrar antes de devolver null: sem isto, um erro real de configuracao
    // ficaria indistinguivel de "Supabase fora do ar" e ninguem descobriria a
    // causa. Devolver null segue certo — o catalogo nao pode cair por causa
    // da sessao. Ver secao 9 da spec.
    console.error('[usuario] Falha ao obter a sessao:', erro)
    return null
  }
}
