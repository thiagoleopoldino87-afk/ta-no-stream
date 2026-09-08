/** Retangulos no formato exato dos posters. Nunca deixar tela em branco. */
export function EsqueletoGrade() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {Array.from({ length: 12 }, (_, indice) => (
        <li key={indice}>
          <div className="aspect-[2/3] animate-pulse bg-superficie" />
          <div className="mt-2 h-4 w-3/4 animate-pulse bg-superficie" />
          <div className="mt-1 h-3 w-1/2 animate-pulse bg-superficie" />
        </li>
      ))}
    </ul>
  )
}
