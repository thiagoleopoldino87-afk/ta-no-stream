import { describe, expect, test } from 'vitest'
import {
  montarParametrosDescoberta,
  normalizarFiltros,
  paginaValida,
} from '@/lib/tmdb/parametros'
import { TODOS_OS_IDS } from '@/lib/servicos'

describe('paginaValida', () => {
  test('aceita um numero normal', () => {
    expect(paginaValida('3')).toBe('3')
  })

  test('vira 1 quando nao vem nada', () => {
    expect(paginaValida(undefined)).toBe('1')
  })

  test('vira 1 quando vem texto', () => {
    expect(paginaValida('abc')).toBe('1')
  })

  test('vira 1 quando vem zero ou negativo', () => {
    expect(paginaValida('0')).toBe('1')
    expect(paginaValida('-5')).toBe('1')
  })

  test('vira 1 acima de 500, que e o teto do TMDB', () => {
    expect(paginaValida('501')).toBe('1')
    expect(paginaValida('99999')).toBe('1')
  })

  test('aceita exatamente 500', () => {
    expect(paginaValida('500')).toBe('500')
  })
})

describe('montarParametrosDescoberta', () => {
  test('sempre envia os parametros obrigatorios do Brasil', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('language')).toBe('pt-BR')
    expect(p.get('region')).toBe('BR')
    expect(p.get('watch_region')).toBe('BR')
    expect(p.get('with_watch_monetization_types')).toBe('flatrate')
    expect(p.get('include_adult')).toBe('false')
    expect(p.get('sort_by')).toBe('popularity.desc')
    expect(p.get('page')).toBe('1')
  })

  test('sem filtro de servico, busca em todos os servicos da lista', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('with_watch_providers')).toBe(TODOS_OS_IDS)
  })

  test('com filtro de servico, usa apenas o escolhido', () => {
    const p = montarParametrosDescoberta({ servico: '8' })
    expect(p.get('with_watch_providers')).toBe('8')
  })

  test('traduz genero, ano e nota para os nomes do TMDB', () => {
    const p = montarParametrosDescoberta({ genero: '28', ano: '2024', nota: '7' })
    expect(p.get('with_genres')).toBe('28')
    expect(p.get('primary_release_year')).toBe('2024')
    expect(p.get('vote_average.gte')).toBe('7')
  })

  test('nao envia filtros que nao foram escolhidos', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('with_genres')).toBeNull()
    expect(p.get('primary_release_year')).toBeNull()
    expect(p.get('vote_average.gte')).toBeNull()
  })

  test('ignora filtros vazios vindos da URL', () => {
    const p = montarParametrosDescoberta({ genero: '', ano: '' })
    expect(p.get('with_genres')).toBeNull()
    expect(p.get('primary_release_year')).toBeNull()
  })
})

describe('normalizarFiltros', () => {
  test('aproveita os valores simples', () => {
    expect(normalizarFiltros({ servico: '8', ano: '2024' })).toEqual({
      servico: '8',
      genero: undefined,
      ano: '2024',
      nota: undefined,
      pagina: undefined,
    })
  })

  test('pega o primeiro quando a chave vem repetida na URL', () => {
    expect(normalizarFiltros({ genero: ['28', '12'] }).genero).toBe('28')
  })

  test('descarta chaves que nao sao filtros conhecidos', () => {
    const filtros = normalizarFiltros({ utm_source: 'instagram', ano: '2024' })
    expect(filtros).not.toHaveProperty('utm_source')
    expect(filtros.ano).toBe('2024')
  })

  test('devolve tudo indefinido quando a URL esta limpa', () => {
    const filtros = normalizarFiltros({})
    expect(filtros.servico).toBeUndefined()
    expect(filtros.pagina).toBeUndefined()
  })
})
