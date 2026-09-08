import Link from 'next/link'
import type { FiltrosUrl } from '@/lib/tmdb'

type Opcao = {
  rotulo: string
  valor: string | undefined
  descricao: string
}

const OPCOES: Opcao[] = [
  { rotulo: 'Todas as notas', valor: undefined, descricao: 'Sem filtro de nota' },
  { rotulo: '7+', valor: '7', descricao: 'Nota 7 ou maior' },
  { rotulo: '8+', valor: '8', descricao: 'Nota 8 ou maior' },
  { rotulo: '9+', valor: '9', descricao: 'Nota 9 ou maior' },
]

/**
 * Filtro por nota minima.
 *
 * Nao usa JavaScript no navegador: como os filtros vivem na URL, cada opcao e
 * apenas um link. Isso deixa o link compartilhavel, faz o botao voltar do
 * navegador funcionar e permite que o Google indexe cada combinacao.
 *
 * Por baixo vira o parametro vote_average.gte do TMDB, ja coberto por testes
 * em montarParametrosDescoberta.
 */
export function FiltroNota({ filtros }: { filtros: FiltrosUrl }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-texto-fraco">Nota mínima:</span>

      {OPCOES.map((opcao) => {
        const ativo = filtros.nota === opcao.valor
        return (
          <Link
            key={opcao.rotulo}
            href={montarEndereco(filtros, opcao.valor)}
            aria-label={opcao.descricao}
            aria-current={ativo ? 'true' : undefined}
            className={
              ativo
                ? 'rounded-grande bg-destaque px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-destaque/25'
                : 'rounded-grande bg-superficie px-4 py-2 text-sm text-texto-suave transition-colors hover:bg-superficie-alta hover:text-texto'
            }
          >
            {opcao.rotulo}
          </Link>
        )
      })}
    </div>
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
