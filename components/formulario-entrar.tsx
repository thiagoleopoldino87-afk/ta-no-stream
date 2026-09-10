'use client'

import { useActionState, useState } from 'react'
import { criarConta, entrar } from '@/app/entrar/acoes'
import type { EstadoAuth } from '@/lib/auth/tipos'

const INICIAL: EstadoAuth = {}

export function FormularioEntrar() {
  const [modoCadastro, setModoCadastro] = useState(false)
  const acao = modoCadastro ? criarConta : entrar
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="titulo text-3xl">
        {modoCadastro ? 'Criar conta' : 'Entrar'}
      </h1>
      <p className="mt-2 text-sm text-texto-suave">
        {modoCadastro
          ? 'Sua conta guarda o que você quer ver e o que já viu.'
          : 'Entre para acessar suas listas.'}
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
            autoComplete="email"
            required
            className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
          />
        </div>

        <div>
          <label htmlFor="senha" className="mb-1.5 block text-sm text-texto-suave">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            /* Diz ao gerenciador de senhas se e senha nova ou existente */
            autoComplete={modoCadastro ? 'new-password' : 'current-password'}
            required
            minLength={6}
            className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
          />
        </div>

        {estado.erro && (
          <p
            role="alert"
            className="rounded-medio border border-destaque/40 bg-destaque/10 px-4 py-3 text-sm text-destaque-suave"
          >
            {estado.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-grande bg-destaque px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte disabled:opacity-60"
        >
          {enviando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setModoCadastro((v) => !v)}
        className="mt-6 text-sm text-texto-suave underline underline-offset-4 hover:text-texto"
      >
        {modoCadastro ? 'Já tenho conta' : 'Criar uma conta'}
      </button>

      {!modoCadastro && (
        <a
          href="/entrar/recuperar"
          className="mt-3 block text-sm text-texto-fraco underline underline-offset-4 hover:text-texto-suave"
        >
          Esqueci minha senha
        </a>
      )}
    </div>
  )
}
