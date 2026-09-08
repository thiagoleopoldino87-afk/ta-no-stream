'use client'

import { useRouter } from 'next/navigation'
import { montarEndereco } from '@/lib/enderecos'
import { SERVICOS } from '@/lib/servicos'
import type { FiltrosUrl, Genero } from '@/lib/tmdb'

const ANO_INICIAL = 1970

/**
 * Filtros de servico, genero e ano.
 *
 * Precisa ser 'use client' porque navega quando a pessoa troca a selecao —
 * sem isso ela teria que apertar um botao "aplicar" a cada mudanca.
 *
 * Os filtros continuam vivendo na URL: o componente so monta o endereco novo e
 * pede a navegacao. Quem busca os filmes segue sendo o servidor.
 */
export function BarraFiltros({
  filtros,
  generos,
}: {
  filtros: FiltrosUrl
  generos: Genero[]
}) {
  const router = useRouter()

  function trocar(campo: keyof FiltrosUrl, valor: string) {
    router.push(montarEndereco({ ...filtros, [campo]: valor || undefined }))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Selecao
        rotulo="Serviço"
        valor={filtros.servico ?? ''}
        aoTrocar={(v) => trocar('servico', v)}
        opcoes={[
          { valor: '', rotulo: 'Todos os serviços' },
          ...SERVICOS.map((s) => ({ valor: String(s.id), rotulo: s.nome })),
        ]}
      />

      <Selecao
        rotulo="Gênero"
        valor={filtros.genero ?? ''}
        aoTrocar={(v) => trocar('genero', v)}
        opcoes={[
          { valor: '', rotulo: 'Todos os gêneros' },
          ...generos.map((g) => ({ valor: String(g.id), rotulo: g.nome })),
        ]}
      />

      <Selecao
        rotulo="Ano"
        valor={filtros.ano ?? ''}
        aoTrocar={(v) => trocar('ano', v)}
        opcoes={[
          { valor: '', rotulo: 'Qualquer ano' },
          ...anosDisponiveis().map((a) => ({
            valor: String(a),
            rotulo: String(a),
          })),
        ]}
      />
    </div>
  )
}

function Selecao({
  rotulo,
  valor,
  opcoes,
  aoTrocar,
}: {
  rotulo: string
  valor: string
  opcoes: { valor: string; rotulo: string }[]
  aoTrocar: (valor: string) => void
}) {
  const ativo = valor !== ''

  return (
    <label className="relative">
      <span className="sr-only">{rotulo}</span>

      <select
        value={valor}
        onChange={(evento) => aoTrocar(evento.target.value)}
        className={[
          'h-11 cursor-pointer appearance-none rounded-grande pl-5 pr-10 text-sm font-semibold transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-noite',
          ativo
            ? 'bg-destaque text-white shadow-lg shadow-destaque/30 focus:ring-destaque-suave'
            : 'border border-white/15 bg-white/5 text-texto-suave hover:border-white/30 hover:bg-white/10 hover:text-texto focus:ring-white/40',
        ].join(' ')}
      >
        {opcoes.map((opcao) => (
          /* O fundo escuro e necessario: a lista aberta usa o estilo do sistema */
          <option key={opcao.valor} value={opcao.valor} className="bg-superficie text-texto">
            {opcao.rotulo}
          </option>
        ))}
      </select>

      <Chevron />
    </label>
  )
}

function Chevron() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 stroke-current"
      fill="none"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/** Do ano atual para tras. Filme mais antigo que 1970 e raro no streaming. */
function anosDisponiveis(): number[] {
  const atual = new Date().getFullYear()
  const anos: number[] = []
  for (let ano = atual; ano >= ANO_INICIAL; ano--) anos.push(ano)
  return anos
}
