import { Conteiner } from '@/components/conteiner'
import { FiltroNota } from '@/components/filtro-nota'
import { GradeFilmes } from '@/components/grade-filmes'
import { Heroi } from '@/components/heroi'
import {
  buscarFilmes,
  normalizarFiltros,
  type Filme,
  type FiltrosUrl,
  type ParametrosCrus,
} from '@/lib/tmdb'

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<ParametrosCrus>
}) {
  const filtros = normalizarFiltros(await searchParams)
  const { filmes } = await buscarFilmes(filtros)

  /*
   * O heroi so aparece na visao sem filtros. Assim que a pessoa filtra algo,
   * ele some e a grade assume a tela: quem esta filtrando quer resultados,
   * nao decoracao.
   */
  const filmeDoHeroi = temFiltro(filtros) ? undefined : escolherDestaque(filmes)

  /* Fora da grade para nao aparecer duas vezes na mesma tela. */
  const filmesDaGrade = filmeDoHeroi
    ? filmes.filter((filme) => filme.id !== filmeDoHeroi.id)
    : filmes

  return (
    <>
      {filmeDoHeroi && <Heroi filme={filmeDoHeroi} />}

      <Conteiner className={filmeDoHeroi ? 'pt-4' : 'pt-10'}>
        <h2 className="titulo text-2xl sm:text-3xl">{tituloDaSecao(filtros)}</h2>
        <p className="mt-2 text-sm text-texto-suave">
          Disponíveis por assinatura no Brasil, sem custo extra.
        </p>

        <div className="mt-6">
          <FiltroNota filtros={filtros} />
        </div>

        <div className="mt-8">
          {filmesDaGrade.length > 0 ? (
            <GradeFilmes filmes={filmesDaGrade} />
          ) : (
            <EstadoVazio />
          )}
        </div>
      </Conteiner>
    </>
  )
}

function temFiltro(filtros: FiltrosUrl): boolean {
  return Boolean(filtros.servico || filtros.genero || filtros.ano || filtros.nota)
}

/**
 * O destaque e o primeiro filme que tenha imagem larga. Nem todo filme do TMDB
 * tem backdrop, e sem ela o heroi viraria uma faixa vazia no topo da home.
 * Se nenhum dos resultados tiver, a pagina simplesmente comeca pela grade.
 */
function escolherDestaque(filmes: Filme[]): Filme | undefined {
  return filmes.find((filme) => filme.backdropUrl !== null)
}

function tituloDaSecao(filtros: FiltrosUrl): string {
  if (filtros.nota) return `Filmes com nota ${filtros.nota} ou maior`
  return 'Em alta agora'
}

/** Nenhum resultado nao e erro. E resposta valida, e precisa oferecer saida. */
function EstadoVazio() {
  return (
    <div className="rounded-grande border border-white/10 bg-superficie/50 p-12 text-center">
      <p className="titulo text-xl">Nenhum filme encontrado</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-texto-suave">
        Não há filmes que atendam a essa combinação de filtros. Tente uma nota
        mínima menor.
      </p>
    </div>
  )
}
