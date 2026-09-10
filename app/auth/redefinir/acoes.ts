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

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.updateUser({ password: senha })

  if (error) {
    return { erro: 'O link expirou ou já foi usado. Peça outro.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
