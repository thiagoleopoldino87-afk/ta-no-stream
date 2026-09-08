import { Conteiner } from '@/components/conteiner'
import { EsqueletoGrade } from '@/components/esqueleto-grade'

/**
 * O Next.js mostra este arquivo sozinho enquanto page.tsx busca os dados.
 * As medidas imitam as da pagina real para que nada se desloque na troca.
 */
export default function Carregando() {
  return (
    <>
      <div className="min-h-[460px] w-full animate-pulse bg-superficie/40 sm:min-h-[560px] lg:min-h-[640px]" />

      <Conteiner className="pt-6">
        <div className="h-8 w-56 animate-pulse rounded-suave bg-superficie sm:h-9" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded-suave bg-superficie" />

        <div className="mt-6 space-y-3">
          <div className="flex gap-2">
            {[168, 176, 140].map((largura) => (
              <div
                key={largura}
                style={{ width: largura }}
                className="h-11 animate-pulse rounded-grande bg-superficie"
              />
            ))}
          </div>
          <div className="flex gap-2">
            {[104, 80, 80, 80].map((largura, indice) => (
              <div
                key={indice}
                style={{ width: largura }}
                className="h-11 animate-pulse rounded-grande bg-superficie"
              />
            ))}
          </div>
        </div>

        <div className="mt-8">
          <EsqueletoGrade />
        </div>
      </Conteiner>
    </>
  )
}
