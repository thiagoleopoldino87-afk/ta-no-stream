import type { Filme, FilmeTmdb } from './tipos'

const BASE_IMAGEM = 'https://image.tmdb.org/t/p'

export function urlImagem(caminho: string | null, tamanho: string): string | null {
  if (!caminho) return null
  return `${BASE_IMAGEM}/${tamanho}${caminho}`
}

export function anoDeLancamento(data: string | null | undefined): number | null {
  if (!data) return null
  const ano = Number(data.slice(0, 4))
  if (!Number.isFinite(ano) || ano < 1870) return null
  return ano
}

export function notaValida(media: number, votos: number): number | null {
  if (votos === 0) return null
  if (media <= 0) return null
  return Math.round(media * 10) / 10
}

export function traduzirFilme(bruto: FilmeTmdb): Filme {
  return {
    id: bruto.id,
    titulo: bruto.title,
    ano: anoDeLancamento(bruto.release_date),
    posterUrl: urlImagem(bruto.poster_path, 'w500'),
    backdropUrl: urlImagem(bruto.backdrop_path, 'w1280'),
    nota: notaValida(bruto.vote_average, bruto.vote_count),
    sinopse: bruto.overview,
  }
}
