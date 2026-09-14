'use server'

import { validarEmail } from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { EstadoRecuperacao } from '@/lib/auth/tipos'

export async function pedirRecuperacao(
  _anterior: EstadoRecuperacao,
  dados: FormData,
): Promise<EstadoRecuperacao> {
  const email = String(dados.get('email') ?? '').trim()

  const erro = validarEmail(email)
  if (erro) return { erro }

  // O endereco vem de configuracao, NUNCA do cabecalho da requisicao. Quem faz
  // a requisicao controla o cabecalho Origin e conseguiria fazer o link do
  // e-mail apontar para outro site — a vitima receberia um e-mail legitimo e
  // digitaria a senha nova na tela do atacante (password reset poisoning).
  const site = process.env.SITE_URL
  if (!site) {
    console.error('[recuperacao] SITE_URL ausente. Nao e possivel montar o link.')
    return { erro: 'Não foi possível enviar o link agora. Tente mais tarde.' }
  }

  // O link do e-mail aponta para /auth/callback, que troca o "code" do
  // Supabase por uma sessao de verdade antes de mandar a pessoa para
  // /auth/redefinir. Sem essa troca, updateUser roda sem sessao.
  const destino = encodeURIComponent('/auth/redefinir')

  let erroSupabase: { message: string } | null
  try {
    const supabase = await criarClienteServidor()
    const resultado = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/auth/callback?destino=${destino}`,
    })
    erroSupabase = resultado.error
  } catch (erro) {
    console.error('[recuperacao] Falha ao contatar o Supabase:', erro)
    return { erro: 'Não foi possível enviar o link agora. Tente mais tarde.' }
  }

  if (erroSupabase) {
    // Nao mostramos isto na tela — confirmar a existencia do e-mail ou expor
    // detalhe do erro permitiria descobrir quem tem conta no site, a mesma
    // razao da mensagem generica no login. Mas registrar e essencial: e o que
    // vai avisar quando o limite de 2 e-mails por hora estourar.
    console.error('[recuperacao] Supabase recusou o envio:', erroSupabase.message)
  }

  /*
   * Responde "enviado" mesmo se o e-mail nao existir ou o Supabase tiver
   * recusado. Confirmar a existencia permitiria descobrir quem tem conta no
   * site — a mesma razao da mensagem generica no login.
   */
  return { enviado: true }
}
