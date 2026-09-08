import Link from 'next/link'
import type { FiltrosUrl } from '@/lib/tmdb'

type Opcao = {
  rotulo: string
  valor: string | undefined
  descricao: string
}

const OPCOES: Opcao[] = [
  { rotulo: 'Todas', valor: undefined, descricao: 'Sem filtro de nota' },
  { rotulo: '7', valor: '7', descricao: 'Nota 7 ou maior' },
  { rotulo: '8', valor: '8', descricao: 'Nota 8 ou maior' },
  { rotulo: '9', valor: '9', descricao: 'Nota 9 ou maior' },
]

/**
 * Filtro por nota minima.
 *
 * Nao usa JavaScript no navegador: como os filtros vivem na URL, cada opcao e
 * apenas um link. Isso deixa o endereco compartilhavel, faz o botao voltar do
 * navegador funcionar e permite que o Google indexe cada combinacao.
 *
 * Por baixo vira o parametro vote_average.gte do TMDB, ja coberto por testes
 * em montarParametrosDescoberta.
 *
 * A altura de 44px nao e estetica: e o alvo minimo de toque recomendado para
 * que o dedo acerte o botao no celular sem errar.
 */
export function FiltroNota({ filtros }: { filtros: FiltrosUrl }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm font-medium text-texto-suave">
        Nota mínima
      </span>

      {OPCOES.map((opcao) => {
        const ativo = filtros.nota === opcao.valor

        return (
          <Link
            key={opcao.rotulo}
            href={montarEndereco(filtros, opcao.valor)}
            aria-label={opcao.descricao}
            aria-current={ativo ? 'true' : undefined}
            className={[
              'inline-flex h-11 items-center gap-1.5 rounded-grande px-5 text-sm font-semibold transition-all',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-noite',
              ativo
                ? 'bg-destaque text-white shadow-lg shadow-destaque/30 focus:ring-destaque-suave'
                : 'border border-white/15 bg-white/5 text-texto-suave hover:border-white/30 hover:bg-white/10 hover:text-texto focus:ring-white/40',
            ].join(' ')}
          >
            {opcao.valor && <Estrela ativo={ativo} />}
            {opcao.rotulo}
            {opcao.valor && <span aria-hidden="true">+</span>}
          </Link>
        )
      })}
    </div>
  )
}

function Estrela({ ativo }: { ativo: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-3.5 w-3.5 ${ativo ? 'fill-white' : 'fill-ouro'}`}
      aria-hidden="true"
    >
      <path d="M12 2.5l2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3 1.2-6.5L2.5 9.3l6.6-.9L12 2.5z" />
    </svg>
  )
}

/**
 * Monta o endereco preservando os demais filtros.
 * A pagina e descartada de proposito: ao trocar um filtro, o certo e voltar
 * para a primeira pagina — continuar na pagina 7 de outro resultado confunde.
 */
function montarEndereco(filtros: FiltrosUrl, nota: string | undefined): string {
  const parametros = new URLSearchParams()

  if (filtros.servico) parametros.set('servico', filtros.servico)
  if (filtros.genero) parametros.set('genero', filtros.genero)
  if (filtros.ano) parametros.set('ano', filtros.ano)
  if (nota) parametros.set('nota', nota)

  const consulta = parametros.toString()
  return consulta ? `/?${consulta}` : '/'
}
