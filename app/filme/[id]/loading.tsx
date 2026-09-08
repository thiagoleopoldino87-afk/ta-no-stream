import { Conteiner } from '@/components/conteiner'

/** Imita as medidas da ficha real para que nada se desloque na troca. */
export default function CarregandoFilme() {
  return (
    <div>
      <div className="h-[38vh] min-h-[260px] w-full animate-pulse bg-superficie/40 sm:h-[48vh]" />

      <Conteiner className="relative -mt-24 pb-8 sm:-mt-32">
        <div className="flex flex-col gap-8 sm:flex-row sm:gap-10">
          <div className="aspect-[2/3] w-40 shrink-0 animate-pulse rounded-grande bg-superficie sm:w-56 lg:w-64" />

          <div className="flex-1 pt-2 sm:pt-28">
            <div className="h-10 w-3/4 animate-pulse rounded-suave bg-superficie sm:h-12" />
            <div className="mt-4 h-4 w-56 animate-pulse rounded-suave bg-superficie" />
            <div className="mt-5 flex gap-2">
              <div className="h-7 w-20 animate-pulse rounded-grande bg-superficie" />
              <div className="h-7 w-24 animate-pulse rounded-grande bg-superficie" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-4 w-full max-w-2xl animate-pulse rounded-suave bg-superficie" />
              <div className="h-4 w-full max-w-xl animate-pulse rounded-suave bg-superficie" />
              <div className="h-4 w-2/3 max-w-md animate-pulse rounded-suave bg-superficie" />
            </div>
            <div className="mt-8 h-12 w-44 animate-pulse rounded-medio bg-superficie" />
          </div>
        </div>
      </Conteiner>
    </div>
  )
}
