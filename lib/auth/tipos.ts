/** O que uma Server Action de autenticacao devolve para o formulario. */
export type EstadoAuth = { erro?: string }

/** O mesmo, mais o aviso de que o e-mail de recuperacao foi disparado. */
export type EstadoRecuperacao = EstadoAuth & { enviado?: boolean }
