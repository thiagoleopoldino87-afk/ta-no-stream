import { SERVICOS } from '../servicos'
import type {
  Filme,
  FilmeDetalhado,
  FilmeDetalhadoTmdb,
  FilmeTmdb,
  OndeAssistir,
  Provedor,
  ProvedoresTmdb,
} from './tipos'

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

/**
 * Extrai os servicos de assinatura disponiveis no Brasil.
 *
 * A resposta do TMDB traz ruido: o mesmo servico aparece varias vezes em
 * embalagens diferentes ("Netflix" e "Netflix Standard with Ads", "HBO Max" e
 * "HBO Max Amazon Channel"), alem de dezenas de provedores de nicho.
 *
 * A limpeza sai de graca ao percorrer a NOSSA lista curada em vez da deles:
 * isso descarta o que nao interessa, elimina as duplicatas, usa os nossos
 * nomes e ainda garante uma ordem estavel — Netflix sempre antes de MUBI,
 * independente de como o TMDB devolveu.
 *
 * O link e o oficial do TMDB. Os termos proibem montar link direto para o
 * streaming, entao esse e o unico destino permitido para o clique final.
 */
export function provedoresDoBrasil(
  bloco: ProvedoresTmdb | undefined,
): OndeAssistir {
  const brasil = bloco?.results?.BR
  const disponiveis = brasil?.flatrate ?? []
  const provedores: Provedor[] = []

  for (const servico of SERVICOS) {
    const cru = disponiveis.find((p) => p.provider_id === servico.id)
    if (!cru) continue

    provedores.push({
      id: servico.id,
      nome: servico.nome,
      logoUrl: urlImagem(cru.logo_path, 'w92'),
    })
  }

  return { provedores, link: brasil?.link ?? null }
}

export function traduzirFilmeDetalhado(
  bruto: FilmeDetalhadoTmdb,
): FilmeDetalhado {
  return {
    ...traduzirFilme(bruto),
    duracaoEmMinutos: bruto.runtime && bruto.runtime > 0 ? bruto.runtime : null,
    generos: (bruto.genres ?? []).map((g) => g.name),
    elenco: (bruto.credits?.cast ?? []).slice(0, 8).map((ator) => ({
      id: ator.id,
      nome: ator.name,
      personagem: ator.character,
    })),
    chaveDoTrailer: escolherTrailer(bruto),
    ondeAssistir: provedoresDoBrasil(bruto['watch/providers']),
  }
}

/** Prefere um video marcado como Trailer; aceita Teaser se nao houver. */
function escolherTrailer(bruto: FilmeDetalhadoTmdb): string | null {
  const videos = (bruto.videos?.results ?? []).filter(
    (v) => v.site === 'YouTube',
  )
  const trailer =
    videos.find((v) => v.type === 'Trailer') ??
    videos.find((v) => v.type === 'Teaser')

  return trailer?.key ?? null
}
