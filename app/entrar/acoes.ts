'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validarEmail, validarSenha } from '@/lib/auth/validacao'
import type { EstadoAuth } from '@/lib/auth/tipos'
import { criarClienteServidor } from '@/lib/supabase/servidor'

function lerCampos(dados: FormData) {
  return {
    email: String(dados.get('email') ?? '').trim(),
    senha: String(dados.get('senha') ?? ''),
  }
}

export async function entrar(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(dados)

  const erroDeFormato = validarEmail(email) ?? validarSenha(senha)
  if (erroDeFormato) return { erro: erroDeFormato }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    /*
     * A MESMA mensagem para senha errada e para e-mail inexistente, de
     * proposito. Distinguir permitiria testar enderecos e descobrir quem tem
     * conta no site — chamam isso de enumeracao de usuarios.
     */
    return { erro: 'E-mail ou senha incorretos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function criarConta(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(dados)

  const erroDeFormato = validarEmail(email) ?? validarSenha(senha)
  if (erroDeFormato) return { erro: erroDeFormato }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signUp({ email, password: senha })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { erro: 'Esse e-mail já tem conta. Tente entrar.' }
    }
    return { erro: 'Não conseguimos criar sua conta. Tente de novo.' }
  }

  // Como a confirmacao de e-mail esta desligada no projeto, o cadastro ja
  // deixa a pessoa logada. Ver secao 4 da spec.
  revalidatePath('/', 'layout')
  redirect('/')
}
