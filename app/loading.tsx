import { EsqueletoGrade } from '@/components/esqueleto-grade'

export default function Carregando() {
  return (
    <div className="px-6 py-10 md:px-10">
      <div className="h-12 w-64 animate-pulse bg-superficie" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse bg-superficie" />
      <div className="mt-10">
        <EsqueletoGrade />
      </div>
    </div>
  )
}
