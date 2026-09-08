import { describe, expect, test } from 'vitest'
import { provedoresDoBrasil } from '@/lib/tmdb/traduzir'
import type { ProvedoresTmdb } from '@/lib/tmdb/tipos'

/**
 * Resposta real do TMDB para "Um Sonho de Liberdade" (id 278), capturada da
 * API em 07/09/2026. Repare no lixo que vem junto: "Netflix Standard with Ads"
 * e "HBO Max Amazon Channel" sao o MESMO servico ja listado, em outra
 * embalagem, e "Claro tv+" nao esta na nossa lista curada.
 */
const respostaReal: ProvedoresTmdb = {
  results: {
    BR: {
      link: 'https://www.themoviedb.org/movie/278/watch?locale=BR',
      flatrate: [
        { provider_id: 8, provider_name: 'Netflix', logo_path: '/rK1.png' },
        { provider_id: 1899, provider_name: 'HBO Max', logo_path: '/sky.png' },
        { provider_id: 484, provider_name: 'Claro tv+', logo_path: '/olz.png' },
        {
          provider_id: 1796,
          provider_name: 'Netflix Standard with Ads',
          logo_path: '/eGU.png',
        },
        {
          provider_id: 1825,
          provider_name: 'HBO Max Amazon Channel',
          logo_path: '/64f.png',
        },
      ],
    },
  },
}

describe('provedoresDoBrasil', () => {
  test('descarta os servicos fora da nossa lista curada', () => {
    const nomes = provedoresDoBrasil(respostaReal).provedores.map((p) => p.nome)
    expect(nomes).toEqual(['Netflix', 'HBO Max'])
  })

  test('nao repete o mesmo servico vendido em outra embalagem', () => {
    const nomes = provedoresDoBrasil(respostaReal).provedores.map((p) => p.nome)
    expect(nomes.filter((n) => n === 'Netflix')).toHaveLength(1)
    expect(nomes.filter((n) => n === 'HBO Max')).toHaveLength(1)
  })

  test('monta o endereco completo do logo', () => {
    const netflix = provedoresDoBrasil(respostaReal).provedores[0]
    expect(netflix.logoUrl).toBe('https://image.tmdb.org/t/p/w92/rK1.png')
  })

  test('preserva o link oficial do TMDB', () => {
    expect(provedoresDoBrasil(respostaReal).link).toBe(
      'https://www.themoviedb.org/movie/278/watch?locale=BR',
    )
  })

  test('segue a ordem da nossa lista curada, nao a do TMDB', () => {
    const foraDeOrdem: ProvedoresTmdb = {
      results: {
        BR: {
          flatrate: [
            { provider_id: 11, provider_name: 'MUBI', logo_path: '/m.png' },
            { provider_id: 8, provider_name: 'Netflix', logo_path: '/n.png' },
          ],
        },
      },
    }
    const nomes = provedoresDoBrasil(foraDeOrdem).provedores.map((p) => p.nome)
    expect(nomes).toEqual(['Netflix', 'MUBI'])
  })

  test('aguenta filme sem dados do Brasil', () => {
    const resultado = provedoresDoBrasil({ results: {} })
    expect(resultado.provedores).toEqual([])
    expect(resultado.link).toBeNull()
  })

  test('aguenta o bloco inteiro ausente', () => {
    const resultado = provedoresDoBrasil(undefined)
    expect(resultado.provedores).toEqual([])
    expect(resultado.link).toBeNull()
  })

  test('aguenta filme disponivel so para aluguel, sem assinatura', () => {
    const resultado = provedoresDoBrasil({
      results: { BR: { link: 'https://exemplo/watch' } },
    })
    expect(resultado.provedores).toEqual([])
    expect(resultado.link).toBe('https://exemplo/watch')
  })

  test('aguenta provedor sem logo', () => {
    const resultado = provedoresDoBrasil({
      results: {
        BR: {
          flatrate: [
            { provider_id: 8, provider_name: 'Netflix', logo_path: null },
          ],
        },
      },
    })
    expect(resultado.provedores[0].logoUrl).toBeNull()
  })
})
