import { GradeFilmes } from '@/components/grade-filmes'
import {
  buscarFilmes,
  normalizarFiltros,
  type ParametrosCrus,
} from '@/lib/tmdb'

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<ParametrosCrus>
}) {
  const filtros = normalizarFiltros(await searchParams)
  const { filmes } = await buscarFilmes(filtros)

  return (
    <div className="px-6 py-10 md:px-10">
      <h1 className="titulo-display text-4xl md:text-6xl">ta-no-stream</h1>
      <p className="mt-3 text-cinza">
        Filmes disponiveis por assinatura no Brasil agora.
      </p>

      <div className="mt-10">
        {filmes.length > 0 ? (
          <GradeFilmes filmes={filmes} />
        ) : (
          <EstadoVazio />
        )}
      </div>
    </div>
  )
}

/** Nenhum resultado nao e erro. E resposta valida, e precisa oferecer saida. */
function EstadoVazio() {
  return (
    <div className="border border-superficie p-10 text-center">
      <p className="titulo-display text-2xl">Nenhum filme encontrado</p>
      <p className="mt-3 text-cinza">
        Nao ha filmes que atendam a essa combinacao de filtros.
      </p>
    </div>
  )
}
