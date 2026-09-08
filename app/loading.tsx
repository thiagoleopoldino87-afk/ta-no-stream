import { Conteiner } from '@/components/conteiner'
import { EsqueletoGrade } from '@/components/esqueleto-grade'

/**
 * O Next.js mostra este arquivo sozinho enquanto page.tsx busca os dados.
 * As medidas imitam as da pagina real para que nada se desloque na troca.
 */
export default function Carregando() {
  return (
    <>
      <div className="min-h-[420px] w-full animate-pulse bg-superficie/40 sm:min-h-[520px] lg:min-h-[600px]" />

      <Conteiner className="pt-4">
        <div className="h-8 w-64 animate-pulse rounded-suave bg-superficie sm:h-9" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-suave bg-superficie" />

        <div className="mt-6 flex gap-2">
          {Array.from({ length: 4 }, (_, indice) => (
            <div
              key={indice}
              className="h-9 w-24 animate-pulse rounded-grande bg-superficie"
            />
          ))}
        </div>

        <div className="mt-8">
          <EsqueletoGrade />
        </div>
      </Conteiner>
    </>
  )
}
