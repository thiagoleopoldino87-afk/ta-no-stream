import Image from 'next/image'
import Link from 'next/link'
import type { Filme } from '@/lib/tmdb'

export function CartaoFilme({ filme }: { filme: Filme }) {
  return (
    <Link
      href={`/filme/${filme.id}`}
      className="group block focus:outline-none"
      aria-label={filme.titulo}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-medio bg-superficie shadow-lg shadow-black/30 ring-destaque transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl group-hover:shadow-black/60 group-focus-visible:ring-2">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt=""
            fill
            /*
             * Diz ao navegador a largura real do poster em cada tela, para ele
             * baixar a imagem no tamanho certo em vez da maior versao.
             * Precisa acompanhar as colunas de grade-filmes.tsx.
             */
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 17vw, 200px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <SemPoster titulo={filme.titulo} />
        )}

        {filme.nota !== null && (
          <span className="absolute right-2 top-2 flex items-center gap-1 rounded-suave bg-black/70 px-2 py-1 text-xs font-semibold text-texto backdrop-blur-sm">
            <Estrela />
            {filme.nota}
          </span>
        )}

        {/* Escurece o pe do poster no hover, para o texto ficar legivel */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/90 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>

      <div className="mt-2.5">
        <p className="truncate text-sm font-semibold text-texto">
          {filme.titulo}
        </p>
        <p className="mt-0.5 text-xs text-texto-fraco">
          {filme.ano ?? 'Sem data'}
        </p>
      </div>
    </Link>
  )
}

/** Alguns filmes do TMDB nao tem imagem. Nunca mostrar icone quebrado. */
function SemPoster({ titulo }: { titulo: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-superficie p-3">
      <p className="text-center text-xs leading-tight text-texto-fraco">
        {titulo}
      </p>
    </div>
  )
}

function Estrela() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3 w-3 fill-ouro"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3 1.2-6.5L2.5 9.3l6.6-.9L12 2.5z" />
    </svg>
  )
}
