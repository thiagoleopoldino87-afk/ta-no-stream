import type { Filme } from '@/lib/tmdb'
import { CartaoFilme } from './cartao-filme'

/**
 * Densidade da grade.
 *
 * Antes eram 4 colunas fixas, o que numa tela de 1850px dava posters de 440px
 * de largura — grandes demais. Referencias do mercado trabalham com 150 a
 * 230px: Letterboxd usa ~230px, JustWatch ~150px, MUBI ~200px.
 *
 * Com sete colunas dentro dos 1600px do conteiner, cada poster fica com cerca
 * de 200px. O ganho nao e so estetico: num catalogo a pessoa COMPARA opcoes,
 * e comparar exige ver varias ao mesmo tempo.
 *
 * O espacamento vertical e maior que o horizontal de proposito, para que o
 * titulo de um filme nao encoste no poster da linha de baixo.
 */
export function GradeFilmes({ filmes }: { filmes: Filme[] }) {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoFilme filme={filme} />
        </li>
      ))}
    </ul>
  )
}
