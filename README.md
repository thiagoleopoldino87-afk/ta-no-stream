# tá no stream

Catálogo público de filmes (o que assistir hoje, por assinatura, no Brasil),
feito em Next.js e alimentado pela API do TMDB. Além do catálogo, o site tem
contas de usuário (cadastro, login e recuperação de senha) via Supabase, para
guardar o que cada pessoa quer assistir e o que já assistiu.

**Regra que vale para o projeto inteiro:** o catálogo em `/` não usa banco de
dados. Se o Supabase cair ou hibernar, os filmes continuam aparecendo — só a
parte de conta (entrar, sair, recuperar senha) fica indisponível.

## Rodando localmente

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Antes disso, copie `.env.example` para `.env.local` e preencha as variáveis
abaixo.

## Variáveis de ambiente

| Variável | Para que serve | Onde conseguir |
| --- | --- | --- |
| `TMDB_TOKEN` | Autentica as chamadas ao catálogo do TMDB. Fica só no servidor. | [themoviedb.org](https://www.themoviedb.org/settings/api) → API → "API Read Access Token" (v4 auth). |
| `NEXT_PUBLIC_SUPABASE_URL` | Endereço do projeto Supabase do app. Vai ao navegador — quem protege os dados é o RLS, não o segredo desta URL. | Painel do Supabase → projeto do app → Project Settings → API → "Project URL". |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave pública (publishable/anon) do mesmo projeto. Também pública por definição. | Mesma tela → "Project API keys" → chave `publishable` (ou `anon`, em projetos mais antigos). **Nunca** a `service_role`. |
| `SUPABASE_TESTES_URL` | Endereço de um projeto Supabase **separado**, usado só pelos testes automatizados de RLS. | Crie um segundo projeto Supabase (ex.: `ta-no-stream-testes`), rode nele as migrations de `supabase/migrations/`, e copie a URL do mesmo jeito que acima. |
| `SUPABASE_TESTES_PUBLISHABLE_KEY` | Chave pública do projeto de testes. | Mesma tela do projeto de testes → chave `publishable`/`anon`. **Nunca** a `service_role`: ela ignora o RLS por definição, e os testes passariam sem provar nada. |
| `SITE_URL` | Endereço canônico do site (ex.: `http://localhost:3000` local, ou o domínio de produção). Usado para montar o link do e-mail de recuperação de senha. | Você mesmo define. **Nunca** deve vir do cabeçalho da requisição — é assim que se evita o ataque de "password reset poisoning". |

## Testes

Há dois comandos separados, de propósito:

```bash
npm test         # testes puros (validação, etc.) — rodam offline, sem Supabase
npm run test:rls # testes de RLS — falam com o Supabase de testes pela internet
```

`npm run test:rls` exige `SUPABASE_TESTES_URL` e
`SUPABASE_TESTES_PUBLISHABLE_KEY` configuradas em `.env.local`, e cria dois
usuários novos no projeto de testes a cada execução (a limpeza é manual, por
enquanto). Por isso ele fica fora do `npm test` comum — veja o comentário no
topo de `testes/rls.test.ts` para mais detalhes.

Outros comandos úteis:

```bash
npm run lint        # eslint
npx tsc --noEmit    # checagem de tipos
npm run build       # build de produção
```
