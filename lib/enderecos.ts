import type { FiltrosUrl } from '@/lib/tmdb'

/**
 * Monta o endereco do catalogo a partir dos filtros.
 *
 * Fica num modulo proprio porque e usado pela barra de filtros (componente de
 * cliente) e pelo filtro de nota (componente de servidor). Duplicar a funcao
 * nos dois seria o comeco de uma divergencia silenciosa.
 *
 * A pagina e descartada de proposito: ao trocar um filtro, o certo e voltar
 * para a primeira pagina — continuar na pagina 7 de outro resultado confunde.
 */
export function montarEndereco(filtros: FiltrosUrl): string {
  const parametros = new URLSearchParams()

  if (filtros.servico) parametros.set('servico', filtros.servico)
  if (filtros.genero) parametros.set('genero', filtros.genero)
  if (filtros.ano) parametros.set('ano', filtros.ano)
  if (filtros.nota) parametros.set('nota', filtros.nota)

  const consulta = parametros.toString()
  return consulta ? `/?${consulta}` : '/'
}

/** Ha algum filtro aplicado? Usado para decidir se o heroi aparece. */
export function temFiltro(filtros: FiltrosUrl): boolean {
  return Boolean(
    filtros.servico || filtros.genero || filtros.ano || filtros.nota,
  )
}
