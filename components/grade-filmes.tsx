import type { Filme } from '@/lib/tmdb'
import { CartaoFilme } from './cartao-filme'

export function GradeFilmes({ filmes }: { filmes: Filme[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoFilme filme={filme} />
        </li>
      ))}
    </ul>
  )
}
