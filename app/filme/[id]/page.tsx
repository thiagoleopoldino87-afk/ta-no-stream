import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Conteiner } from '@/components/conteiner'
import { OndeAssistir } from '@/components/onde-assistir'
import {
  buscarFilme,
  ErroTmdb,
  urlOndeAssistir,
  type FilmeDetalhado,
} from '@/lib/tmdb'

export default async function PaginaDoFilme({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const filme = await carregar(id)

  return (
    <article>
      <Capa filme={filme} />

      <Conteiner className="relative -mt-24 pb-8 sm:-mt-32">
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
          <Poster filme={filme} />

          <div className="min-w-0 flex-1 pt-2 sm:pt-28">
            <h1 className="titulo text-3xl sm:text-4xl lg:text-5xl">
              {filme.titulo}
            </h1>

            <FichaTecnica filme={filme} />

            {filme.generos.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-2">
                {filme.generos.map((genero) => (
                  <li
                    key={genero}
                    className="rounded-grande border border-white/10 bg-white/5 px-3 py-1 text-xs text-texto-suave"
                  >
                    {genero}
                  </li>
                ))}
              </ul>
            )}

            {filme.sinopse && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-texto-suave sm:text-base">
                {filme.sinopse}
              </p>
            )}

            <div className="mt-8">
              <OndeAssistir dados={filme.ondeAssistir} />
            </div>

            <Acoes filme={filme} />
          </div>
        </div>

        <Elenco filme={filme} />

        <Link
          href="/"
          className="mt-14 inline-block text-sm text-texto-suave underline underline-offset-4 transition-colors hover:text-texto"
        >
          ← Voltar ao catálogo
        </Link>
      </Conteiner>
    </article>
  )
}

/**
 * Um id que nao e numero, ou um filme que nao existe no TMDB, levam a mesma
 * resposta: a tela de nao encontrado. Qualquer outra falha sobe para error.tsx.
 */
async function carregar(id: string): Promise<FilmeDetalhado> {
  const numero = Number(id)
  if (!Number.isInteger(numero) || numero < 1) notFound()

  try {
    return await buscarFilme(numero)
  } catch (erro) {
    if (erro instanceof ErroTmdb && erro.status === 404) notFound()
    throw erro
  }
}

function Capa({ filme }: { filme: FilmeDetalhado }) {
  return (
    <div className="relative h-[38vh] min-h-[260px] w-full overflow-hidden sm:h-[48vh]">
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
      <div className="absolute inset-0 bg-gradient-to-t from-noite via-noite/60 to-noite/20" />
    </div>
  )
}

function Poster({ filme }: { filme: FilmeDetalhado }) {
  return (
    <div className="relative aspect-[2/3] w-40 shrink-0 overflow-hidden rounded-grande bg-superficie shadow-2xl shadow-black/60 sm:w-56 lg:w-64">
      {filme.posterUrl ? (
        <Image
          src={filme.posterUrl}
          alt={`Pôster de ${filme.titulo}`}
          fill
          sizes="(max-width: 640px) 160px, 256px"
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center p-4">
          <p className="text-center text-xs text-texto-fraco">{filme.titulo}</p>
        </div>
      )}
    </div>
  )
}

function FichaTecnica({ filme }: { filme: FilmeDetalhado }) {
  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-texto-suave">
      {filme.ano && <span>{filme.ano}</span>}
      {filme.duracaoEmMinutos && <span>{formatarDuracao(filme.duracaoEmMinutos)}</span>}
      {filme.nota !== null && (
        <span className="flex items-center gap-1.5">
          <Estrela />
          <span className="font-semibold text-texto">{filme.nota}</span>
        </span>
      )}
    </div>
  )
}

function Acoes({ filme }: { filme: FilmeDetalhado }) {
  /* O TMDB nem sempre devolve o link; montar na mao serve de reserva. */
  const link = filme.ondeAssistir.link ?? urlOndeAssistir(filme.id)

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      {link && (
        <a
          href={link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-grande bg-destaque px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-destaque/25 transition-colors hover:bg-destaque-forte focus:outline-none focus:ring-2 focus:ring-destaque-suave focus:ring-offset-2 focus:ring-offset-noite"
        >
          Assistir agora
          <IconeLinkExterno />
        </a>
      )}

      {filme.chaveDoTrailer && (
        <a
          href={`https://www.youtube.com/watch?v=${filme.chaveDoTrailer}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-grande border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-texto transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
          <IconePlay />
          Ver trailer
        </a>
      )}
    </div>
  )
}

function Elenco({ filme }: { filme: FilmeDetalhado }) {
  if (filme.elenco.length === 0) return null

  return (
    <section className="mt-14">
      <h2 className="titulo text-xl">Elenco principal</h2>
      <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filme.elenco.map((ator) => (
          <li
            key={ator.id}
            className="rounded-medio border border-white/5 bg-superficie/60 px-4 py-3"
          >
            <p className="truncate text-sm font-semibold text-texto">
              {ator.nome}
            </p>
            <p className="mt-0.5 truncate text-xs text-texto-fraco">
              {ator.personagem || 'Personagem não informado'}
            </p>
          </li>
        ))}
      </ul>
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

function IconePlay() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
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
