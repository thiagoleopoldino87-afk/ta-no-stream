import Link from 'next/link'
import { usuarioAtual } from '@/lib/auth/usuario'

export async function MenuUsuario() {
  const usuario = await usuarioAtual()

  if (!usuario) {
    return (
      <Link
        href="/entrar"
        className="rounded-grande bg-destaque px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte"
      >
        Entrar
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-3">
      <span
        className="hidden max-w-[180px] truncate text-sm text-texto-suave sm:block"
        title={usuario.email}
      >
        {usuario.email}
      </span>
      <form action="/auth/sair" method="post">
        <button
          type="submit"
          className="rounded-grande border border-white/15 px-4 py-2 text-sm text-texto-suave transition-colors hover:bg-white/10 hover:text-texto"
        >
          Sair
        </button>
      </form>
    </div>
  )
}
