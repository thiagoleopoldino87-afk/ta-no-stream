import { pedirAoTmdb } from './cliente'
import { montarParametrosDescoberta, type FiltrosUrl } from './parametros'
import { traduzirFilme } from './traduzir'
import type { PaginaDeFilmes, RespostaDescoberta } from './tipos'

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
export type { Filme, PaginaDeFilmes } from './tipos'
export { ErroTmdb } from './cliente'
