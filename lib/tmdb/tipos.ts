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

export type Genero = {
  id: number
  nome: string
}

export type RespostaGeneros = {
  genres: { id: number; name: string }[]
}

/** Um servico de streaming como o TMDB devolve. */
export type ProvedorTmdb = {
  provider_id: number
  provider_name: string
  logo_path: string | null
}

/** O bloco watch/providers de um filme, ja recortado para o Brasil. */
export type ProvedoresTmdb = {
  results?: {
    BR?: {
      link?: string
      flatrate?: ProvedorTmdb[]
    }
  }
}

export type FilmeDetalhadoTmdb = FilmeTmdb & {
  runtime: number | null
  genres: { id: number; name: string }[]
  credits?: {
    cast?: { id: number; name: string; character: string }[]
  }
  videos?: {
    results?: { key: string; site: string; type: string; name: string }[]
  }
  'watch/providers'?: ProvedoresTmdb
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

/** Onde assistir: nome, logo e o link oficial do TMDB. */
export type Provedor = {
  id: number
  nome: string
  logoUrl: string | null
}

export type OndeAssistir = {
  provedores: Provedor[]
  /** Link da pagina de watch do TMDB. Unico destino permitido pelos termos. */
  link: string | null
}

export type FilmeDetalhado = Filme & {
  duracaoEmMinutos: number | null
  generos: string[]
  elenco: { id: number; nome: string; personagem: string }[]
  chaveDoTrailer: string | null
  ondeAssistir: OndeAssistir
}

export type PaginaDeFilmes = {
  filmes: Filme[]
  pagina: number
  totalDePaginas: number
}
