import { NextResponse, type NextRequest } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/**
 * Sair e um POST, nunca um GET.
 *
 * Se fosse GET, qualquer imagem ou link apontando para /auth/sair deslogaria a
 * pessoa sem ela pedir. Acao que MUDA estado nao pode caber num link.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await criarClienteServidor()
    await supabase.auth.signOut()
  } catch (erro) {
    // Banco fora do ar nao pode impedir a pessoa de sair: registra e segue
    // para o redirecionamento do mesmo jeito.
    console.error('[sair] Falha ao contatar o Supabase:', erro)
  }
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
