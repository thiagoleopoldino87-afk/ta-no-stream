import Image from 'next/image'
import { Conteiner } from '@/components/conteiner'
import { urlOndeAssistir, type Filme } from '@/lib/tmdb'

/**
 * Faixa cinematografica no topo do catalogo, com o filme mais popular do
 * momento. Nao custa chamada extra a API: e o primeiro resultado da propria
 * consulta que a grade ja faz.
 *
 * A imagem recebe dois degrades sobrepostos — um da esquerda e outro de baixo.
 * Sem eles o texto branco cai sobre partes claras da foto e some. E o motivo
 * de todo hero de streaming ter esse escurecimento: legibilidade, nao enfeite.
 */
export function Heroi({ filme }: { filme: Filme }) {
  return (
    <section className="relative min-h-[420px] w-full overflow-hidden sm:min-h-[520px] lg:min-h-[600px]">
      {filme.backdropUrl && (
        <Image
          src={filme.backdropUrl}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      )}

      {/* Escurece a esquerda, onde o texto fica */}
      <div className="absolute inset-0 bg-gradient-to-r from-noite via-noite/80 to-transparent" />
      {/* Funde o fim da imagem com o fundo da pagina */}
      <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/20 to-transparent" />

      <Conteiner className="relative flex min-h-[420px] flex-col justify-end pb-12 pt-24 sm:min-h-[520px] lg:min-h-[600px] lg:pb-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-destaque">
            Em destaque
          </p>

          <h1 className="titulo text-4xl sm:text-5xl lg:text-6xl">
            {filme.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-texto-suave">
            {filme.ano && <span>{filme.ano}</span>}
            {filme.nota !== null && (
              <span className="flex items-center gap-1.5">
                <Estrela />
                <span className="font-semibold text-texto">{filme.nota}</span>
              </span>
            )}
            <span className="rounded-suave bg-white/10 px-2.5 py-1 text-xs">
              Incluído na assinatura
            </span>
          </div>

          {filme.sinopse && (
            <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-relaxed text-texto-suave sm:text-base">
              {filme.sinopse}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={urlOndeAssistir(filme.id)}
              target="_blank"
              rel="noreferrer"
              className="rounded-grande bg-destaque px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-destaque/25 transition-colors hover:bg-destaque-forte focus:outline-none focus:ring-2 focus:ring-destaque-suave focus:ring-offset-2 focus:ring-offset-noite"
            >
              Onde assistir
            </a>
          </div>
        </div>
      </Conteiner>
    </section>
  )
}

function Estrela() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-ouro"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3 1.2-6.5L2.5 9.3l6.6-.9L12 2.5z" />
    </svg>
  )
}
