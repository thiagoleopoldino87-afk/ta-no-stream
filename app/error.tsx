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
      <h1 className="titulo max-w-2xl text-3xl sm:text-4xl">
        Não conseguimos carregar os filmes
      </h1>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-texto-suave">
        A base de dados não respondeu. Isso costuma ser temporário — tente de
        novo em alguns instantes.
      </p>
      <button
        onClick={reset}
        className="mt-8 rounded-grande bg-destaque px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-destaque/25 transition-colors hover:bg-destaque-forte focus:outline-none focus:ring-2 focus:ring-destaque-suave focus:ring-offset-2 focus:ring-offset-noite"
      >
        Tentar de novo
      </button>
    </Conteiner>
  )
}
