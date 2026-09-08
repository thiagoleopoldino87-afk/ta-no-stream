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

export { normalizarFiltros } from './parametros'
export type { FiltrosUrl }
export type { ParametrosCrus } from './parametros'
export type { Filme, PaginaDeFilmes } from './tipos'
export { ErroTmdb } from './cliente'
