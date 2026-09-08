/**
 * Largura maxima do conteudo, definida num lugar so.
 *
 * Sem isso, numa tela de 1920px o texto e a grade correm de borda a borda: o
 * olho precisa varrer a tela inteira e a leitura cansa. Todo produto serio
 * limita a largura util e centraliza. 1600px acomoda sete colunas de posters
 * sem ficar apertado.
 */
export const LARGURA_MAXIMA = 'mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-10'

export function Conteiner({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={`${LARGURA_MAXIMA} ${className}`}>{children}</div>
}
