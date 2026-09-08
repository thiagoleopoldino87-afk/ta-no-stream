import Image from 'next/image'
import type { OndeAssistir as DadosOndeAssistir } from '@/lib/tmdb'

/**
 * Mostra em quais servicos o filme esta incluido na assinatura.
 *
 * Os termos do TMDB proibem montar link direto para o streaming, e a API nem
 * fornece essa informacao. Mas eles ENTREGAM nome e logo de cada servico
 * exatamente para serem exibidos — "informacao suficiente para mostrar o que
 * esta disponivel onde". Entao a marca aparece aqui, e so o clique final vai
 * para a pagina oficial deles.
 *
 * E melhor tambem para quem usa: da para saber se vale clicar antes de sair
 * do app.
 */
export function OndeAssistir({
  dados,
  tamanho = 'normal',
}: {
  dados: DadosOndeAssistir
  tamanho?: 'normal' | 'compacto'
}) {
  const compacto = tamanho === 'compacto'

  if (dados.provedores.length === 0) {
    return (
      <p className="text-sm text-texto-fraco">
        Não está incluído em nenhuma assinatura no Brasil no momento.
      </p>
    )
  }

  return (
    <div>
      <p
        className={`font-semibold text-texto-suave ${compacto ? 'text-xs' : 'text-sm'}`}
      >
        Incluído na assinatura de
      </p>

      <ul className="mt-2.5 flex flex-wrap items-center gap-2.5">
        {dados.provedores.map((provedor) => (
          <li key={provedor.id}>
            <div
              className={`flex items-center gap-2 rounded-medio border border-white/10 bg-white/5 pr-3 ${compacto ? 'py-1 pl-1' : 'py-1.5 pl-1.5'}`}
            >
              {provedor.logoUrl ? (
                <Image
                  src={provedor.logoUrl}
                  alt=""
                  width={compacto ? 28 : 34}
                  height={compacto ? 28 : 34}
                  className="rounded-suave"
                />
              ) : (
                <span
                  className={`flex items-center justify-center rounded-suave bg-superficie-alta ${compacto ? 'h-7 w-7' : 'h-[34px] w-[34px]'}`}
                  aria-hidden="true"
                />
              )}
              <span
                className={`font-medium text-texto ${compacto ? 'text-xs' : 'text-sm'}`}
              >
                {provedor.nome}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
