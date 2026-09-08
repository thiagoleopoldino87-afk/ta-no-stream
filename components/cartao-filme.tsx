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
      <div className="relative aspect-[2/3] overflow-hidden bg-superficie ring-branco group-focus-visible:ring-2">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt=""
            fill
            /*
             * Diz ao navegador qual a largura real do poster em cada tamanho de
             * tela, para ele baixar a imagem do tamanho certo em vez da maior.
             * Precisa acompanhar as colunas definidas em grade-filmes.tsx.
             */
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, (max-width: 1536px) 17vw, 200px"
            className="object-cover transition-opacity duration-200 group-hover:opacity-15"
          />
        ) : (
          <SemPoster titulo={filme.titulo} />
        )}

        {/*
         * O sistema visual proibe hover com escala ou deslocamento: so mudanca
         * de cor e opacidade. Entao o poster escurece e revela a sinopse.
         *
         * Mostrar a SINOPSE, e nao o titulo, e proposital: o titulo ja aparece
         * logo abaixo do poster, e repetir a mesma informacao ocupa espaco sem
         * entregar nada novo.
         */}
        {filme.sinopse && (
          <div className="pointer-events-none absolute inset-0 flex items-center bg-abismo/40 p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            <p className="line-clamp-[10] text-[11px] leading-relaxed text-branco">
              {filme.sinopse}
            </p>
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="truncate text-[11px] uppercase tracking-wide text-branco">
          {filme.titulo}
        </p>
        <p className="mt-0.5 text-[11px] text-cinza">
          {filme.ano ?? 'Sem data'}
          {filme.nota !== null && ` · ${filme.nota}`}
        </p>
      </div>
    </Link>
  )
}

/** Alguns filmes do TMDB nao tem imagem. Nunca mostrar icone quebrado. */
function SemPoster({ titulo }: { titulo: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-superficie p-3">
      <p className="text-center text-[11px] uppercase leading-tight text-cinza-claro">
        {titulo}
      </p>
    </div>
  )
}
