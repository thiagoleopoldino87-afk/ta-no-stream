// Import relativo de proposito: o apelido '@/' so existe para o TypeScript e o
// Next.js. O Node puro nao o resolve, e a verificacao da Tarefa 6 roda no Node.
import { TODOS_OS_IDS } from '../servicos'

export type FiltrosUrl = {
  servico?: string
  genero?: string
  ano?: string
  nota?: string
  pagina?: string
}

/** O formato cru que o Next.js entrega: a URL pode repetir uma chave. */
export type ParametrosCrus = { [chave: string]: string | string[] | undefined }

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

/**
 * Reduz o que veio da URL aos cinco filtros que conhecemos, descartando
 * qualquer outra chave (utm_source e afins) e ficando com o primeiro valor
 * quando a mesma chave aparece repetida.
 */
export function normalizarFiltros(crus: ParametrosCrus): FiltrosUrl {
  return {
    servico: primeiro(crus.servico),
    genero: primeiro(crus.genero),
    ano: primeiro(crus.ano),
    nota: primeiro(crus.nota),
    pagina: primeiro(crus.pagina),
  }
}

/** O TMDB rejeita page acima de 500. Qualquer valor invalido volta para 1. */
export function paginaValida(valor: string | undefined): string {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1 || numero > 500) return '1'
  return String(numero)
}

export function montarParametrosDescoberta(filtros: FiltrosUrl): URLSearchParams {
  const parametros = new URLSearchParams({
    language: 'pt-BR',
    region: 'BR',
    watch_region: 'BR',
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page: paginaValida(filtros.pagina),
    with_watch_providers: filtros.servico || TODOS_OS_IDS,
  })

  if (filtros.genero) parametros.set('with_genres', filtros.genero)
  if (filtros.ano) parametros.set('primary_release_year', filtros.ano)
  if (filtros.nota) parametros.set('vote_average.gte', filtros.nota)

  return parametros
}
