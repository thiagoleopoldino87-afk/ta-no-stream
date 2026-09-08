import Link from 'next/link'
import { BarraFiltros } from '@/components/barra-filtros'
import { Conteiner } from '@/components/conteiner'
import { FiltroNota } from '@/components/filtro-nota'
import { GradeFilmes } from '@/components/grade-filmes'
import { Heroi } from '@/components/heroi'
import { temFiltro } from '@/lib/enderecos'
import {
  buscarFilme,
  buscarFilmes,
  buscarGeneros,
  normalizarFiltros,
  type Filme,
  type FilmeDetalhado,
  type FiltrosUrl,
  type Genero,
  type ParametrosCrus,
} from '@/lib/tmdb'

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<ParametrosCrus>
}) {
  const filtros = normalizarFiltros(await searchParams)

  /*
   * As duas buscas nao dependem uma da outra, entao vao juntas. Em sequencia,
   * a pagina esperaria a soma dos dois tempos; assim espera so o mais lento.
   */
  const [{ filmes }, generos] = await Promise.all([
    buscarFilmes(filtros),
    buscarGeneros(),
  ])

  /*
   * O heroi so aparece na visao sem filtros. Assim que a pessoa filtra algo,
   * ele some e a grade assume a tela: quem esta filtrando quer resultados,
   * nao decoracao.
   */
  const destaque = temFiltro(filtros) ? undefined : escolherDestaque(filmes)
  const filmeDoHeroi = await carregarDetalhes(destaque)

  /* Fora da grade para nao aparecer duas vezes na mesma tela. */
  const filmesDaGrade = filmeDoHeroi
    ? filmes.filter((filme) => filme.id !== filmeDoHeroi.id)
    : filmes

  return (
    <>
      {filmeDoHeroi && <Heroi filme={filmeDoHeroi} />}

      <Conteiner className={filmeDoHeroi ? 'pt-6' : 'pt-10'}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="titulo text-2xl sm:text-3xl">
              {temFiltro(filtros) ? 'Resultados' : 'Em alta agora'}
            </h2>
            <p className="mt-2 text-sm text-texto-suave">
              {descreverFiltros(filtros, generos)}
            </p>
          </div>

          {temFiltro(filtros) && (
            <Link
              href="/"
              className="text-sm font-medium text-destaque-suave underline underline-offset-4 transition-colors hover:text-destaque"
            >
              Limpar filtros
            </Link>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <BarraFiltros filtros={filtros} generos={generos} />
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

/**
 * O destaque e o primeiro filme que tenha imagem larga. Nem todo filme do TMDB
 * tem backdrop, e sem ela o heroi viraria uma faixa vazia no topo da home.
 */
function escolherDestaque(filmes: Filme[]): Filme | undefined {
  return filmes.find((filme) => filme.backdropUrl !== null)
}

/**
 * Uma chamada extra, so para o filme do heroi, porque a lista do /discover nao
 * traz duracao, generos nem em quais servicos o filme esta. Fica em cache por
 * 24 horas, entao o custo real e proximo de zero.
 *
 * Degradacao graciosa: se essa chamada falhar, o heroi some e a grade continua
 * normalmente. A pagina nunca quebra inteira por causa da faixa de destaque.
 */
async function carregarDetalhes(
  filme: Filme | undefined,
): Promise<FilmeDetalhado | undefined> {
  if (!filme) return undefined

  try {
    return await buscarFilme(filme.id)
  } catch {
    return undefined
  }
}

/** Frase em portugues descrevendo o que esta filtrado no momento. */
function descreverFiltros(filtros: FiltrosUrl, generos: Genero[]): string {
  if (!temFiltro(filtros)) {
    return 'Disponíveis por assinatura no Brasil, sem custo extra.'
  }

  const partes: string[] = []

  const genero = generos.find((g) => String(g.id) === filtros.genero)
  if (genero) partes.push(genero.nome.toLowerCase())
  if (filtros.ano) partes.push(`de ${filtros.ano}`)
  if (filtros.nota) partes.push(`com nota ${filtros.nota} ou maior`)

  const descricao = partes.length > 0 ? ` ${partes.join(', ')}` : ''
  return `Filmes${descricao}, disponíveis por assinatura no Brasil.`
}

/** Nenhum resultado nao e erro. E resposta valida, e precisa oferecer saida. */
function EstadoVazio() {
  return (
    <div className="rounded-grande border border-white/10 bg-superficie/50 p-12 text-center">
      <p className="titulo text-xl">Nenhum filme encontrado</p>
      <p className="mx-auto mt-3 max-w-md text-sm text-texto-suave">
        Nenhum filme atende a essa combinação de filtros. Tente afrouxar a nota
        mínima ou escolher outro ano.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-grande bg-destaque px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte"
      >
        Limpar filtros
      </Link>
    </div>
  )
}
