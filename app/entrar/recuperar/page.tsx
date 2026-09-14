import { Conteiner } from '@/components/conteiner'
import { FormularioRecuperar } from '@/components/formulario-recuperar'

export const metadata = { title: 'Recuperar senha — ta-no-stream' }

/**
 * Mapa fechado dos codigos de erro que app/auth/callback/route.ts pode
 * mandar por aqui. Preferido a texto cru na URL: nao vaza detalhe interno
 * e mantem a mensagem em portugues num unico lugar.
 */
function mensagemDoErro(codigo: string | undefined): string | undefined {
  if (codigo === 'link-invalido') {
    return 'O link expirou ou já foi usado. Peça um novo abaixo.'
  }
  return undefined
}

export default async function PaginaRecuperar({
  searchParams,
}: {
  searchParams: Promise<{ erro?: string }>
}) {
  const { erro } = await searchParams

  return (
    <Conteiner className="py-20">
      <FormularioRecuperar avisoInicial={mensagemDoErro(erro)} />
    </Conteiner>
  )
}
