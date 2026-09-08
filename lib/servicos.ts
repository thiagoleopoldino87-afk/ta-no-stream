export type Servico = {
  id: number
  nome: string
}

/**
 * Servicos de assinatura do Brasil, com os IDs obtidos de
 * /watch/providers/movie?watch_region=BR. A lista e curada de proposito:
 * o TMDB devolve 86 provedores no Brasil, a maioria de nicho ou canais
 * vendidos dentro de outro servico.
 *
 * Star Plus e Telecine ficaram de fora porque nao existem mais como
 * assinatura propria no Brasil: o Star+ foi incorporado ao Disney+ e o
 * Telecine so aparece como canal dentro do Prime Video.
 */
export const SERVICOS: Servico[] = [
  { id: 8, nome: 'Netflix' },
  { id: 119, nome: 'Amazon Prime Video' },
  { id: 337, nome: 'Disney Plus' },
  { id: 1899, nome: 'HBO Max' },
  { id: 307, nome: 'Globoplay' },
  { id: 350, nome: 'Apple TV+' },
  { id: 531, nome: 'Paramount Plus' },
  { id: 11, nome: 'MUBI' },
  { id: 283, nome: 'Crunchyroll' },
]

export const TODOS_OS_IDS = SERVICOS.map((s) => s.id).join('|')
