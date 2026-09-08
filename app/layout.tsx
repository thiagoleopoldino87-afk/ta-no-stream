import type { Metadata } from 'next'
import { Archivo } from 'next/font/google'
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
        <div className="min-h-screen flex flex-col">
          <main className="flex-1">{children}</main>
          <Atribuicao />
        </div>
      </body>
    </html>
  )
}

/**
 * Exigencia contratual do TMDB: sem esta atribuicao eles revogam o acesso.
 * O texto e o link para o JustWatch nao podem ser removidos.
 */
function Atribuicao() {
  return (
    <footer className="border-t border-superficie px-6 py-10 text-cinza">
      <p className="max-w-3xl text-sm leading-relaxed">
        Este aplicativo usa o TMDB e as APIs do TMDB, mas nao e endossado,
        certificado ou aprovado pelo TMDB.
      </p>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed">
        Os dados de disponibilidade nos servicos de streaming sao fornecidos por{' '}
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
    </footer>
  )
}
