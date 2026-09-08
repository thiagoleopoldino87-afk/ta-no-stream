import type { Metadata } from 'next'
import { Inter, Poppins } from 'next/font/google'
import Image from 'next/image'
import Link from 'next/link'
import { Conteiner } from '@/components/conteiner'
import './globals.css'

/**
 * Duas fontes com papeis distintos.
 * Poppins e geometrica e cheia — funciona bem em titulo grande.
 * Inter foi desenhada para texto de interface em tamanho pequeno.
 */
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--fonte-poppins',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--fonte-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'ta-no-stream',
  description:
    'Descubra em quais servicos de streaming assistir cada filme no Brasil.',
}

export default function LayoutRaiz({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`${poppins.variable} ${inter.variable}`}>
      <body className="antialiased">
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
 * Barra do topo, semitransparente com desfoque: o conteudo passa por tras
 * ao rolar, em vez de sumir atras de um bloco solido.
 */
function Cabecalho() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-noite/70 backdrop-blur-md">
      <Conteiner className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="titulo text-xl text-texto transition-opacity hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-destaque focus:ring-offset-2 focus:ring-offset-noite"
        >
          tá no <span className="text-destaque">stream</span>
        </Link>

        <p className="hidden text-sm text-texto-suave sm:block">
          O que assistir hoje, por assinatura, no Brasil
        </p>
      </Conteiner>
    </header>
  )
}

/**
 * Exigencia contratual do TMDB: sem esta atribuicao eles revogam o acesso.
 * O logo, o texto e o credito ao JustWatch nao podem ser removidos.
 *
 * A regra deles pede que o logo apareca de forma MENOS proeminente que a marca
 * do proprio aplicativo — dai o tamanho reduzido aqui no rodape.
 */
function Atribuicao() {
  return (
    <footer className="mt-24 border-t border-white/5 py-10">
      <Conteiner>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer"
          className="mb-5 inline-block opacity-70 transition-opacity hover:opacity-100"
        >
          <Image
            src="/tmdb.svg"
            alt="The Movie Database"
            width={110}
            height={15}
          />
        </a>

        <p className="max-w-2xl text-xs leading-relaxed text-texto-fraco">
          Este aplicativo usa o TMDB e as APIs do TMDB, mas não é endossado,
          certificado ou aprovado pelo TMDB.
        </p>
        <p className="mt-3 max-w-2xl text-xs leading-relaxed text-texto-fraco">
          Os dados de disponibilidade nos serviços de streaming são fornecidos
          por{' '}
          <a
            href="https://www.justwatch.com"
            target="_blank"
            rel="noreferrer"
            className="text-texto-suave underline underline-offset-4 hover:text-texto"
          >
            JustWatch
          </a>
          .
        </p>
      </Conteiner>
    </footer>
  )
}
