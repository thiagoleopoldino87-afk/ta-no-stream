import type { Filme } from '@/lib/tmdb'
import { CartaoFilme } from './cartao-filme'

/**
 * Densidade da grade.
 *
 * Referencias do mercado trabalham com posters de 150 a 230px: Letterboxd usa
 * ~230px, JustWatch ~150px, MUBI ~200px. Com sete colunas dentro dos 1600px do
 * conteiner, cada poster fica com cerca de 200px.
 *
 * O ganho nao e so estetico: num catalogo a pessoa COMPARA opcoes, e comparar
 * exige ver varias ao mesmo tempo.
 *
 * O espacamento vertical e maior que o horizontal porque o cartao sobe um
 * pouco no hover e projeta sombra — sem folga, ele encosta na linha de baixo.
 */
export function GradeFilmes({ filmes }: { filmes: Filme[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoFilme filme={filme} />
        </li>
      ))}
    </ul>
  )
}
