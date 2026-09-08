import { pedirAoTmdb } from './cliente'
import { montarParametrosDescoberta, type FiltrosUrl } from './parametros'
import { traduzirFilme, traduzirFilmeDetalhado } from './traduzir'
import type {
  FilmeDetalhado,
  FilmeDetalhadoTmdb,
  Genero,
  PaginaDeFilmes,
  RespostaDescoberta,
  RespostaGeneros,
} from './tipos'

export const SEIS_HORAS = 60 * 60 * 6
export const VINTE_E_QUATRO_HORAS = 60 * 60 * 24

/** Teto imposto pelo TMDB: nunca existem mais de 500 paginas. */
const MAXIMO_DE_PAGINAS = 500

export async function buscarFilmes(filtros: FiltrosUrl): Promise<PaginaDeFilmes> {
  const dados = await pedirAoTmdb<RespostaDescoberta>(
    '/discover/movie',
    montarParametrosDescoberta(filtros),
    SEIS_HORAS,
  )

  return {
    filmes: dados.results.map(traduzirFilme),
    pagina: dados.page,
    totalDePaginas: Math.min(dados.total_pages, MAXIMO_DE_PAGINAS),
  }
}

/**
 * Lista de generos de filme, em portugues.
 *
 * Muda praticamente nunca, entao fica em cache por 24h. Precisa vir da API
 * porque o /discover filtra por ID numerico, e esses IDs sao do TMDB.
 */
export async function buscarGeneros(): Promise<Genero[]> {
  const dados = await pedirAoTmdb<RespostaGeneros>(
    '/genre/movie/list',
    new URLSearchParams({ language: 'pt-BR' }),
    VINTE_E_QUATRO_HORAS,
  )

  return dados.genres.map((g) => ({ id: g.id, nome: g.name }))
}

/**
 * Ficha completa de um filme.
 *
 * append_to_response traz elenco, videos e disponibilidade numa unica
 * requisicao, em vez de quatro. Revalida a cada 24h: ficha de filme muda bem
 * menos que a lista de populares.
 */
export async function buscarFilme(id: number): Promise<FilmeDetalhado> {
  const parametros = new URLSearchParams({
    language: 'pt-BR',
    append_to_response: 'credits,videos,watch/providers',
  })

  const dados = await pedirAoTmdb<FilmeDetalhadoTmdb>(
    `/movie/${id}`,
    parametros,
    VINTE_E_QUATRO_HORAS,
  )

  return traduzirFilmeDetalhado(dados)
}

/**
 * Endereco da pagina "onde assistir" do TMDB para um filme.
 *
 * Os termos de uso do TMDB proibem montar link direto para o streaming — a
 * API nem fornece essa informacao. O caminho permitido e mandar a pessoa para
 * a pagina deles, que lista os servicos disponiveis na regiao.
 */
export function urlOndeAssistir(idDoFilme: number): string {
  return `https://www.themoviedb.org/movie/${idDoFilme}/watch?locale=BR`
}

export { normalizarFiltros } from './parametros'
export type { FiltrosUrl }
export type { ParametrosCrus } from './parametros'
export type {
  Filme,
  FilmeDetalhado,
  Genero,
  OndeAssistir,
  PaginaDeFilmes,
  Provedor,
} from './tipos'
export { ErroTmdb } from './cliente'
