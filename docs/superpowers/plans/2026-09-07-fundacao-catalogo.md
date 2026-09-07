# Plano 1 — Fundação do Catálogo

> **Para agentes executores:** SUB-HABILIDADE OBRIGATÓRIA: use `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans` para executar tarefa a tarefa. Os passos usam caixas (`- [ ]`) para acompanhamento.

**Objetivo:** Ter o catálogo do `ta-no-stream` funcionando no navegador, mostrando filmes reais disponíveis no streaming no Brasil, com o design system aplicado.

**Arquitetura:** Next.js App Router com Server Components. As páginas chamam funções de `lib/tmdb/`, que é a única fronteira com a API externa e devolve dados no nosso formato. A chave da API vive apenas no servidor. Sem banco de dados e sem login.

**Stack:** Next.js 16 · TypeScript · Tailwind CSS v4 · Vitest · API do TMDB

**Spec:** `docs/superpowers/specs/2026-09-07-ta-no-stream-design.md`

## Restrições globais

Valem para **todas** as tarefas. Copiadas da spec.

- **Node.js mínimo 20.9** — a máquina tem v24.18.0, requisito atendido
- **Toda a interface em português do Brasil**, incluindo mensagens de erro e estados vazios
- **Toda chamada ao TMDB** carrega `language=pt-BR`, `region=BR`, `watch_region=BR` e `with_watch_monetization_types=flatrate`
- **Cantos `0px` em tudo** — botões, cartões, imagens. Sem exceção
- **Dourado `#FFC000` em exatamente dois lugares** no app: o botão "onde assistir" e o indicador de filtro ativo. Em nenhum outro
- **Sem degradês e sem sombras** — profundidade vem da troca de cor de superfície: `#000000` → `#181818` → `#202020`
- **Títulos de destaque em CAIXA ALTA**
- **Chave do TMDB apenas em variável de ambiente do servidor.** Nunca no código, nunca com prefixo `NEXT_PUBLIC_`, nunca commitada
- **Paginação limitada a 500** — o TMDB rejeita `page` acima disso
- **Atribuição obrigatória:** TMDB e JustWatch (implementada na Tarefa 7)
- **Nenhuma marca de terceiros** — nada de Lamborghini, HBO ou logotipos de streamings além dos que o próprio TMDB fornece
- **Sem anúncios e sem cobrança** — o plano gratuito do TMDB proíbe uso comercial
- **Mensagens de commit em português**, sem acentos (evita problemas de codificação no terminal do Windows)

## Estrutura de arquivos ao final deste plano

```
ta-no-stream/
├── .env.local                  chave do TMDB (NUNCA commitado)
├── .env.example                modelo sem segredos (commitado)
├── next.config.ts              libera imagens do image.tmdb.org
├── vitest.config.mts           configuração dos testes
├── app/
│   ├── layout.tsx              molde global: fonte, fundo preto, rodapé de atribuição
│   ├── globals.css             tokens de cor e tipografia do design system
│   ├── page.tsx                catálogo
│   ├── loading.tsx             esqueleto enquanto carrega
│   └── error.tsx               tela de falha
├── components/
│   ├── cartao-filme.tsx        um pôster com título e ano
│   ├── grade-filmes.tsx        a grade de pôsteres
│   └── esqueleto-grade.tsx     os retângulos cinza do carregamento
├── lib/
│   ├── servicos.ts             lista curada de streamings do Brasil
│   └── tmdb/
│       ├── tipos.ts            nossos tipos + os tipos crus do TMDB
│       ├── traduzir.ts         TMDB → nosso formato          [TESTADO]
│       ├── parametros.ts       filtros da URL → query TMDB   [TESTADO]
│       ├── cliente.ts          fetch autenticado + revalidação
│       └── index.ts            funções públicas
└── testes/
    ├── traduzir.test.ts
    └── parametros.test.ts
```

**Responsabilidade de cada arquivo de `lib/tmdb/`:** `traduzir.ts` e `parametros.ts` são funções puras — entra dado, sai dado, sem rede — e por isso são as únicas testadas. `cliente.ts` isola o `fetch`. `index.ts` é a fachada que as páginas usam. Essa separação é o que permite trocar a origem dos dados no futuro sem tocar em nenhuma tela.

---

## Tarefa 1: Criar o projeto Next.js

**Arquivos:**
- Criar: tudo que o `create-next-app` gera na raiz de `ta-no-stream/`

**Interfaces:**
- Consome: nada (primeira tarefa)
- Produz: um projeto Next.js 16 funcional com TypeScript, Tailwind v4, ESLint e App Router; scripts `npm run dev`, `npm run build`, `npm run lint`

- [ ] **Passo 1: Rodar o criador de projeto dentro da pasta existente**

O ponto final significa "aqui mesmo, não crie subpasta". A pasta já tem `.git` e `docs/`, e o `create-next-app` aceita ambos.

```bash
cd /c/Users/tuani/StudioProjects/ta-no-stream
npx create-next-app@latest . --yes
```

Se ele reclamar que a pasta não está vazia, mova `docs` temporariamente e devolva depois:

```bash
mv docs ../docs-temporario
npx create-next-app@latest . --yes
mv ../docs-temporario docs
```

- [ ] **Passo 2: Conferir o que foi criado**

```bash
ls -la
cat package.json
```

Esperado: existem `app/`, `package.json`, `tsconfig.json`, `next.config.ts`, `node_modules/`. O `package.json` tem `next`, `react`, `react-dom`, `typescript` e `tailwindcss`.

- [ ] **Passo 3: Subir o servidor e ver a página padrão**

```bash
npm run dev
```

Esperado: aparece `Ready in ...` e o endereço `http://localhost:3000`. Abra no navegador — deve aparecer a página inicial do Next.js. Encerre com `Ctrl+C`.

- [ ] **Passo 4: Confirmar que a build de produção passa**

```bash
npm run build
```

Esperado: termina sem erro, listando as rotas geradas.

- [ ] **Passo 5: Commit**

```bash
git add -A
git commit -m "Cria projeto Next.js 16 com TypeScript e Tailwind"
```

---

## Tarefa 2: Chave do TMDB e lista de serviços do Brasil

**Arquivos:**
- Criar: `.env.local`, `.env.example`, `lib/servicos.ts`
- Modificar: `.gitignore` (conferir que já ignora `.env*`)

**Interfaces:**
- Consome: projeto da Tarefa 1
- Produz: `process.env.TMDB_TOKEN` disponível no servidor; `lib/servicos.ts` exportando `SERVICOS: Servico[]` e o tipo `Servico = { id: number; nome: string }`

- [ ] **Passo 1: Criar a conta e obter o token (ação manual sua)**

1. Acesse `https://www.themoviedb.org/signup` e crie a conta
2. Confirme o e-mail
3. Vá em `https://www.themoviedb.org/settings/api`
4. Peça uma chave escolhendo **Developer** e uso **pessoal / não comercial**
5. Copie o campo **API Read Access Token** — é o texto longo começando com `eyJ`, **não** o "API Key" curto

- [ ] **Passo 2: Guardar o token fora do código**

```bash
cd /c/Users/tuani/StudioProjects/ta-no-stream
printf 'TMDB_TOKEN=COLE_SEU_TOKEN_AQUI\n' > .env.local
printf 'TMDB_TOKEN=\n' > .env.example
```

Abra `.env.local` no editor e substitua `COLE_SEU_TOKEN_AQUI` pelo token real.

- [ ] **Passo 3: Confirmar que o segredo não vai para o Git**

```bash
grep -n "env" .gitignore
git status --short
```

Esperado: `.gitignore` contém `.env*`; `git status` **não** lista `.env.local`. Se listar, pare e adicione `.env*` ao `.gitignore` antes de seguir.

- [ ] **Passo 4: Testar o token e descobrir os IDs dos serviços**

Substitua `SEU_TOKEN` pelo valor real:

```bash
curl -s -H "Authorization: Bearer SEU_TOKEN" \
  "https://api.themoviedb.org/3/watch/providers/movie?language=pt-BR&watch_region=BR" \
  | head -c 3000
```

Esperado: um JSON com `results`, cada item tendo `provider_id`, `provider_name` e `display_priority`. Se vier `{"status_code":7}`, o token está errado.

- [ ] **Passo 5: Escrever a lista curada com os IDs reais**

Pegue do resultado acima os `provider_id` dos serviços abaixo. **Não invente números** — use exatamente o que a API devolveu.

```ts
// lib/servicos.ts
export type Servico = {
  id: number
  nome: string
}

/**
 * Serviços de assinatura do Brasil, com os IDs obtidos de
 * /watch/providers/movie?watch_region=BR. A lista é curada de propósito:
 * o TMDB devolve mais de 60 provedores no Brasil, a maioria de nicho.
 */
export const SERVICOS: Servico[] = [
  { id: 0, nome: 'Netflix' },
  { id: 0, nome: 'Amazon Prime Video' },
  { id: 0, nome: 'Disney Plus' },
  { id: 0, nome: 'Max' },
  { id: 0, nome: 'Globoplay' },
  { id: 0, nome: 'Apple TV+' },
  { id: 0, nome: 'Paramount Plus' },
  { id: 0, nome: 'Star Plus' },
  { id: 0, nome: 'Telecine' },
  { id: 0, nome: 'MUBI' },
  { id: 0, nome: 'Crunchyroll' },
]

export const TODOS_OS_IDS = SERVICOS.map((s) => s.id).join('|')
```

Troque cada `id: 0` pelo número real. Se algum serviço não aparecer na resposta da API, **remova a linha** em vez de chutar. O `|` em `TODOS_OS_IDS` é o operador "OU" do TMDB.

- [ ] **Passo 6: Verificar que nenhum id ficou em zero**

```bash
grep -n "id: 0" lib/servicos.ts
```

Esperado: nenhuma saída.

- [ ] **Passo 7: Commit**

```bash
git add .env.example lib/servicos.ts .gitignore
git commit -m "Adiciona lista de servicos de streaming do Brasil"
```

---

## Tarefa 3: Instalar o Vitest

**Arquivos:**
- Criar: `vitest.config.mts`, `testes/fumaca.test.ts`
- Modificar: `package.json` (script `test`)

**Interfaces:**
- Consome: projeto da Tarefa 1
- Produz: comando `npm test` executando arquivos `testes/*.test.ts`

- [ ] **Passo 1: Instalar os pacotes de teste**

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom vite-tsconfig-paths
```

- [ ] **Passo 2: Criar a configuração**

```ts
// vitest.config.mts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
  },
})
```

- [ ] **Passo 3: Adicionar o script**

Em `package.json`, dentro de `"scripts"`, acrescente:

```json
"test": "vitest run",
"test:observar": "vitest"
```

`vitest run` roda uma vez e sai — é o que se usa para verificar. `vitest` sozinho fica observando arquivos.

- [ ] **Passo 4: Escrever um teste de fumaça**

Serve só para provar que o encanamento funciona.

```ts
// testes/fumaca.test.ts
import { expect, test } from 'vitest'

test('o vitest esta funcionando', () => {
  expect(1 + 1).toBe(2)
})
```

- [ ] **Passo 5: Rodar**

```bash
npm test
```

Esperado: `1 passed`.

- [ ] **Passo 6: Commit**

```bash
git add -A
git commit -m "Configura Vitest para testes automatizados"
```

---

## Tarefa 4: Traduzir os dados do TMDB (TDD)

**Arquivos:**
- Criar: `lib/tmdb/tipos.ts`, `lib/tmdb/traduzir.ts`, `testes/traduzir.test.ts`

**Interfaces:**
- Consome: Vitest da Tarefa 3
- Produz:
  - `type Filme = { id: number; titulo: string; ano: number | null; posterUrl: string | null; backdropUrl: string | null; nota: number | null; sinopse: string }`
  - `type FilmeTmdb` (formato cru da API)
  - `urlImagem(caminho: string | null, tamanho: string): string | null`
  - `anoDeLancamento(data: string | null | undefined): number | null`
  - `notaValida(media: number, votos: number): number | null`
  - `traduzirFilme(bruto: FilmeTmdb): Filme`

- [ ] **Passo 1: Escrever os tipos**

Este passo não tem teste porque tipos somem na compilação — não existe comportamento para testar.

```ts
// lib/tmdb/tipos.ts

/** O formato cru que o TMDB devolve. Só usado dentro de lib/tmdb. */
export type FilmeTmdb = {
  id: number
  title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
}

export type RespostaDescoberta = {
  page: number
  results: FilmeTmdb[]
  total_pages: number
  total_results: number
}

/** O nosso formato. É o único que sai de lib/tmdb para as telas. */
export type Filme = {
  id: number
  titulo: string
  ano: number | null
  posterUrl: string | null
  backdropUrl: string | null
  nota: number | null
  sinopse: string
}

export type PaginaDeFilmes = {
  filmes: Filme[]
  pagina: number
  totalDePaginas: number
}
```

- [ ] **Passo 2: Escrever os testes que falham**

Cada caso aqui é um dado real e sujo que o TMDB devolve.

```ts
// testes/traduzir.test.ts
import { describe, expect, test } from 'vitest'
import {
  anoDeLancamento,
  notaValida,
  traduzirFilme,
  urlImagem,
} from '@/lib/tmdb/traduzir'
import type { FilmeTmdb } from '@/lib/tmdb/tipos'

const filmeCompleto: FilmeTmdb = {
  id: 27205,
  title: 'A Origem',
  overview: 'Um ladrao que invade sonhos.',
  poster_path: '/abc.jpg',
  backdrop_path: '/xyz.jpg',
  release_date: '2010-07-15',
  vote_average: 8.369,
  vote_count: 36000,
}

describe('urlImagem', () => {
  test('monta o endereco completo da imagem', () => {
    expect(urlImagem('/abc.jpg', 'w500')).toBe(
      'https://image.tmdb.org/t/p/w500/abc.jpg',
    )
  })

  test('devolve nulo quando o filme nao tem imagem', () => {
    expect(urlImagem(null, 'w500')).toBeNull()
  })
})

describe('anoDeLancamento', () => {
  test('extrai o ano da data', () => {
    expect(anoDeLancamento('2010-07-15')).toBe(2010)
  })

  test('devolve nulo quando a data esta vazia', () => {
    expect(anoDeLancamento('')).toBeNull()
  })

  test('devolve nulo quando a data nao existe', () => {
    expect(anoDeLancamento(null)).toBeNull()
  })

  test('devolve nulo quando o ano e absurdo', () => {
    expect(anoDeLancamento('0000-00-00')).toBeNull()
  })
})

describe('notaValida', () => {
  test('arredonda para uma casa decimal', () => {
    expect(notaValida(8.369, 36000)).toBe(8.4)
  })

  test('devolve nulo quando ninguem votou', () => {
    expect(notaValida(0, 0)).toBeNull()
  })

  test('devolve nulo quando a media e zero mesmo com votos', () => {
    expect(notaValida(0, 12)).toBeNull()
  })
})

describe('traduzirFilme', () => {
  test('converte um filme completo para o nosso formato', () => {
    expect(traduzirFilme(filmeCompleto)).toEqual({
      id: 27205,
      titulo: 'A Origem',
      ano: 2010,
      posterUrl: 'https://image.tmdb.org/t/p/w500/abc.jpg',
      backdropUrl: 'https://image.tmdb.org/t/p/w1280/xyz.jpg',
      nota: 8.4,
      sinopse: 'Um ladrao que invade sonhos.',
    })
  })

  test('aguenta um filme sem poster, sem data e sem votos', () => {
    const cru: FilmeTmdb = {
      ...filmeCompleto,
      poster_path: null,
      backdrop_path: null,
      release_date: '',
      vote_average: 0,
      vote_count: 0,
    }
    const filme = traduzirFilme(cru)
    expect(filme.posterUrl).toBeNull()
    expect(filme.backdropUrl).toBeNull()
    expect(filme.ano).toBeNull()
    expect(filme.nota).toBeNull()
    expect(filme.titulo).toBe('A Origem')
  })
})
```

- [ ] **Passo 3: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA com erro de módulo não encontrado (`lib/tmdb/traduzir`). **Isso é o resultado certo.** Um teste que passa antes do código existir está testando a coisa errada.

- [ ] **Passo 4: Escrever a implementação mínima**

```ts
// lib/tmdb/traduzir.ts
import type { Filme, FilmeTmdb } from './tipos'

const BASE_IMAGEM = 'https://image.tmdb.org/t/p'

export function urlImagem(caminho: string | null, tamanho: string): string | null {
  if (!caminho) return null
  return `${BASE_IMAGEM}/${tamanho}${caminho}`
}

export function anoDeLancamento(data: string | null | undefined): number | null {
  if (!data) return null
  const ano = Number(data.slice(0, 4))
  if (!Number.isFinite(ano) || ano < 1870) return null
  return ano
}

export function notaValida(media: number, votos: number): number | null {
  if (votos === 0) return null
  if (media <= 0) return null
  return Math.round(media * 10) / 10
}

export function traduzirFilme(bruto: FilmeTmdb): Filme {
  return {
    id: bruto.id,
    titulo: bruto.title,
    ano: anoDeLancamento(bruto.release_date),
    posterUrl: urlImagem(bruto.poster_path, 'w500'),
    backdropUrl: urlImagem(bruto.backdrop_path, 'w1280'),
    nota: notaValida(bruto.vote_average, bruto.vote_count),
    sinopse: bruto.overview,
  }
}
```

- [ ] **Passo 5: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: `12 passed` (os 11 deste arquivo + o de fumaça).

- [ ] **Passo 6: Commit**

```bash
git add lib/tmdb/tipos.ts lib/tmdb/traduzir.ts testes/traduzir.test.ts
git commit -m "Adiciona traducao dos dados do TMDB com testes"
```

---

## Tarefa 5: Montar os parâmetros de busca (TDD)

**Arquivos:**
- Criar: `lib/tmdb/parametros.ts`, `testes/parametros.test.ts`

**Interfaces:**
- Consome: `SERVICOS` e `TODOS_OS_IDS` de `lib/servicos.ts` (Tarefa 2)
- Produz:
  - `type FiltrosUrl = { servico?: string; genero?: string; ano?: string; nota?: string; pagina?: string }`
  - `type ParametrosCrus = { [chave: string]: string | string[] | undefined }`
  - `paginaValida(valor: string | undefined): string`
  - `normalizarFiltros(crus: ParametrosCrus): FiltrosUrl`
  - `montarParametrosDescoberta(filtros: FiltrosUrl): URLSearchParams`

- [ ] **Passo 1: Escrever os testes que falham**

```ts
// testes/parametros.test.ts
import { describe, expect, test } from 'vitest'
import {
  montarParametrosDescoberta,
  normalizarFiltros,
  paginaValida,
} from '@/lib/tmdb/parametros'
import { TODOS_OS_IDS } from '@/lib/servicos'

describe('paginaValida', () => {
  test('aceita um numero normal', () => {
    expect(paginaValida('3')).toBe('3')
  })

  test('vira 1 quando nao vem nada', () => {
    expect(paginaValida(undefined)).toBe('1')
  })

  test('vira 1 quando vem texto', () => {
    expect(paginaValida('abc')).toBe('1')
  })

  test('vira 1 quando vem zero ou negativo', () => {
    expect(paginaValida('0')).toBe('1')
    expect(paginaValida('-5')).toBe('1')
  })

  test('vira 1 acima de 500, que e o teto do TMDB', () => {
    expect(paginaValida('501')).toBe('1')
    expect(paginaValida('99999')).toBe('1')
  })

  test('aceita exatamente 500', () => {
    expect(paginaValida('500')).toBe('500')
  })
})

describe('montarParametrosDescoberta', () => {
  test('sempre envia os parametros obrigatorios do Brasil', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('language')).toBe('pt-BR')
    expect(p.get('region')).toBe('BR')
    expect(p.get('watch_region')).toBe('BR')
    expect(p.get('with_watch_monetization_types')).toBe('flatrate')
    expect(p.get('include_adult')).toBe('false')
    expect(p.get('sort_by')).toBe('popularity.desc')
    expect(p.get('page')).toBe('1')
  })

  test('sem filtro de servico, busca em todos os servicos da lista', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('with_watch_providers')).toBe(TODOS_OS_IDS)
  })

  test('com filtro de servico, usa apenas o escolhido', () => {
    const p = montarParametrosDescoberta({ servico: '8' })
    expect(p.get('with_watch_providers')).toBe('8')
  })

  test('traduz genero, ano e nota para os nomes do TMDB', () => {
    const p = montarParametrosDescoberta({ genero: '28', ano: '2024', nota: '7' })
    expect(p.get('with_genres')).toBe('28')
    expect(p.get('primary_release_year')).toBe('2024')
    expect(p.get('vote_average.gte')).toBe('7')
  })

  test('nao envia filtros que nao foram escolhidos', () => {
    const p = montarParametrosDescoberta({})
    expect(p.get('with_genres')).toBeNull()
    expect(p.get('primary_release_year')).toBeNull()
    expect(p.get('vote_average.gte')).toBeNull()
  })

  test('ignora filtros vazios vindos da URL', () => {
    const p = montarParametrosDescoberta({ genero: '', ano: '' })
    expect(p.get('with_genres')).toBeNull()
    expect(p.get('primary_release_year')).toBeNull()
  })
})

describe('normalizarFiltros', () => {
  test('aproveita os valores simples', () => {
    expect(normalizarFiltros({ servico: '8', ano: '2024' })).toEqual({
      servico: '8',
      genero: undefined,
      ano: '2024',
      nota: undefined,
      pagina: undefined,
    })
  })

  test('pega o primeiro quando a chave vem repetida na URL', () => {
    expect(normalizarFiltros({ genero: ['28', '12'] }).genero).toBe('28')
  })

  test('descarta chaves que nao sao filtros conhecidos', () => {
    const filtros = normalizarFiltros({ utm_source: 'instagram', ano: '2024' })
    expect(filtros).not.toHaveProperty('utm_source')
    expect(filtros.ano).toBe('2024')
  })

  test('devolve tudo indefinido quando a URL esta limpa', () => {
    const filtros = normalizarFiltros({})
    expect(filtros.servico).toBeUndefined()
    expect(filtros.pagina).toBeUndefined()
  })
})
```

- [ ] **Passo 2: Rodar e confirmar que falha**

```bash
npm test
```

Esperado: FALHA por módulo `lib/tmdb/parametros` não encontrado.

- [ ] **Passo 3: Escrever a implementação**

```ts
// lib/tmdb/parametros.ts
// Import relativo de proposito: o apelido '@/' so existe para o TypeScript e o
// Next.js. O Node puro nao o resolve, e a verificacao da Tarefa 6 roda no Node.
import { TODOS_OS_IDS } from '../servicos'

export type FiltrosUrl = {
  servico?: string
  genero?: string
  ano?: string
  nota?: string
  pagina?: string
}

/** O formato cru que o Next.js entrega: a URL pode repetir uma chave. */
export type ParametrosCrus = { [chave: string]: string | string[] | undefined }

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor
}

/**
 * Reduz o que veio da URL aos cinco filtros que conhecemos, descartando
 * qualquer outra chave (utm_source e afins) e ficando com o primeiro valor
 * quando a mesma chave aparece repetida.
 */
export function normalizarFiltros(crus: ParametrosCrus): FiltrosUrl {
  return {
    servico: primeiro(crus.servico),
    genero: primeiro(crus.genero),
    ano: primeiro(crus.ano),
    nota: primeiro(crus.nota),
    pagina: primeiro(crus.pagina),
  }
}

/** O TMDB rejeita page acima de 500. Qualquer valor invalido volta para 1. */
export function paginaValida(valor: string | undefined): string {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero < 1 || numero > 500) return '1'
  return String(numero)
}

export function montarParametrosDescoberta(filtros: FiltrosUrl): URLSearchParams {
  const parametros = new URLSearchParams({
    language: 'pt-BR',
    region: 'BR',
    watch_region: 'BR',
    with_watch_monetization_types: 'flatrate',
    sort_by: 'popularity.desc',
    include_adult: 'false',
    page: paginaValida(filtros.pagina),
    with_watch_providers: filtros.servico || TODOS_OS_IDS,
  })

  if (filtros.genero) parametros.set('with_genres', filtros.genero)
  if (filtros.ano) parametros.set('primary_release_year', filtros.ano)
  if (filtros.nota) parametros.set('vote_average.gte', filtros.nota)

  return parametros
}
```

- [ ] **Passo 4: Rodar e confirmar que passa**

```bash
npm test
```

Esperado: `28 passed` (16 deste arquivo, 11 do anterior e 1 de fumaça).

- [ ] **Passo 5: Commit**

```bash
git add lib/tmdb/parametros.ts testes/parametros.test.ts
git commit -m "Adiciona montagem dos parametros de busca com testes"
```

---

## Tarefa 6: Cliente do TMDB e a fachada pública

**Arquivos:**
- Criar: `lib/tmdb/cliente.ts`, `lib/tmdb/index.ts`

**Interfaces:**
- Consome: `traduzirFilme` (Tarefa 4), `montarParametrosDescoberta` e `FiltrosUrl` (Tarefa 5), `RespostaDescoberta` e `PaginaDeFilmes` (Tarefa 4)
- Produz:
  - `class ErroTmdb extends Error` com propriedade `status: number`
  - `pedirAoTmdb<T>(caminho: string, parametros: URLSearchParams, revalidarEmSegundos: number): Promise<T>`
  - `buscarFilmes(filtros: FiltrosUrl): Promise<PaginaDeFilmes>`
  - `SEIS_HORAS` e `VINTE_E_QUATRO_HORAS` (números, em segundos)

- [ ] **Passo 1: Escrever o cliente**

Sem teste automatizado: esta função só faz rede, e testar rede é testar o TMDB, não o nosso código. A verificação é o Passo 3.

```ts
// lib/tmdb/cliente.ts
const BASE = 'https://api.themoviedb.org/3'

export class ErroTmdb extends Error {
  // Declarado e atribuido separadamente. A forma curta do TypeScript
  // — constructor(public status: number) — gera codigo, e o Node so
  // apaga tipos, sem compilar. Ele recusaria o arquivo.
  status: number

  constructor(status: number) {
    super(`O TMDB respondeu com status ${status}`)
    this.name = 'ErroTmdb'
    this.status = status
  }
}

/**
 * Unico lugar do projeto que fala com a API do TMDB.
 * Roda apenas no servidor: process.env.TMDB_TOKEN nao existe no navegador.
 */
export async function pedirAoTmdb<T>(
  caminho: string,
  parametros: URLSearchParams,
  revalidarEmSegundos: number,
): Promise<T> {
  const token = process.env.TMDB_TOKEN
  if (!token) {
    throw new Error(
      'TMDB_TOKEN nao esta definido. Confira o arquivo .env.local.',
    )
  }

  const resposta = await fetch(`${BASE}${caminho}?${parametros.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      accept: 'application/json',
    },
    next: { revalidate: revalidarEmSegundos },
  })

  if (!resposta.ok) throw new ErroTmdb(resposta.status)

  return (await resposta.json()) as T
}
```

- [ ] **Passo 2: Escrever a fachada**

```ts
// lib/tmdb/index.ts
import { pedirAoTmdb } from './cliente'
import { montarParametrosDescoberta, type FiltrosUrl } from './parametros'
import { traduzirFilme } from './traduzir'
import type { PaginaDeFilmes, RespostaDescoberta } from './tipos'

export const SEIS_HORAS = 60 * 60 * 6
export const VINTE_E_QUATRO_HORAS = 60 * 60 * 24

/** Teto imposto pelo TMDB: nunca existem mais de 500 paginas. */
const MAXIMO_DE_PAGINAS = 500

export async function buscarFilmes(filtros: FiltrosUrl): Promise<PaginaDeFilmes> {
  const dados = await pedirAoTmdb<RespostaDescoberta>(
    '/discover/movie',
    montarParametrosDescoberta(filtros),
    SEIS_HORAS,
  )

  return {
    filmes: dados.results.map(traduzirFilme),
    pagina: dados.page,
    totalDePaginas: Math.min(dados.total_pages, MAXIMO_DE_PAGINAS),
  }
}

export { normalizarFiltros } from './parametros'
export type { FiltrosUrl }
export type { ParametrosCrus } from './parametros'
export type { Filme, PaginaDeFilmes } from './tipos'
export { ErroTmdb } from './cliente'
```

- [ ] **Passo 3: Verificar contra a API real**

Crie um arquivo temporário para provar que a corrente inteira funciona:

```ts
// verificar-tmdb.mts
import { buscarFilmes } from './lib/tmdb/index.ts'

const pagina = await buscarFilmes({})
console.log('total de paginas:', pagina.totalDePaginas)
console.log('primeiros tres:')
for (const filme of pagina.filmes.slice(0, 3)) {
  console.log(` - ${filme.titulo} (${filme.ano}) nota ${filme.nota}`)
}
```

```bash
node --env-file=.env.local --experimental-strip-types verificar-tmdb.mts
```

Esperado: três filmes reais com título, ano e nota. Se der `TMDB_TOKEN nao esta definido`, confira o `.env.local`. Se der status 401, o token está errado.

- [ ] **Passo 4: Apagar o arquivo temporário**

```bash
rm verificar-tmdb.mts
```

- [ ] **Passo 5: Commit**

```bash
git add lib/tmdb/cliente.ts lib/tmdb/index.ts
git commit -m "Adiciona cliente do TMDB e fachada de busca de filmes"
```

---

## Tarefa 7: Design system e molde global

**Arquivos:**
- Criar/substituir: `app/globals.css`, `app/layout.tsx`
- Modificar: `next.config.ts`

**Interfaces:**
- Consome: projeto da Tarefa 1
- Produz: classes utilitárias `bg-abismo`, `bg-superficie`, `text-dourado`, `text-cinza`, `font-display`; rodapé de atribuição em todas as páginas; `image.tmdb.org` liberado para `next/image`

- [ ] **Passo 1: Liberar as imagens do TMDB**

Sem isso, o componente `Image` do Next recusa endereços externos.

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'image.tmdb.org', pathname: '/t/p/**' },
    ],
  },
}

export default nextConfig
```

- [ ] **Passo 2: Escrever os tokens do design system**

Substitua **todo** o conteúdo de `app/globals.css`. No Tailwind v4 o bloco `@theme` gera as classes automaticamente: `--color-abismo` vira `bg-abismo`, `text-abismo`, `border-abismo`.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Superficies — profundidade por troca de cor, nunca por sombra */
  --color-abismo: #000000;
  --color-fundo-profundo: #181818;
  --color-superficie: #202020;

  /* Texto */
  --color-branco: #ffffff;
  --color-cinza: #7d7d7d;
  --color-cinza-claro: #969696;

  /* Unica cor do sistema. So em "onde assistir" e filtro ativo. */
  --color-dourado: #ffc000;
  --color-dourado-escuro: #917300;

  --font-display: var(--fonte-archivo), system-ui, sans-serif;

  /* Cantos retos sao inegociaveis neste sistema */
  --radius-none: 0px;
}

html {
  color-scheme: dark;
}

body {
  background-color: var(--color-abismo);
  color: var(--color-branco);
}

/* Titulos de destaque: caixa alta, entrelinha apertada */
.titulo-display {
  text-transform: uppercase;
  line-height: 0.92;
  letter-spacing: -0.01em;
}
```

- [ ] **Passo 3: Escrever o molde global**

```tsx
// app/layout.tsx
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
```

- [ ] **Passo 4: Verificar na tela**

```bash
npm run dev
```

Abra `http://localhost:3000`. Esperado: **fundo preto absoluto**, o rodapé de atribuição visível no fim da página, e o texto numa fonte sem serifa (Archivo). Encerre com `Ctrl+C`.

- [ ] **Passo 5: Commit**

```bash
git add app/globals.css app/layout.tsx next.config.ts
git commit -m "Aplica design system e adiciona atribuicao obrigatoria do TMDB"
```

---

## Tarefa 8: Cartão de filme e grade

**Arquivos:**
- Criar: `components/cartao-filme.tsx`, `components/grade-filmes.tsx`

**Interfaces:**
- Consome: `type Filme` (Tarefa 4), tokens de cor (Tarefa 7)
- Produz:
  - `<CartaoFilme filme={filme} />`
  - `<GradeFilmes filmes={filmes} />`

- [ ] **Passo 1: Escrever o cartão**

Repare em três regras da spec aplicadas aqui: cantos retos, hover que escurece em vez de crescer, e o retângulo de reserva quando não há pôster.

```tsx
// components/cartao-filme.tsx
import Image from 'next/image'
import Link from 'next/link'
import type { Filme } from '@/lib/tmdb'

export function CartaoFilme({ filme }: { filme: Filme }) {
  return (
    <Link
      href={`/filme/${filme.id}`}
      className="group block focus:outline-none focus:ring-2 focus:ring-branco"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-superficie">
        {filme.posterUrl ? (
          <Image
            src={filme.posterUrl}
            alt={`Poster de ${filme.titulo}`}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-opacity duration-200 group-hover:opacity-40"
          />
        ) : (
          <SemPoster titulo={filme.titulo} />
        )}

        {/* Sem escala nem deslocamento: o sistema so permite mudanca de cor */}
        <div className="absolute inset-0 flex items-end p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <p className="titulo-display text-sm text-branco">{filme.titulo}</p>
        </div>
      </div>

      <div className="mt-2">
        <p className="titulo-display text-sm text-branco">{filme.titulo}</p>
        <p className="mt-1 text-xs text-cinza">
          {filme.ano ?? 'Ano desconhecido'}
          {filme.nota !== null && ` · Nota ${filme.nota}`}
        </p>
      </div>
    </Link>
  )
}

/** Alguns filmes do TMDB nao tem imagem. Nunca mostrar icone quebrado. */
function SemPoster({ titulo }: { titulo: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-superficie p-4">
      <p className="titulo-display text-center text-sm text-branco">{titulo}</p>
    </div>
  )
}
```

- [ ] **Passo 2: Escrever a grade**

Duas colunas no celular e quatro no desktop, como decidido — nunca miniaturas espremidas.

```tsx
// components/grade-filmes.tsx
import type { Filme } from '@/lib/tmdb'
import { CartaoFilme } from './cartao-filme'

export function GradeFilmes({ filmes }: { filmes: Filme[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {filmes.map((filme) => (
        <li key={filme.id}>
          <CartaoFilme filme={filme} />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Passo 3: Conferir que o TypeScript aceita**

```bash
npx tsc --noEmit
```

Esperado: nenhuma saída. Os componentes ainda não são usados por ninguém — isso só prova que os tipos batem.

- [ ] **Passo 4: Commit**

```bash
git add components/
git commit -m "Adiciona cartao de filme e grade de posters"
```

---

## Tarefa 9: A página do catálogo

**Arquivos:**
- Substituir: `app/page.tsx`
- Criar: `app/loading.tsx`, `app/error.tsx`, `components/esqueleto-grade.tsx`

**Interfaces:**
- Consome: `buscarFilmes` (Tarefa 6), `GradeFilmes` (Tarefa 8), tokens (Tarefa 7)
- Produz: a rota `/` renderizando filmes reais

- [ ] **Passo 1: Escrever o esqueleto de carregamento**

```tsx
// components/esqueleto-grade.tsx

/** Retangulos no formato exato dos posters. Nunca deixar tela em branco. */
export function EsqueletoGrade() {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {Array.from({ length: 12 }, (_, indice) => (
        <li key={indice}>
          <div className="aspect-[2/3] animate-pulse bg-superficie" />
          <div className="mt-2 h-4 w-3/4 animate-pulse bg-superficie" />
          <div className="mt-1 h-3 w-1/2 animate-pulse bg-superficie" />
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Passo 2: Escrever a página do catálogo**

`searchParams` é uma Promise no Next.js 16 — precisa de `await`.

```tsx
// app/page.tsx
import { GradeFilmes } from '@/components/grade-filmes'
import {
  buscarFilmes,
  normalizarFiltros,
  type ParametrosCrus,
} from '@/lib/tmdb'

export default async function PaginaCatalogo({
  searchParams,
}: {
  searchParams: Promise<ParametrosCrus>
}) {
  const filtros = normalizarFiltros(await searchParams)
  const { filmes } = await buscarFilmes(filtros)

  return (
    <div className="px-6 py-10 md:px-10">
      <h1 className="titulo-display text-4xl md:text-6xl">ta-no-stream</h1>
      <p className="mt-3 text-cinza">
        Filmes disponiveis por assinatura no Brasil agora.
      </p>

      <div className="mt-10">
        {filmes.length > 0 ? (
          <GradeFilmes filmes={filmes} />
        ) : (
          <EstadoVazio />
        )}
      </div>
    </div>
  )
}

/** Nenhum resultado nao e erro. E resposta valida, e precisa oferecer saida. */
function EstadoVazio() {
  return (
    <div className="border border-superficie p-10 text-center">
      <p className="titulo-display text-2xl">Nenhum filme encontrado</p>
      <p className="mt-3 text-cinza">
        Nao ha filmes que atendam a essa combinacao de filtros.
      </p>
    </div>
  )
}
```

- [ ] **Passo 3: Escrever a tela de carregamento**

O Next.js usa este arquivo sozinho enquanto `page.tsx` busca os dados. Nenhum `if` necessário.

```tsx
// app/loading.tsx
import { EsqueletoGrade } from '@/components/esqueleto-grade'

export default function Carregando() {
  return (
    <div className="px-6 py-10 md:px-10">
      <div className="h-12 w-64 animate-pulse bg-superficie" />
      <div className="mt-3 h-4 w-96 max-w-full animate-pulse bg-superficie" />
      <div className="mt-10">
        <EsqueletoGrade />
      </div>
    </div>
  )
}
```

- [ ] **Passo 4: Escrever a tela de erro**

Precisa de `'use client'`: só componentes de cliente conseguem capturar erros e oferecer o botão de nova tentativa.

```tsx
// app/error.tsx
'use client'

export default function Erro({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="px-6 py-20 md:px-10">
      <p className="titulo-display text-3xl">Nao conseguimos carregar os filmes</p>
      <p className="mt-3 max-w-xl text-cinza">
        A base de dados nao respondeu. Isso costuma ser temporario.
      </p>
      <button
        onClick={reset}
        className="mt-8 border border-branco/50 px-6 py-4 text-sm uppercase tracking-wide text-branco transition-colors hover:bg-superficie"
      >
        Tentar de novo
      </button>
    </div>
  )
}
```

- [ ] **Passo 5: Ver funcionando**

```bash
npm run dev
```

Abra `http://localhost:3000`. Esperado: **uma grade de pôsteres de filmes reais**, fundo preto, título em caixa alta, duas colunas no celular e quatro no desktop. Passe o mouse sobre um pôster — ele deve **escurecer**, não crescer.

- [ ] **Passo 6: Rodar todas as verificações**

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

Esperado: testes passam, sem erro de tipo, sem erro de lint, build conclui.

- [ ] **Passo 7: Commit**

```bash
git add -A
git commit -m "Adiciona pagina do catalogo com grade, carregamento e erro"
```

---

## Fim do Plano 1

Ao concluir, você tem um site rodando localmente que mostra filmes reais disponíveis por assinatura no Brasil, com o design system aplicado e a atribuição obrigatória do TMDB no lugar.

**O Plano 2 cobrirá:** herói no topo, os quatro filtros com shadcn/ui, a ficha do filme, a busca por título, o seletor "meus serviços" e a publicação no GitHub e na Vercel.
