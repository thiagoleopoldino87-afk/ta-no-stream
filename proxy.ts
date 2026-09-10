import { type NextRequest } from 'next/server'
import { atualizarSessao } from '@/lib/supabase/sessao'

export async function proxy(request: NextRequest) {
  return await atualizarSessao(request)
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, menos nos caminhos abaixo — arquivos estaticos e imagens
     * nao precisam de sessao, e rodar neles so desperdicaria processamento.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
