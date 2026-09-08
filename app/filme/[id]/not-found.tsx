import Link from 'next/link'
import { Conteiner } from '@/components/conteiner'

/**
 * O Next.js mostra este arquivo quando a pagina chama notFound().
 * Acontece com id que nao e numero ou filme que nao existe no TMDB.
 */
export default function FilmeNaoEncontrado() {
  return (
    <Conteiner className="py-28">
      <h1 className="titulo text-3xl sm:text-4xl">Filme não encontrado</h1>
      <p className="mt-4 max-w-lg text-sm leading-relaxed text-texto-suave">
        Este filme não existe na base do TMDB, ou o endereço está errado.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-grande bg-destaque px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-destaque/25 transition-colors hover:bg-destaque-forte focus:outline-none focus:ring-2 focus:ring-destaque-suave focus:ring-offset-2 focus:ring-offset-noite"
      >
        Voltar ao catálogo
      </Link>
    </Conteiner>
  )
}
