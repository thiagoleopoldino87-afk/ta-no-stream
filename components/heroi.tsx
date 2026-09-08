import Image from 'next/image'
import Link from 'next/link'
import { Conteiner } from '@/components/conteiner'
import { OndeAssistir } from '@/components/onde-assistir'
import type { FilmeDetalhado } from '@/lib/tmdb'

/**
 * Faixa cinematografica no topo do catalogo, com o filme mais popular do
 * momento.
 *
 * A imagem recebe dois degrades sobrepostos — um da esquerda e outro de baixo.
 * Sem eles o texto branco cai sobre partes claras da foto e some. E o motivo
 * de todo hero de streaming ter esse escurecimento: legibilidade, nao enfeite.
 */
export function Heroi({ filme }: { filme: FilmeDetalhado }) {
  return (
    <section className="relative min-h-[460px] w-full overflow-hidden sm:min-h-[560px] lg:min-h-[640px]">
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
      <div className="absolute inset-0 bg-gradient-to-r from-noite via-noite/85 to-transparent" />
      {/* Funde o fim da imagem com o fundo da pagina */}
      <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/30 to-transparent" />

      <Conteiner className="relative flex min-h-[460px] flex-col justify-end pb-12 pt-24 sm:min-h-[560px] lg:min-h-[640px] lg:pb-16">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-destaque">
            Em destaque
          </p>

          <h1 className="titulo text-4xl sm:text-5xl lg:text-6xl">
            {filme.titulo}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-texto-suave">
            {filme.ano && <span>{filme.ano}</span>}
            {filme.duracaoEmMinutos && (
              <span>{formatarDuracao(filme.duracaoEmMinutos)}</span>
            )}
            {filme.nota !== null && (
              <span className="flex items-center gap-1.5">
                <Estrela />
                <span className="font-semibold text-texto">{filme.nota}</span>
              </span>
            )}
            {filme.generos.slice(0, 2).map((genero) => (
              <span key={genero}>{genero}</span>
            ))}
          </div>

          {filme.sinopse && (
            <p className="mt-5 line-clamp-3 max-w-xl text-sm leading-relaxed text-texto-suave sm:text-base">
              {filme.sinopse}
            </p>
          )}

          <div className="mt-6">
            <OndeAssistir dados={filme.ondeAssistir} tamanho="compacto" />
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            {filme.ondeAssistir.link && (
              <a
                href={filme.ondeAssistir.link}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-grande bg-destaque px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-destaque/30 transition-all hover:bg-destaque-forte hover:shadow-xl hover:shadow-destaque/40 focus:outline-none focus:ring-2 focus:ring-destaque-suave focus:ring-offset-2 focus:ring-offset-noite"
              >
                Assistir agora
                <IconeLinkExterno />
              </a>
            )}

            <Link
              href={`/filme/${filme.id}`}
              className="inline-flex items-center gap-2 rounded-grande border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-texto backdrop-blur-sm transition-colors hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <IconeInfo />
              Ver detalhes
            </Link>
          </div>
        </div>
      </Conteiner>
    </section>
  )
}

/** 142 vira "2h 22min"; 45 vira "45min". */
function formatarDuracao(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto}min`
  if (resto === 0) return `${horas}h`
  return `${horas}h ${resto}min`
}

function Estrela() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-ouro" aria-hidden="true">
      <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3 1.2-6.5L2.5 9.3l6.6-.9L12 2.5z" />
    </svg>
  )
}

function IconeInfo() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 stroke-current"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  )
}

function IconeLinkExterno() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 stroke-current"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  )
}
