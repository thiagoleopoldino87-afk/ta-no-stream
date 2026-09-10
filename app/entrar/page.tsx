import { Conteiner } from '@/components/conteiner'
import { FormularioEntrar } from '@/components/formulario-entrar'

export const metadata = { title: 'Entrar — ta-no-stream' }

export default function PaginaEntrar() {
  return (
    <Conteiner className="py-20">
      <FormularioEntrar />
    </Conteiner>
  )
}
