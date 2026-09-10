'use server'

import { headers } from 'next/headers'
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

  const cabecalhos = await headers()
  const origem = cabecalhos.get('origin') ?? 'http://localhost:3000'

  const supabase = await criarClienteServidor()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/redefinir`,
  })

  /*
   * Responde "enviado" mesmo se o e-mail nao existir. Confirmar a existencia
   * permitiria descobrir quem tem conta no site — a mesma razao da mensagem
   * generica no login.
   */
  return { enviado: true }
}
