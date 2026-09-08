import Image from 'next/image'
import Link from 'next/link'
import type { Filme } from '@/lib/tmdb'

export function CartaoFilme({ filme }: { filme: Filme }) {
  return (
    <Link
      href={`/filme/${filme.id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-branco"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-superficie">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt={`Poster de ${filme.titulo}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-200 group-hover:opacity-40"
          />
        ) : (
          <SemPoster titulo={filme.titulo} />
        )}

        {/* Sem escala nem deslocamento: o sistema so permite mudanca de cor */}
        <div className="absolute inset-0 flex items-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="titulo-display text-sm text-branco">{filme.titulo}</p>
        </div>
      </div>

      <div className="mt-2">
        <p className="titulo-display text-sm text-branco">{filme.titulo}</p>
        <p className="mt-1 text-xs text-cinza">
          {filme.ano ?? 'Ano desconhecido'}
          {filme.nota !== null && ` · Nota ${filme.nota}`}
        </p>
      </div>
    </Link>
  )
}

/** Alguns filmes do TMDB nao tem imagem. Nunca mostrar icone quebrado. */
function SemPoster({ titulo }: { titulo: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-superficie p-4">
      <p className="titulo-display text-center text-sm text-branco">{titulo}</p>
    </div>
  )
}
