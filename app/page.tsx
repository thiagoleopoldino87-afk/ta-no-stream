import { Conteiner } from '@/components/conteiner'
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
    <Conteiner className="py-10">
      {/*
       * O titulo descreve o CONTEUDO, nao repete o nome do app — esse ja esta
       * no cabecalho. E fica em 24-30px, nao 72px: num catalogo, o maior
       * elemento da tela tem que ser o filme, nunca o texto sobre ele.
       */}
      <h1 className="titulo-display text-2xl sm:text-3xl">Em alta agora</h1>
      <p className="mt-2 text-sm text-cinza">
        Os filmes mais populares disponiveis por assinatura no Brasil.
      </p>

      <div className="mt-8">
        {filmes.length > 0 ? <GradeFilmes filmes={filmes} /> : <EstadoVazio />}
      </div>
    </Conteiner>
  )
}

/** Nenhum resultado nao e erro. E resposta valida, e precisa oferecer saida. */
function EstadoVazio() {
  return (
    <div className="border border-superficie p-12 text-center">
      <p className="titulo-display text-xl">Nenhum filme encontrado</p>
      <p className="mt-3 text-sm text-cinza">
        Nao ha filmes que atendam a essa combinacao de filtros.
      </p>
    </div>
  )
}
