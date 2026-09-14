'use client'

import { useActionState } from 'react'
import type { EstadoRecuperacao } from '@/lib/auth/tipos'
import { pedirRecuperacao } from '@/app/entrar/recuperar/acoes'

type Props = {
  /** Aviso vindo da URL (ex.: callback recusou o link) — nao veio de submit. */
  avisoInicial?: string
}

export function FormularioRecuperar({ avisoInicial }: Props) {
  const inicial: EstadoRecuperacao = avisoInicial ? { erro: avisoInicial } : {}
  const [estado, enviar, enviando] = useActionState(pedirRecuperacao, inicial)

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="titulo text-3xl">Recuperar senha</h1>

      {estado.enviado ? (
        <p className="mt-4 rounded-medio border border-white/10 bg-superficie/60 px-4 py-4 text-sm leading-relaxed text-texto-suave">
          Se existir uma conta com esse e-mail, enviamos um link para
          redefinir a senha. Confira também a caixa de spam.
        </p>
      ) : (
        <>
          <p className="mt-2 text-sm text-texto-suave">
            Informe seu e-mail e enviaremos um link para criar uma senha nova.
          </p>

          <form action={enviar} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm text-texto-suave">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
              />
            </div>

            {estado.erro && (
              <p role="alert" className="text-sm text-destaque-suave">
                {estado.erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-grande bg-destaque px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte disabled:opacity-60"
            >
              {enviando ? 'Enviando...' : 'Enviar link'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
