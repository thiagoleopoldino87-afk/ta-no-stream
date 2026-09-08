import { describe, expect, test } from 'vitest'
import {
  anoDeLancamento,
  notaValida,
  traduzirFilme,
  urlImagem,
} from '@/lib/tmdb/traduzir'
import type { FilmeTmdb } from '@/lib/tmdb/tipos'

const filmeCompleto: FilmeTmdb = {
  id: 27205,
  title: 'A Origem',
  overview: 'Um ladrao que invade sonhos.',
  poster_path: '/abc.jpg',
  backdrop_path: '/xyz.jpg',
  release_date: '2010-07-15',
  vote_average: 8.369,
  vote_count: 36000,
}

describe('urlImagem', () => {
  test('monta o endereco completo da imagem', () => {
    expect(urlImagem('/abc.jpg', 'w500')).toBe(
      'https://image.tmdb.org/t/p/w500/abc.jpg',
    )
  })

  test('devolve nulo quando o filme nao tem imagem', () => {
    expect(urlImagem(null, 'w500')).toBeNull()
  })
})

describe('anoDeLancamento', () => {
  test('extrai o ano da data', () => {
    expect(anoDeLancamento('2010-07-15')).toBe(2010)
  })

  test('devolve nulo quando a data esta vazia', () => {
    expect(anoDeLancamento('')).toBeNull()
  })

  test('devolve nulo quando a data nao existe', () => {
    expect(anoDeLancamento(null)).toBeNull()
  })

  test('devolve nulo quando o ano e absurdo', () => {
    expect(anoDeLancamento('0000-00-00')).toBeNull()
  })
})

describe('notaValida', () => {
  test('arredonda para uma casa decimal', () => {
    expect(notaValida(8.369, 36000)).toBe(8.4)
  })

  test('devolve nulo quando ninguem votou', () => {
    expect(notaValida(0, 0)).toBeNull()
  })

  test('devolve nulo quando a media e zero mesmo com votos', () => {
    expect(notaValida(0, 12)).toBeNull()
  })
})

describe('traduzirFilme', () => {
  test('converte um filme completo para o nosso formato', () => {
    expect(traduzirFilme(filmeCompleto)).toEqual({
      id: 27205,
      titulo: 'A Origem',
      ano: 2010,
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/xyz.jpg',
      nota: 8.4,
      sinopse: 'Um ladrao que invade sonhos.',
    })
  })

  test('aguenta um filme sem poster, sem data e sem votos', () => {
    const cru: FilmeTmdb = {
      ...filmeCompleto,
      poster_path: null,
      backdrop_path: null,
      release_date: '',
      vote_average: 0,
      vote_count: 0,
    }
    const filme = traduzirFilme(cru)
    expect(filme.posterUrl).toBeNull()
    expect(filme.backdropUrl).toBeNull()
    expect(filme.ano).toBeNull()
    expect(filme.nota).toBeNull()
    expect(filme.titulo).toBe('A Origem')
  })
})
