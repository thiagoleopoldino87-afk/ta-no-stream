/**
 * Retangulos no formato exato dos posters. Nunca deixar tela em branco.
 *
 * As colunas e o espacamento precisam ser IDENTICOS aos de grade-filmes.tsx.
 * Se divergirem, o layout "pula" no instante em que os filmes chegam, e esse
 * salto incomoda mais do que a espera em si.
 */
export function EsqueletoGrade() {
  return (
    <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
      {Array.from({ length: 21 }, (_, indice) => (
        <li key={indice}>
          <div className="aspect-[2/3] animate-pulse rounded-medio bg-superficie" />
          <div className="mt-2.5 h-4 w-4/5 animate-pulse rounded-suave bg-superficie" />
          <div className="mt-1.5 h-3 w-1/3 animate-pulse rounded-suave bg-superficie" />
        </li>
      ))}
    </ul>
  )
}
