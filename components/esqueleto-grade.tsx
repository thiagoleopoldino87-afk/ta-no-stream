/**
 * Retangulos no formato exato dos posters. Nunca deixar tela em branco.
 *
 * As colunas e o espacamento precisam ser IDENTICOS aos de grade-filmes.tsx.
 * Se divergirem, o layout "pula" no instante em que os filmes chegam, e esse
 * salto e mais desagradavel do que a espera em si.
 */
export function EsqueletoGrade() {
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: 21 }, (_, indice) => (
        <li key={indice}>
          <div className="aspect-[2/3] animate-pulse bg-superficie" />
          <div className="mt-2 h-3 w-4/5 animate-pulse bg-superficie" />
          <div className="mt-1 h-3 w-1/2 animate-pulse bg-superficie" />
        </li>
      ))}
    </ul>
  )
}
