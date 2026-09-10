# Plano 2 — Autenticação

> **Para agentes executores:** SUB-HABILIDADE OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa a tarefa. Os passos usam caixas (`- [ ]`).

**Objetivo:** Permitir criar conta, entrar e sair do `ta-no-stream`, sem alterar em nada o catálogo público que já funciona.

**Arquitetura:** Supabase Auth com `@supabase/ssr`. A sessão vive em cookies, renovada a cada requisição por `proxy.ts`. Server Actions cuidam de cadastro, login e saída — o navegador nunca fala diretamente com a autenticação.

**Stack:** Next.js 16.3.4 · TypeScript · Tailwind v4 · Vitest · Supabase

**Spec:** `docs/superpowers/specs/2026-09-09-contas-e-marcacoes-design.md`

**Não cobre:** marcações, abas e botões de marcar — são o Plano 3. Login com Google e SMTP próprio estão adiados (seção 3 da spec).

## Restrições globais

- **O catálogo público NÃO PODE QUEBRAR.** Ele está no ar em https://ta-no-stream.vercel.app e não depende do Supabase. Ao fim de cada tarefa, `/` deve continuar carregando filmes mesmo com o banco fora do ar
- **Arquivo é `proxy.ts`, não `middleware.ts`** — o `middleware.js` foi descontinuado no Next.js 16 e renomeado
- **Sempre `supabase.auth.getClaims()`**, nunca `getSession()` em código de servidor: só o primeiro valida a assinatura do token
- **Nunca usar `service_role`** em lugar nenhum do projeto
- Toda a interface em **português do Brasil**
- **Nomes de arquivo e de função em português**, seguindo o padrão de `lib/tmdb/`
- Mensagens de commit em português, sem acentos
- Projeto do app: `xifbruxdptxnptabvwpb` · Projeto de testes: `lnsozvcdtgqhtnnrkulq`

## Estrutura de arquivos ao final

```
ta-no-stream/
├── proxy.ts                          renova a sessao a cada requisicao
├── lib/
│   ├── supabase/
│   │   ├── navegador.ts              cliente para o navegador
│   │   ├── servidor.ts               cliente para Server Components e Actions
│   │   └── sessao.ts                 atualizarSessao() usada pelo proxy
│   └── auth/
│       ├── validacao.ts              regras de e-mail e senha      [TESTADO]
│       └── usuario.ts                quem esta logado agora
├── app/
│   ├── entrar/
│   │   ├── page.tsx                  tela de entrar e criar conta
│   │   ├── acoes.ts                  Server Actions
│   │   └── recuperar/page.tsx        pedir link de redefinicao
│   └── auth/
│       ├── sair/route.ts             encerrar sessao
│       └── redefinir/page.tsx        definir a nova senha
├── components/
│   ├── formulario-entrar.tsx         formulario (componente de cliente)
│   └── menu-usuario.tsx              estado da sessao no cabecalho
└── testes/
    ├── validacao.test.ts
    └── rls.test.ts                   prova que um usuario nao le o outro
```

---

## Tarefa 1: A camada de sessão

**Arquivos:**
- Criar: `lib/supabase/navegador.ts`, `lib/supabase/servidor.ts`, `lib/supabase/sessao.ts`, `proxy.ts`
- Modificar: `package.json` (duas dependências), `.env.example`

**Interfaces:**
- Consome: as variáveis `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, já no `.env.local`
- Produz:
  - `criarClienteNavegador(): SupabaseClient`
  - `criarClienteServidor(): Promise<SupabaseClient>`
  - `atualizarSessao(request: NextRequest): Promise<NextResponse>`

- [ ] **Passo 1: Instalar as dependências**

```bash
cd "C:\Users\tuani\StudioProjects\ta-no-stream"
npm install @supabase/supabase-js @supabase/ssr
```

- [ ] **Passo 2: Cliente do navegador**

```ts
// lib/supabase/navegador.ts
import { createBrowserClient } from '@supabase/ssr'

/**
 * Cliente para codigo que roda no navegador.
 * createBrowserClient ja usa padrao singleton internamente: chamar esta funcao
 * varias vezes nao cria varias conexoes.
 */
export function criarClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  )
}
```

- [ ] **Passo 3: Cliente do servidor**

```ts
// lib/supabase/servidor.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Cliente para Server Components, Server Actions e Route Handlers.
 *
 * Precisa ser criado a CADA requisicao: ele carrega os cookies daquela
 * requisicao especifica. Reaproveitar um cliente entre requisicoes misturaria
 * a sessao de uma pessoa com a de outra.
 */
export async function criarClienteServidor() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Components nao podem escrever cookies. Ignorar aqui e
            // correto: quem grava de verdade e o proxy.ts, a cada requisicao.
          }
        },
      },
    },
  )
}
```

- [ ] **Passo 4: A renovação de sessão**

**Este arquivo é adaptado do exemplo oficial do Supabase, com UMA mudança
crítica.** O exemplo deles redireciona todo visitante sem conta para `/login`.
No nosso app isso destruiria o catálogo público — a primeira decisão da spec.
O bloco de redirecionamento foi **removido de propósito**.

```ts
// lib/supabase/sessao.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Renova o token de autenticacao a cada requisicao e repassa os cookies
 * atualizados tanto para o servidor quanto para o navegador.
 *
 * Existe porque Server Components nao conseguem ESCREVER cookies: alguem
 * precisa renovar a sessao antes da pagina rodar.
 *
 * DIFERENCA PROPOSITAL em relacao ao exemplo oficial do Supabase: la existe um
 * bloco que redireciona quem nao tem conta para /login. Aqui ele NAO existe.
 * O catalogo do ta-no-stream e publico por decisao de produto; redirecionar
 * visitantes anonimos quebraria o app inteiro.
 */
export async function atualizarSessao(request: NextRequest) {
  let respostaSupabase = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          respostaSupabase = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            respostaSupabase.cookies.set(name, value, options),
          )
          // Cabecalhos de cache: impedem que uma CDN guarde a resposta e
          // entregue a sessao de uma pessoa para outra.
          Object.entries(headers).forEach(([chave, valor]) =>
            respostaSupabase.headers.set(chave, valor),
          )
        },
      },
    },
  )

  // Nao inserir codigo entre createServerClient e getClaims(). Um engano aqui
  // causa usuarios sendo deslogados aleatoriamente, e e dificil de diagnosticar.
  await supabase.auth.getClaims()

  // Devolver ESTE objeto, sem substitui-lo: ele carrega os cookies renovados.
  return respostaSupabase
}
```

- [ ] **Passo 5: Ligar o proxy**

```ts
// proxy.ts  (na raiz do projeto, ao lado de next.config.ts)
import { type NextRequest } from 'next/server'
import { atualizarSessao } from '@/lib/supabase/sessao'

export async function proxy(request: NextRequest) {
  return await atualizarSessao(request)
}

export const config = {
  matcher: [
    /*
     * Roda em tudo, menos nos caminhos abaixo — arquivos estaticos e imagens
     * nao precisam de sessao, e rodar neles so desperdicaria processamento.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

- [ ] **Passo 6: Documentar as variáveis novas**

```
# .env.example
TMDB_TOKEN=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_TESTES_URL=
SUPABASE_TESTES_KEY=
```

- [ ] **Passo 7: Verificar que o catálogo NÃO quebrou**

O risco desta tarefa é justamente esse: o proxy passa a interceptar toda
requisição, e um erro nele derruba o site inteiro.

```bash
npm run dev
```

Abra `http://localhost:3000`. Esperado: **os filmes continuam aparecendo
normalmente**, sem redirecionamento e sem erro. Abra também `/filme/278` — a
ficha deve carregar. Encerre com `Ctrl+C`.

- [ ] **Passo 8: Verificações completas**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: 37 testes passando, sem erro de tipo, sem aviso de lint, build conclui.

- [ ] **Passo 9: Commit**

```bash
git add -A
git commit -m "Adiciona a camada de sessao do Supabase"
```

---

## Tarefa 2: Validação do formulário (TDD)

**Arquivos:**
- Criar: `lib/auth/validacao.ts`, `testes/validacao.test.ts`

**Interfaces:**
- Consome: nada
- Produz:
  - `validarEmail(email: string): string | null` — devolve a mensagem de erro, ou `null` se estiver válido
  - `validarSenha(senha: string): string | null`
  - `SENHA_MINIMA: number` (valor `6`)

- [ ] **Passo 1: Escrever os testes que falham**

```ts
// testes/validacao.test.ts
import { describe, expect, test } from 'vitest'
import { validarEmail, validarSenha } from '@/lib/auth/validacao'

describe('validarEmail', () => {
  test('aceita um e-mail comum', () => {
    expect(validarEmail('thiago@exemplo.com')).toBeNull()
  })

  test('aceita e-mail com ponto e sinal de mais', () => {
    expect(validarEmail('thiago.leo+teste@exemplo.com.br')).toBeNull()
  })

  test('recusa campo vazio', () => {
    expect(validarEmail('')).toBe('Informe seu e-mail.')
  })

  test('recusa e-mail sem arroba', () => {
    expect(validarEmail('thiagoexemplo.com')).toBe('E-mail invalido.')
  })

  test('recusa e-mail sem dominio', () => {
    expect(validarEmail('thiago@')).toBe('E-mail invalido.')
  })

  test('recusa e-mail com espaco', () => {
    expect(validarEmail('thi ago@exemplo.com')).toBe('E-mail invalido.')
  })

  test('ignora espacos em volta', () => {
    expect(validarEmail('  thiago@exemplo.com  ')).toBeNull()
  })
})

describe('validarSenha', () => {
  test('aceita senha com seis caracteres', () => {
    expect(validarSenha('abc123')).toBeNull()
  })

  test('recusa campo vazio', () => {
    expect(validarSenha('')).toBe('Informe uma senha.')
  })

  test('recusa senha curta demais', () => {
    expect(validarSenha('abc12')).toBe('A senha precisa ter ao menos 6 caracteres.')
  })

  test('nao remove espacos da senha', () => {
    // Espaco e um caractere valido em senha. "abc 12" tem 6 e deve passar.
    expect(validarSenha('abc 12')).toBeNull()
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com módulo `lib/auth/validacao` não encontrado. **É o resultado
certo** — um teste que passa antes do código existir está testando outra coisa.

- [ ] **Passo 3: Implementar**

```ts
// lib/auth/validacao.ts

/** Minimo que o Supabase aceita por padrao. */
export const SENHA_MINIMA = 6

/*
 * Validacao de e-mail proposital e simples: tem texto, um arroba, texto, um
 * ponto e texto, sem espacos. Nao existe expressao regular que valide e-mail
 * corretamente — a especificacao permite coisas absurdas. Quem valida de
 * verdade e o servidor, ao tentar usar. Aqui o objetivo e so evitar que a
 * pessoa perca tempo enviando um erro obvio de digitacao.
 */
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validarEmail(email: string): string | null {
  const limpo = email.trim()
  if (limpo === '') return 'Informe seu e-mail.'
  if (!FORMATO_EMAIL.test(limpo)) return 'E-mail invalido.'
  return null
}

export function validarSenha(senha: string): string | null {
  // Sem trim: espaco e um caractere legitimo dentro de uma senha.
  if (senha === '') return 'Informe uma senha.'
  if (senha.length < SENHA_MINIMA) {
    return `A senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`
  }
  return null
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: `48 passed` (11 novos + os 37 que já existiam).

- [ ] **Passo 5: Commit**

```bash
git add lib/auth/validacao.ts testes/validacao.test.ts
git commit -m "Adiciona validacao de e-mail e senha com testes"
```

---

## Tarefa 3: Tela de entrar e criar conta

**Arquivos:**
- Criar: `lib/auth/tipos.ts`, `app/entrar/page.tsx`, `app/entrar/acoes.ts`, `components/formulario-entrar.tsx`

**Interfaces:**
- Consome: `criarClienteServidor` (Tarefa 1), `validarEmail`/`validarSenha` (Tarefa 2), `Conteiner` de `components/conteiner`
- Produz:
  - `type EstadoAuth = { erro?: string }` — em `lib/auth/tipos.ts`
  - `entrar(anterior: EstadoAuth, dados: FormData): Promise<EstadoAuth>`
  - `criarConta(anterior: EstadoAuth, dados: FormData): Promise<EstadoAuth>`

- [ ] **Passo 1: O tipo compartilhado, num arquivo neutro**

Precisa ficar fora do arquivo de ações: o Next.js exige que um arquivo marcado
com `'use server'` exporte **apenas funções assíncronas**. Tipos somem na
compilação e provavelmente passariam, mas depender disso é frágil.

```ts
// lib/auth/tipos.ts

/** O que uma Server Action de autenticacao devolve para o formulario. */
export type EstadoAuth = { erro?: string }
```

- [ ] **Passo 2: As Server Actions**

```ts
// app/entrar/acoes.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { validarEmail, validarSenha } from '@/lib/auth/validacao'
import type { EstadoAuth } from '@/lib/auth/tipos'
import { criarClienteServidor } from '@/lib/supabase/servidor'

function lerCampos(dados: FormData) {
  return {
    email: String(dados.get('email') ?? '').trim(),
    senha: String(dados.get('senha') ?? ''),
  }
}

export async function entrar(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(dados)

  const erroDeFormato = validarEmail(email) ?? validarSenha(senha)
  if (erroDeFormato) return { erro: erroDeFormato }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha })

  if (error) {
    /*
     * A MESMA mensagem para senha errada e para e-mail inexistente, de
     * proposito. Distinguir permitiria testar enderecos e descobrir quem tem
     * conta no site — chamam isso de enumeracao de usuarios.
     */
    return { erro: 'E-mail ou senha incorretos.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function criarConta(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const { email, senha } = lerCampos(dados)

  const erroDeFormato = validarEmail(email) ?? validarSenha(senha)
  if (erroDeFormato) return { erro: erroDeFormato }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.signUp({ email, password: senha })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { erro: 'Esse e-mail ja tem conta. Tente entrar.' }
    }
    return { erro: 'Nao conseguimos criar sua conta. Tente de novo.' }
  }

  // Como a confirmacao de e-mail esta desligada no projeto, o cadastro ja
  // deixa a pessoa logada. Ver secao 4 da spec.
  revalidatePath('/', 'layout')
  redirect('/')
}
```

**Detalhe que quebra silenciosamente:** `redirect()` funciona lançando uma
exceção que o Next captura. Ele **nunca** pode ficar dentro de um `try/catch`,
senão o `catch` engole o redirecionamento e a página trava.

- [ ] **Passo 3: O formulário**

```tsx
// components/formulario-entrar.tsx
'use client'

import { useActionState, useState } from 'react'
import { criarConta, entrar } from '@/app/entrar/acoes'
import type { EstadoAuth } from '@/lib/auth/tipos'

const INICIAL: EstadoAuth = {}

export function FormularioEntrar() {
  const [modoCadastro, setModoCadastro] = useState(false)
  const acao = modoCadastro ? criarConta : entrar
  const [estado, enviar, enviando] = useActionState(acao, INICIAL)

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="titulo text-3xl">
        {modoCadastro ? 'Criar conta' : 'Entrar'}
      </h1>
      <p className="mt-2 text-sm text-texto-suave">
        {modoCadastro
          ? 'Sua conta guarda o que você quer ver e o que já viu.'
          : 'Entre para acessar suas listas.'}
      </p>

      <form action={enviar} className="mt-8 space-y-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-sm text-texto-suave">
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
          />
        </div>

        <div>
          <label htmlFor="senha" className="mb-1.5 block text-sm text-texto-suave">
            Senha
          </label>
          <input
            id="senha"
            name="senha"
            type="password"
            /* Diz ao gerenciador de senhas se e senha nova ou existente */
            autoComplete={modoCadastro ? 'new-password' : 'current-password'}
            required
            minLength={6}
            className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
          />
        </div>

        {estado.erro && (
          <p
            role="alert"
            className="rounded-medio border border-destaque/40 bg-destaque/10 px-4 py-3 text-sm text-destaque-suave"
          >
            {estado.erro}
          </p>
        )}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-grande bg-destaque px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte disabled:opacity-60"
        >
          {enviando ? 'Aguarde...' : modoCadastro ? 'Criar conta' : 'Entrar'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => setModoCadastro((v) => !v)}
        className="mt-6 text-sm text-texto-suave underline underline-offset-4 hover:text-texto"
      >
        {modoCadastro ? 'Já tenho conta' : 'Criar uma conta'}
      </button>

      {!modoCadastro && (
        <a
          href="/entrar/recuperar"
          className="mt-3 block text-sm text-texto-fraco underline underline-offset-4 hover:text-texto-suave"
        >
          Esqueci minha senha
        </a>
      )}
    </div>
  )
}
```

- [ ] **Passo 4: A página**

```tsx
// app/entrar/page.tsx
import { Conteiner } from '@/components/conteiner'
import { FormularioEntrar } from '@/components/formulario-entrar'

export const metadata = { title: 'Entrar — ta-no-stream' }

export default function PaginaEntrar() {
  return (
    <Conteiner className="py-20">
      <FormularioEntrar />
    </Conteiner>
  )
}
```

- [ ] **Passo 5: Testar de verdade**

```bash
npm run dev
```

1. Abra `http://localhost:3000/entrar`
2. Clique em **"Criar uma conta"**
3. Use um e-mail real seu e uma senha de 6+ caracteres
4. Esperado: volta para `/` **já logado**

Confira no painel do Supabase, em **Authentication → Users**: seu e-mail deve
estar na lista.

Teste também os erros: senha de 3 caracteres deve mostrar aviso sem chamar o
servidor; e-mail repetido deve dizer que já tem conta.

- [ ] **Passo 6: Verificações e commit**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
git add -A
git commit -m "Adiciona tela de entrar e criar conta"
```

---

## Tarefa 4: Sessão visível no cabeçalho

**Arquivos:**
- Criar: `lib/auth/usuario.ts`, `components/menu-usuario.tsx`, `app/auth/sair/route.ts`
- Modificar: `app/layout.tsx`

**Interfaces:**
- Consome: `criarClienteServidor` (Tarefa 1)
- Produz: `usuarioAtual(): Promise<{ id: string; email: string } | null>`

- [ ] **Passo 1: Quem está logado**

```ts
// lib/auth/usuario.ts
import { criarClienteServidor } from '@/lib/supabase/servidor'

export type Usuario = { id: string; email: string }

/**
 * Quem esta logado agora, ou null.
 *
 * Usa getClaims() e NAO getSession(): getSession apenas le o cookie, que
 * qualquer pessoa pode forjar. getClaims valida a assinatura do token contra
 * as chaves publicas do projeto a cada chamada. A propria documentacao do
 * Supabase marca isso como questao de seguranca.
 *
 * Devolve null tambem quando o Supabase esta fora do ar. E proposital: o
 * catalogo nao pode cair porque o banco hibernou.
 */
export async function usuarioAtual(): Promise<Usuario | null> {
  try {
    const supabase = await criarClienteServidor()
    const { data } = await supabase.auth.getClaims()

    const claims = data?.claims
    if (!claims?.sub) return null

    return { id: String(claims.sub), email: String(claims.email ?? '') }
  } catch {
    return null
  }
}
```

- [ ] **Passo 2: Encerrar a sessão**

```ts
// app/auth/sair/route.ts
import { NextResponse, type NextRequest } from 'next/server'
import { criarClienteServidor } from '@/lib/supabase/servidor'

/**
 * Sair e um POST, nunca um GET.
 *
 * Se fosse GET, qualquer imagem ou link apontando para /auth/sair deslogaria a
 * pessoa sem ela pedir. Acao que MUDA estado nao pode caber num link.
 */
export async function POST(request: NextRequest) {
  const supabase = await criarClienteServidor()
  await supabase.auth.signOut()
  return NextResponse.redirect(new URL('/', request.url), { status: 303 })
}
```

- [ ] **Passo 3: O menu do cabeçalho**

```tsx
// components/menu-usuario.tsx
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
```

- [ ] **Passo 4: Colocar no cabeçalho**

Em `app/layout.tsx`, adicione o import e troque o parágrafo decorativo pelo menu.

```tsx
import { MenuUsuario } from '@/components/menu-usuario'
```

Substitua este trecho dentro de `Cabecalho()`:

```tsx
        <p className="hidden text-sm text-texto-suave sm:block">
          O que assistir hoje, por assinatura, no Brasil
        </p>
```

por:

```tsx
        <MenuUsuario />
```

- [ ] **Passo 5: Testar os dois estados**

```bash
npm run dev
```

1. Deslogado: o cabeçalho mostra o botão rosa **"Entrar"**
2. Entre em `/entrar`
3. Logado: o cabeçalho mostra **seu e-mail** e o botão **"Sair"**
4. Clique em "Sair" — volta a mostrar "Entrar"
5. **Confira o catálogo nos dois estados**: os filmes têm que aparecer igual

- [ ] **Passo 6: Verificações e commit**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
git add -A
git commit -m "Mostra a sessao no cabecalho com entrar e sair"
```

---

## Tarefa 5: Recuperação de senha

**Arquivos:**
- Criar: `app/entrar/recuperar/page.tsx`, `app/entrar/recuperar/acoes.ts`, `app/auth/redefinir/page.tsx`, `app/auth/redefinir/acoes.ts`

**Interfaces:**
- Consome: `criarClienteServidor` (Tarefa 1), `validarEmail`/`validarSenha` (Tarefa 2)
- Produz: `pedirRecuperacao`, `redefinirSenha` — ambas `(anterior: EstadoAuth, dados: FormData) => Promise<EstadoAuth>`

- [ ] **Passo 1: Pedir o link**

```ts
// app/entrar/recuperar/acoes.ts
'use server'

import { headers } from 'next/headers'
import { validarEmail } from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { EstadoAuth } from '@/lib/auth/tipos'

export type EstadoRecuperacao = EstadoAuth & { enviado?: boolean }

export async function pedirRecuperacao(
  _anterior: EstadoRecuperacao,
  dados: FormData,
): Promise<EstadoRecuperacao> {
  const email = String(dados.get('email') ?? '').trim()

  const erro = validarEmail(email)
  if (erro) return { erro }

  const cabecalhos = await headers()
  const origem = cabecalhos.get('origin') ?? 'http://localhost:3000'

  const supabase = await criarClienteServidor()
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origem}/auth/redefinir`,
  })

  /*
   * Responde "enviado" mesmo se o e-mail nao existir. Confirmar a existencia
   * permitiria descobrir quem tem conta no site — a mesma razao da mensagem
   * generica no login.
   */
  return { enviado: true }
}
```

- [ ] **Passo 2: A tela de pedir**

```tsx
// app/entrar/recuperar/page.tsx
'use client'

import { useActionState } from 'react'
import { Conteiner } from '@/components/conteiner'
import { pedirRecuperacao, type EstadoRecuperacao } from './acoes'

const INICIAL: EstadoRecuperacao = {}

export default function PaginaRecuperar() {
  const [estado, enviar, enviando] = useActionState(pedirRecuperacao, INICIAL)

  return (
    <Conteiner className="py-20">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="titulo text-3xl">Recuperar senha</h1>

        {estado.enviado ? (
          <p className="mt-4 rounded-medio border border-white/10 bg-superficie/60 px-4 py-4 text-sm leading-relaxed text-texto-suave">
            Se existir uma conta com esse e-mail, enviamos um link para
            redefinir a senha. Confira também a caixa de spam.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-texto-suave">
              Informe seu e-mail e enviaremos um link para criar uma senha nova.
            </p>

            <form action={enviar} className="mt-8 space-y-4">
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
              />

              {estado.erro && (
                <p role="alert" className="text-sm text-destaque-suave">
                  {estado.erro}
                </p>
              )}

              <button
                type="submit"
                disabled={enviando}
                className="w-full rounded-grande bg-destaque px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte disabled:opacity-60"
              >
                {enviando ? 'Enviando...' : 'Enviar link'}
              </button>
            </form>
          </>
        )}
      </div>
    </Conteiner>
  )
}
```

- [ ] **Passo 3: Definir a senha nova**

```ts
// app/auth/redefinir/acoes.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { validarSenha } from '@/lib/auth/validacao'
import { criarClienteServidor } from '@/lib/supabase/servidor'
import type { EstadoAuth } from '@/lib/auth/tipos'

export async function redefinirSenha(
  _anterior: EstadoAuth,
  dados: FormData,
): Promise<EstadoAuth> {
  const senha = String(dados.get('senha') ?? '')

  const erro = validarSenha(senha)
  if (erro) return { erro }

  const supabase = await criarClienteServidor()
  const { error } = await supabase.auth.updateUser({ password: senha })

  if (error) {
    return { erro: 'O link expirou ou ja foi usado. Peca outro.' }
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
```

```tsx
// app/auth/redefinir/page.tsx
'use client'

import { useActionState } from 'react'
import { Conteiner } from '@/components/conteiner'
import type { EstadoAuth } from '@/lib/auth/tipos'
import { redefinirSenha } from './acoes'

const INICIAL: EstadoAuth = {}

export default function PaginaRedefinir() {
  const [estado, enviar, enviando] = useActionState(redefinirSenha, INICIAL)

  return (
    <Conteiner className="py-20">
      <div className="mx-auto w-full max-w-sm">
        <h1 className="titulo text-3xl">Nova senha</h1>
        <p className="mt-2 text-sm text-texto-suave">
          Escolha uma senha de pelo menos 6 caracteres.
        </p>

        <form action={enviar} className="mt-8 space-y-4">
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-medio border border-white/15 bg-white/5 px-4 py-3 text-sm text-texto outline-none focus:border-destaque"
          />

          {estado.erro && (
            <p role="alert" className="text-sm text-destaque-suave">
              {estado.erro}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-grande bg-destaque px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-destaque-forte disabled:opacity-60"
          >
            {enviando ? 'Salvando...' : 'Salvar senha'}
          </button>
        </form>
      </div>
    </Conteiner>
  )
}
```

- [ ] **Passo 4: Testar**

```bash
npm run dev
```

Abra `/entrar/recuperar`, informe o e-mail que você cadastrou e envie.

**Lembre do limite:** o serviço de e-mail embutido do Supabase envia **2 por
hora**. Se não chegar, provavelmente a cota estourou — não é bug. Está
registrado na seção 12 da spec.

Chegando o e-mail, clique no link, defina uma senha nova e confirme que
consegue entrar com ela.

- [ ] **Passo 5: Verificações e commit**

```bash
npm test && npx tsc --noEmit && npm run lint && npm run build
git add -A
git commit -m "Adiciona recuperacao de senha"
```

---

## Tarefa 6: Provar que o RLS funciona

**Arquivos:**
- Criar: `testes/rls.test.ts`
- Modificar: `vitest.config.mts` (carregar o `.env.local`)

**Interfaces:**
- Consome: `SUPABASE_TESTES_URL` e `SUPABASE_TESTES_KEY` do `.env.local`
- Produz: nada — é verificação

Esta é a tarefa mais importante do plano. O RLS é a **única** coisa que separa
a lista de um usuário da de outro, e ele falha **sem sintoma**: o app funciona
perfeitamente e vaza tudo em silêncio.

- [ ] **Passo 1: Fazer o Vitest enxergar o `.env.local`**

```ts
// vitest.config.mts
// defineConfig vem de 'vitest/config': o do 'vite' nao conhece a secao "test"
// e o TypeScript recusaria o arquivo. loadEnv so existe no 'vite'.
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig(({ mode }) => ({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    // Os testes de RLS falam com um Supabase real, pela internet.
    testTimeout: 30000,
    env: loadEnv(mode, process.cwd(), ''),
  },
}))
```

- [ ] **Passo 2: Escrever o teste**

```ts
// testes/rls.test.ts
import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, test } from 'vitest'

/*
 * Roda contra o PROJETO DE TESTES, nunca o do app.
 *
 * Usa a mesma chave publicavel que o navegador usa — nunca a service_role.
 * Isso e proposital: o teste ataca o banco exatamente como um invasor
 * atacaria. Se ele nao passa, ninguem passa.
 */
const URL_TESTES = process.env.SUPABASE_TESTES_URL!
const CHAVE_TESTES = process.env.SUPABASE_TESTES_KEY!

function clienteAnonimo() {
  return createClient(URL_TESTES, CHAVE_TESTES, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

/** Cria um usuario novo e devolve um cliente ja autenticado como ele. */
async function criarUsuario() {
  const email = `teste-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@exemplo.com`
  const cliente = clienteAnonimo()

  const { data, error } = await cliente.auth.signUp({
    email,
    password: 'senha-de-teste-123',
  })
  if (error) throw new Error(`Falha ao criar usuario de teste: ${error.message}`)
  if (!data.user) throw new Error('Cadastro nao devolveu usuario')

  return { cliente, id: data.user.id, email }
}

describe('RLS da tabela marcacoes', () => {
  let alice: Awaited<ReturnType<typeof criarUsuario>>
  let bruno: Awaited<ReturnType<typeof criarUsuario>>

  beforeAll(async () => {
    if (!URL_TESTES || !CHAVE_TESTES) {
      throw new Error('Faltam SUPABASE_TESTES_URL e SUPABASE_TESTES_KEY no .env.local')
    }
    alice = await criarUsuario()
    bruno = await criarUsuario()

    await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: 278, status: 'quero_assistir' })

    await bruno.cliente
      .from('marcacoes')
      .insert({ usuario_id: bruno.id, filme_id: 27205, status: 'ja_assisti' })
  })

  test('cada um enxerga apenas a propria marcacao', async () => {
    const { data: daAlice } = await alice.cliente.from('marcacoes').select('filme_id')
    const { data: doBruno } = await bruno.cliente.from('marcacoes').select('filme_id')

    expect(daAlice?.map((m) => m.filme_id)).toEqual([278])
    expect(doBruno?.map((m) => m.filme_id)).toEqual([27205])
  })

  test('pedir TODAS as linhas nao devolve as do outro', async () => {
    // Consulta sem filtro nenhum: se o RLS falhasse, viriam as duas.
    const { data } = await alice.cliente.from('marcacoes').select('*')
    expect(data).toHaveLength(1)
    expect(data?.[0].usuario_id).toBe(alice.id)
  })

  test('nao da para gravar uma marcacao em nome de outra pessoa', async () => {
    const { error } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: bruno.id, filme_id: 550, status: 'quero_assistir' })

    expect(error).not.toBeNull()
  })

  test('nao da para apagar a marcacao de outra pessoa', async () => {
    await alice.cliente.from('marcacoes').delete().eq('usuario_id', bruno.id)

    const { data } = await bruno.cliente.from('marcacoes').select('filme_id')
    expect(data).toHaveLength(1)
  })

  test('quem nao tem conta nao enxerga nada', async () => {
    const { data } = await clienteAnonimo().from('marcacoes').select('*')
    expect(data ?? []).toHaveLength(0)
  })

  test('o mesmo filme nao pode ficar em dois estados', async () => {
    const { error } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: 278, status: 'ja_assisti' })

    // Barrado pela restricao unique (usuario_id, filme_id)
    expect(error).not.toBeNull()
  })

  test('status invalido e recusado pelo banco', async () => {
    const { error } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: 999, status: 'ja_assistiu' })

    // Barrado pela restricao check
    expect(error).not.toBeNull()
  })
})
```

- [ ] **Passo 3: Rodar**

```bash
npm test
```

Esperado: `55 passed` (7 novos + 48 anteriores). Leva alguns segundos a mais
porque fala com o Supabase pela internet.

**Se algum falhar, PARE.** Um teste de RLS falhando significa que os dados de
um usuário estão visíveis para outro. Não siga para o Plano 3 antes de
resolver.

- [ ] **Passo 4: Provar que o teste realmente testa**

Um teste de segurança que nunca falhou não prova nada. Vamos quebrá-lo de
propósito para ver se ele acusa.

No SQL Editor do **projeto de testes** (`lnsozvcdtgqhtnnrkulq`), rode:

```sql
alter table marcacoes disable row level security;
```

Rode `npm test` de novo. Esperado: **os testes de RLS FALHAM**.

Agora religue:

```sql
alter table marcacoes enable row level security;
```

Rode `npm test` mais uma vez. Esperado: **tudo volta a passar**.

Se os testes passaram com o RLS desligado, eles estão testando outra coisa.

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "Adiciona testes automatizados que provam o RLS"
```

---

## Fim do Plano 2

Ao concluir, o `ta-no-stream` tem contas de verdade: criar conta, entrar, sair,
recuperar senha, e a sessão visível no cabeçalho. O catálogo público continua
funcionando igual, para quem tem conta e para quem não tem.

**O Plano 3 cobrirá:** a tabela sendo usada de fato — botões de marcar na ficha
e no pôster, as três abas de navegação, as listas de "quero assistir" e "já
assisti", e o convite de login no lugar da lista para quem ainda não entrou.
