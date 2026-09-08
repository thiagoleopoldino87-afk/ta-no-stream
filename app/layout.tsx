import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
import Link from 'next/link'
import { Conteiner } from '@/components/conteiner'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--fonte-archivo',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ta-no-stream',
  description:
    'Catalogo dos filmes disponiveis nos servicos de streaming no Brasil.',
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={archivo.variable}>
      <body className="bg-abismo text-branco font-display antialiased">
        <div className="flex min-h-screen flex-col">
          <Cabecalho />
          <main className="flex-1">{children}</main>
          <Atribuicao />
        </div>
      </body>
    </html>
  )
}

/**
 * Barra fixa no topo.
 *
 * A marca fica PEQUENA de proposito. Quem abre o app quer ver filmes, nao ler
 * o nome do app — o protagonismo pertence ao conteudo. O espacamento largo
 * entre letras da presenca sem exigir tamanho.
 *
 * O lado direito esta reservado para a busca e os filtros do Plano 2.
 */
function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-superficie bg-abismo">
      <Conteiner className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="text-sm uppercase tracking-[0.25em] text-branco focus:outline-none focus:ring-2 focus:ring-branco sm:text-base"
        >
          ta-no-stream
        </Link>
        <p className="hidden text-xs uppercase tracking-[0.15em] text-cinza sm:block">
          Filmes por assinatura no Brasil
        </p>
      </Conteiner>
    </header>
  )
}

/**
 * Exigencia contratual do TMDB: sem esta atribuicao eles revogam o acesso.
 * O texto e o link para o JustWatch nao podem ser removidos.
 */
function Atribuicao() {
  return (
    <footer className="mt-24 border-t border-superficie py-10">
      <Conteiner>
        <p className="max-w-2xl text-xs leading-relaxed text-cinza">
          Este aplicativo usa o TMDB e as APIs do TMDB, mas nao e endossado,
          certificado ou aprovado pelo TMDB.
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-cinza">
          Os dados de disponibilidade nos servicos de streaming sao fornecidos
          por{' '}
          <a
            href="https://www.justwatch.com"
            target="_blank"
            rel="noreferrer"
            className="text-branco underline underline-offset-4"
          >
            JustWatch
          </a>
          .
        </p>
      </Conteiner>
    </footer>
  )
}
