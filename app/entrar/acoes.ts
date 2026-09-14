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

  // So a chamada ao Supabase fica protegida — redirect() PRECISA ficar fora
  // deste bloco. Ele funciona lancando uma excecao que o Next captura; um
  // catch em volta dele engoliria o redirecionamento e o login pararia de
  // funcionar em silencio.
  let houveErro: boolean
  try {
    const supabase = await criarClienteServidor()
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    houveErro = Boolean(error)
  } catch (erro) {
    // Banco hibernado ou fora do ar: trata como se as credenciais estivessem
    // erradas do ponto de vista da tela, mas registra a causa real no log.
    console.error('[entrar] Falha ao contatar o Supabase:', erro)
    return { erro: 'Não foi possível entrar agora. Tente novamente em instantes.' }
  }

  if (houveErro) {
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

  // Mesmo cuidado de entrar(): so a chamada ao Supabase entra no try, o
  // redirect() fica fora para nao ser engolido pelo catch.
  let erroSupabase: { message: string } | null
  try {
    const supabase = await criarClienteServidor()
    const resultado = await supabase.auth.signUp({ email, password: senha })
    erroSupabase = resultado.error
  } catch (erro) {
    console.error('[criarConta] Falha ao contatar o Supabase:', erro)
    return { erro: 'Não foi possível criar sua conta agora. Tente novamente em instantes.' }
  }

  if (erroSupabase) {
    if (erroSupabase.message.toLowerCase().includes('already')) {
      return { erro: 'Esse e-mail já tem conta. Tente entrar.' }
    }
    return { erro: 'Não conseguimos criar sua conta. Tente de novo.' }
  }

  // Como a confirmacao de e-mail esta desligada no projeto, o cadastro ja
  // deixa a pessoa logada. Ver secao 4 da spec.
  revalidatePath('/', 'layout')
  redirect('/')
}
