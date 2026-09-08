/** O formato cru que o TMDB devolve. So usado dentro de lib/tmdb. */
export type FilmeTmdb = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
}

export type RespostaDescoberta = {
  page: number
  results: FilmeTmdb[]
  total_pages: number
  total_results: number
}

/** O nosso formato. E o unico que sai de lib/tmdb para as telas. */
export type Filme = {
  id: number
  titulo: string
  ano: number | null
  posterUrl: string | null
  backdropUrl: string | null
  nota: number | null
  sinopse: string
}

export type PaginaDeFilmes = {
  filmes: Filme[]
  pagina: number
  totalDePaginas: number
}
