'use client'

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-20 md:px-10">
      <p className="titulo-display text-3xl">Nao conseguimos carregar os filmes</p>
      <p className="mt-3 max-w-xl text-cinza">
        A base de dados nao respondeu. Isso costuma ser temporario.
      </p>
      <button
        onClick={reset}
        className="mt-8 border border-branco/50 px-6 py-4 text-sm uppercase tracking-wide text-branco transition-colors hover:bg-superficie"
      >
        Tentar de novo
      </button>
    </div>
  )
}
