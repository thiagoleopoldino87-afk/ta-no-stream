# ta-no-stream — Estado do Projeto

**Leia este arquivo primeiro** ao retomar o trabalho — antes de reler specs, planos ou
histórico de commits. Ele existe para isso: economizar a releitura de tudo.

**Última atualização:** 2026-09-13 (fim do Plano 2 — autenticação)

---

## O que é

Catálogo de filmes disponíveis por assinatura no streaming, no Brasil. Next.js 16 +
TypeScript + Tailwind v4 + Supabase, alimentado pela API do TMDB. O autor é iniciante em
programação e está aprendendo através deste projeto — toda decisão técnica vem acompanhada
do porquê nas specs, não só do quê.

**Site no ar:** https://ta-no-stream.vercel.app (catálogo público, funcionando)
**Repositório:** https://github.com/thiagoleopoldino87-afk/ta-no-stream
**Ramo único:** tudo acontece direto em `main` — não há feature branches. `main` está
ligado à Vercel, então todo `git push` publica em produção. Por isso o processo aqui é
sempre: implementar local → revisar → só then decidir publicar.

---

## Status por plano

### Plano 1 — Fundação do catálogo: ✅ concluído e publicado

- Spec: `docs/superpowers/specs/2026-09-07-ta-no-stream-design.md`
- Plano: `docs/superpowers/plans/2026-09-07-fundacao-catalogo.md`
- Sistema visual **não é mais** preto-e-dourado (Lamborghini): pivotou para azul-noite +
  rosa depois que o autor viu o primeiro na tela e não gostou. O histórico completo dessa
  troca está na seção 7 da spec — vale ler antes de mexer em qualquer cor.
- Catálogo, filtros (serviço/gênero/ano/nota), herói, ficha do filme, atribuição
  obrigatória do TMDB — tudo funcionando em produção.

### Plano 2 — Autenticação: ✅ concluído localmente, ⏸️ **não publicado**

- Spec: `docs/superpowers/specs/2026-09-09-contas-e-marcacoes-design.md`
- Plano: `docs/superpowers/plans/2026-09-10-autenticacao.md`
- 6 tarefas via subagent-driven-development, mais revisão de branch inteira, mais uma
  leva de correção (achou e fechou um *password reset poisoning* real), mais re-revisão.
  Tudo aprovado para publicação.
- **18 commits locais**, à frente do `origin/main`. Decisão explícita: aguardar as
  pendências abaixo antes do push.
- Funciona hoje, testado localmente: cadastro, login, sessão no cabeçalho, sair,
  recuperação de senha (fluxo completo com callback PKCE).
- RLS da tabela `marcacoes` verificado por testes automatizados que atacam o banco com
  a chave pública real (nunca `service_role`) — `npm run test:rls`.

### Plano 3 — Marcações e abas ("quero assistir" / "já assisti"): 🔲 não iniciado

O **design já existe** — está na mesma spec do Plano 2 (ela cobre contas e marcações
juntas). Falta só escrever o plano de implementação e executar. Não precisa de nova
sessão de brainstorming.

---

## Pendências concretas, nesta ordem

- [ ] **Vercel → Settings → Environment Variables:** `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SITE_URL=https://ta-no-stream.vercel.app`
      (valores em `.env.local`, exceto o `SITE_URL` — lá é `localhost:3000`)
- [ ] **Supabase (projeto `xifbruxdptxnptabvwpb`) → Authentication → URL Configuration
      → Redirect URLs:** adicionar `https://ta-no-stream.vercel.app/auth/callback`.
      **Sem isso o Supabase ignora o link de recuperação em silêncio** — sem erro nenhum.
- [ ] `git push origin main` (publica automaticamente)
- [ ] Testar a recuperação de senha com e-mail real, **no mesmo navegador** que pediu o
      link (ver limitação conhecida abaixo)
- [ ] **Regenerar o token do TMDB** — foi exposto em texto de conversa em 2026-09-07.
      themoviedb.org → Settings → API → regenerar → atualizar `.env.local` e a variável
      na Vercel → redeploy. Risco baixo (read-only, gratuito), mas pendente há dias.
- [ ] Limpar contas de teste em Authentication → Users, nos dois projetos Supabase
- [ ] **Não apagar nenhum dos dois projetos Supabase** — `xifbruxdptxnptabvwpb` é o do
      app, `lnsozvcdtgqhtnnrkulq` é exclusivo para os testes de RLS atacarem de fora.
      Os dois são necessários, não é redundância.

---

## Decisões que valem lembrar (não redecidir do zero)

- **Ramo único, sem feature branch** — ver acima.
- **Sem login com Google, sem SMTP próprio** — adiado, não cancelado. Exigem domínio
  próprio e projeto no Google Cloud; nenhum dos dois exige mudança de código quando
  entrarem (spec do Plano 2, seção 3).
- **Confirmação de e-mail desligada** no Supabase — cadastro instantâneo. Trade-off
  aceito para projeto de estudo (spec, seção 4).
- **Duas contas/projetos Supabase, de propósito** — um para o app, outro só para os
  testes de RLS, que precisam da chave pública real, nunca `service_role`.
- **`SITE_URL` nunca vem de `headers()`/`origin`/`request.url`** — é a defesa contra o
  *password reset poisoning* que a revisão final encontrou e fechou. Qualquer código
  novo que monte um link de redirecionamento segue essa mesma regra.

---

## Limitações conhecidas (aceitas, não são bugs)

- **Recuperação de senha só funciona no mesmo navegador** que pediu o link — é como o
  fluxo PKCE do Supabase funciona, não um defeito nosso. Se isso incomodar no futuro, a
  correção é trocar para o fluxo `token_hash`/`verifyOtp`, que é trabalho de outra escala.
- **Sem SMTP próprio, ~2 e-mails por hora no site inteiro** (cadastro por confirmação
  está desligado, mas recuperação de senha ainda usa e-mail).
- **O projeto Supabase gratuito hiberna após 7 dias sem acesso.** O catálogo sobrevive
  a isso (testado); login e recuperação de senha ficam indisponíveis até reativar.

---

## Como retomar uma sessão nova

1. Leia este arquivo inteiro — é curto de propósito.
2. Vai mexer em autenticação ou marcações? Leia a spec do Plano 2 antes de tocar em código.
3. Vai começar o Plano 3? O design já está pronto na spec do Plano 2 — só falta o plano
   de implementação.
4. Precisa do detalhe técnico de uma decisão específica do Plano 2 (por que um teste foi
   escrito assim, o que cada rodada de correção mudou)? Só então abra
   `.superpowers/sdd/2026-09-10-autenticacao/progress.md` — é o diário completo,
   verboso de propósito, não para leitura corrida.
