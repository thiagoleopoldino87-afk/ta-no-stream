import { Conteiner } from '@/components/conteiner'
import { EsqueletoGrade } from '@/components/esqueleto-grade'

/**
 * O Next.js mostra este arquivo sozinho enquanto page.tsx busca os dados.
 * As medidas imitam as da pagina real para que nada se desloque na troca.
 */
export default function Carregando() {
  return (
    <Conteiner className="py-10">
      <div className="h-8 w-56 animate-pulse bg-superficie sm:h-9" />
      <div className="mt-2 h-4 w-80 max-w-full animate-pulse bg-superficie" />
      <div className="mt-8">
        <EsqueletoGrade />
      </div>
    </Conteiner>
  )
}
