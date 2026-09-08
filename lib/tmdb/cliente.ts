const BASE = 'https://api.themoviedb.org/3'

export class ErroTmdb extends Error {
  // Declarado e atribuido separadamente. A forma curta do TypeScript
  // — constructor(public status: number) — gera codigo, e o Node so
  // apaga tipos, sem compilar. Ele recusaria o arquivo.
  status: number

  constructor(status: number) {
    super(`O TMDB respondeu com status ${status}`)
    this.name = 'ErroTmdb'
    this.status = status
  }
}

/**
 * Unico lugar do projeto que fala com a API do TMDB.
 * Roda apenas no servidor: process.env.TMDB_TOKEN nao existe no navegador.
 */
export async function pedirAoTmdb<T>(
  caminho: string,
  parametros: URLSearchParams,
  revalidarEmSegundos: number,
): Promise<T> {
  const token = process.env.TMDB_TOKEN
  if (!token) {
    throw new Error(
      'TMDB_TOKEN nao esta definido. Confira o arquivo .env.local.',
    )
  }

  const resposta = await fetch(`${BASE}${caminho}?${parametros.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    next: { revalidate: revalidarEmSegundos },
  })

  if (!resposta.ok) throw new ErroTmdb(resposta.status)

  return (await resposta.json()) as T
}
