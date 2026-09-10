/** Minimo que o Supabase aceita por padrao. */
export const SENHA_MINIMA = 6

/*
 * Validacao de e-mail proposital e simples: tem texto, um arroba, texto, um
 * ponto e texto, sem espacos. Nao existe expressao regular que valide e-mail
 * corretamente — a especificacao permite coisas absurdas. Quem valida de
 * verdade e o servidor, ao tentar usar. Aqui o objetivo e so evitar que a
 * pessoa perca tempo enviando um erro obvio de digitacao.
 */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarEmail(email: string): string | null {
  const limpo = email.trim()
  if (limpo === '') return 'Informe seu e-mail.'
  if (!FORMATO_EMAIL.test(limpo)) return 'E-mail invalido.'
  return null
}

export function validarSenha(senha: string): string | null {
  // Sem trim: espaco e um caractere legitimo dentro de uma senha.
  if (senha === '') return 'Informe uma senha.'
  if (senha.length < SENHA_MINIMA) {
    return `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`
  }
  return null
}
