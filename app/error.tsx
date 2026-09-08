'use client'

import { Conteiner } from '@/components/conteiner'

/**
 * O Next.js mostra este arquivo sozinho quando page.tsx falha.
 * Precisa ser 'use client': so componentes de cliente conseguem capturar o
 * erro e oferecer o botao de nova tentativa.
 *
 * Nunca exibir a mensagem tecnica do erro. Ela nao ajuda quem esta usando e
 * ainda revela o funcionamento interno do sistema.
 */
export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <Conteiner className="py-24">
      <h1 className="titulo-display max-w-2xl text-2xl sm:text-3xl">
        Nao conseguimos carregar os filmes
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-cinza">
        A base de dados nao respondeu. Isso costuma ser temporario — tente de
        novo em alguns instantes.
      </p>
      <button
        onClick={reset}
        className="mt-8 border border-branco/50 px-6 py-4 text-xs uppercase tracking-[0.15em] text-branco transition-colors hover:bg-superficie focus:outline-none focus:ring-2 focus:ring-branco"
      >
        Tentar de novo
      </button>
    </Conteiner>
  )
}
