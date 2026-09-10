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

  const supabase = await criarClienteServidor()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/redefinir`,
  })

  /*
   * Responde "enviado" mesmo se o e-mail nao existir. Confirmar a existencia
   * permitiria descobrir quem tem conta no site — a mesma razao da mensagem
   * generica no login.
   */
  return { enviado: true }
}
