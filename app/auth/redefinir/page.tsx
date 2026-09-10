'use client'

import { useActionState } from 'react'
import { Conteiner } from '@/components/conteiner'
import type { EstadoAuth } from '@/lib/auth/tipos'
import { redefinirSenha } from './acoes'

const INICIAL: EstadoAuth = {}

export default function PaginaRedefinir() {
  const [estado, enviar, enviando] = useActionState(redefinirSenha, INICIAL)

  return (
    <Conteiner className="py-20">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="titulo text-3xl">Nova senha</h1>
        <p className="mt-2 text-sm text-texto-suave">
          Escolha uma senha de pelo menos 6 caracteres.
        </p>

        <form action={enviar} className="mt-8 space-y-4">
          <div>
            <label htmlFor="senha" className="mb-1.5 block text-sm text-texto-suave">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
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
            {enviando ? 'Salvando...' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </Conteiner>
  )
}
