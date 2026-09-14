'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validarSenha } from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { EstadoAuth } from '@/lib/auth/tipos'

export async function redefinirSenha(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const senha = String(dados.get('senha') ?? '')

  const erro = validarSenha(senha)
  if (erro) return { erro }

  let erroSupabase: { name: string; message: string } | null
  try {
    const supabase = await criarClienteServidor()
    const resultado = await supabase.auth.updateUser({ password: senha })
    erroSupabase = resultado.error
  } catch (erro) {
    console.error('[redefinir] Falha ao contatar o Supabase:', erro)
    return { erro: 'Não foi possível salvar a senha agora. Tente novamente em instantes.' }
  }

  if (erroSupabase) {
    // "Sessao ausente" e "link expirado" tem causas diferentes e pediam
    // mensagens diferentes: a primeira e quem abriu esta pagina sem passar
    // pelo link do e-mail (nenhuma sessao nos cookies); a segunda e um code
    // que o Supabase ja recusou (usado de novo, ou expirado). Juntar as duas
    // na mesma frase generica escondia qual das duas estava acontecendo.
    if (erroSupabase.name === 'AuthSessionMissingError') {
      return {
        erro:
          'Sessão ausente. Abra o link mais recente do e-mail de recuperação e tente de novo.',
      }
    }
    return { erro: 'O link expirou ou já foi usado. Peça outro.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
