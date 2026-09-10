# Contas e marcações — Documento de Design

**Data:** 2026-09-09
**Status:** Aprovado, aguardando plano de implementação
**Autor:** Thiago Leopoldino, com Claude
**Depende de:** `2026-09-07-ta-no-stream-design.md` (o catálogo)

---

## 1. O que é

Contas de usuário no `ta-no-stream`, com duas listas pessoais: **quero assistir** e
**já assisti**. As listas viram abas na navegação principal.

Isto ativa a seção 8 da spec do catálogo, que previa autenticação futura mas deixou o
terreno preparado sem construir nada.

## 2. Por que exige banco de dados

Registrado porque a pergunta vai voltar.

O catálogo hoje não guarda nada: pede tudo ao TMDB a cada visita e esquece. Isso
funciona porque todo o conteúdo **pertence ao TMDB**. Mas "já assisti" é um fato sobre
uma pessoa, que só ela pode gerar e que ninguém mais tem.

A cadeia é causal, não uma escolha de tecnologia:

```
marcar filmes        → o app precisa lembrar
abrir no celular     → a memória não pode ser local (localStorage)
memória não local    → precisa de servidor, ou seja, banco
dados de várias pessoas → o servidor precisa saber de quem
saber de quem        → precisa de login
```

Login sem banco não teria função: ele existe para identificar **de quem** carregar os
dados. Sem dados no servidor, não há o que carregar.

## 3. Escopo

### Dentro
- Cadastro e login por **e-mail e senha**, sem confirmação de e-mail
- Recuperação de senha (limitada, ver seção 12)
- Duas marcações **mutuamente excludentes**: `quero_assistir` e `ja_assisti`
- Três abas na navegação: Em alta, Quero assistir, Já assisti
- Marcar a partir da ficha do filme e a partir do pôster na grade

### Adiado (não cancelado)

**Login com Google** e **envio de e-mail próprio**. Os dois dependem de configuração
externa pesada — projeto no Google Cloud e um domínio comprado — e nenhum dos dois exige
mudança de código: no Supabase são configuração de painel. Podem ser ligados a qualquer
momento sem refazer nada.

### Fora (decidido de propósito)
Nota pessoal do usuário, resenhas, listas personalizadas além das duas, seguir outras
pessoas, perfil público, avatar, exportar dados, notificações.

## 4. Decisões e justificativas

| Decisão | Escolha | Por quê |
|---|---|---|
| Acesso sem conta | Catálogo aberto; login só para marcar | Quem chega pelo Google vê valor em 1 segundo e só cria conta se quiser guardar algo. Preserva a indexação e todo o trabalho já feito. |
| Métodos de login | **E-mail e senha** apenas, por ora | Google foi adiado: exige projeto no Google Cloud, tela de consentimento e URIs de retorno — cerca de 15 minutos de burocracia externa, sem nenhuma linha de código. Quando entrar, o Supabase liga as duas identidades automaticamente se o e-mail coincidir e estiver verificado. |
| Relação entre as marcações | Excludentes | É como Letterboxd e JustWatch funcionam, porque é como as pessoas pensam: "quero ver" é uma pendência, e o que já foi visto saiu da pendência. Também simplifica tabela e abas. |
| Abas quando deslogado | Visíveis; clicar mostra convite | O que está escondido não é descoberto. O convite aparece no momento em que a pessoa já demonstrou interesse. |
| Serviço | Supabase | Banco e login no mesmo produto, RLS nativo, PostgreSQL padrão (conhecimento transferível). |
| Conta Supabase | **Nova**, em `leopoldinofn87@gmail.com` | Separação total do `driveflowai`, cuja conta foi criada pelo Lovable e pode ser gerenciada por eles. O autor faz cada passo da configuração com as próprias mãos, que é parte do objetivo de aprendizado. |
| Confirmação de e-mail | **Desligada** | O serviço de e-mail embutido do Supabase envia 2 mensagens por hora. Com a confirmação ligada, o app inteiro aceitaria 2 cadastros por hora. A saída seria um SMTP próprio, mas o Resend — e qualquer alternativa séria — exige **domínio comprado e verificado**, o que não se justifica num projeto de estudo. Desligar torna o cadastro instantâneo e não custa nada. |
| Cookies de sessão | Padrão oficial do Supabase | Sair da receita documentada em autenticação costuma abrir buracos piores que o que se pretendia fechar. Ver limitação conhecida na seção 9. |
| Limites de tentativa | Padrões do Supabase | 30 tentativas de login por 5 minutos por IP já barram ataque de força bruta, sem código nosso. |
| Verificação do RLS | Testes automatizados contra projeto de testes na nuvem | Docker Desktop precisa de ~4 GB de memória; a máquina do autor tem 7,7 GB no total e 0,8 GB livre. Testar na nuvem entrega a mesma garantia sem instalar nada. |

## 5. Modelo de dados

Uma tabela:

```sql
create table marcacoes (
  id          uuid        primary key default gen_random_uuid(),
  usuario_id  uuid        not null references auth.users(id) on delete cascade,
  filme_id    integer     not null,
  status      text        not null check (status in ('quero_assistir', 'ja_assisti')),
  criado_em   timestamptz not null default now(),

  unique (usuario_id, filme_id)
);

create index marcacoes_usuario_status on marcacoes (usuario_id, status);
```

Cada restrição existe por um motivo:

| Cláusula | O que impede |
|---|---|
| `references auth.users(id)` | Marcação órfã, apontando para usuário que não existe |
| `on delete cascade` | Dados sobrevivendo à conta apagada — exigência da LGPD, cumprida pelo banco |
| `check (status in ...)` | Valor inválido virar estado fantasma que nenhuma consulta encontra |
| `unique (usuario_id, filme_id)` | O mesmo filme em dois estados. **A regra de exclusão mútua é física, não depende do código lembrar dela** |
| `index (usuario_id, status)` | Varredura da tabela inteira a cada abertura de aba |

**Guardamos apenas o número do filme.** Nenhuma cópia de título, pôster ou sinopse: os
dados continuam sendo do TMDB e são buscados na hora, com o cache de 24h que o Next
compartilha entre todos os usuários. Copiar traria dados envelhecidos e esbarraria no
limite de cache de 6 meses imposto pelo TMDB.

Volume esperado: mil usuários com cem filmes cada dá 100 mil linhas — irrelevante para
os 500 MB do plano gratuito.

## 6. Segurança

### As chaves e onde cada uma vive

| Variável | Vai para o navegador? | Por quê |
|---|---|---|
| `TMDB_TOKEN` | ❌ Não | Sem o prefixo `NEXT_PUBLIC_`, o compilador a remove do pacote |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Sim | É um endereço, não um segredo |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Sim | **Pública por projeto.** Identifica o projeto; não concede acesso a dado nenhum sozinha |
| `SUPABASE_SERVICE_ROLE_KEY` | ❌ **Nunca** | Ignora o RLS por completo. **Não será usada em lugar nenhum do projeto** |

No Next.js, o prefixo `NEXT_PUBLIC_` não é convenção: é instrução ao compilador. O que
não o tem é fisicamente removido do pacote do navegador.

Local dos arquivos: `.env.local` na máquina (ignorado pelo Git pela regra `.env*`),
painel da Vercel em produção, e `.env.example` no repositório apenas com os **nomes**.

### O RLS é a segurança, não um extra

A chave publicável é pública. Qualquer pessoa pode copiá-la do navegador. **O que impede
essa pessoa de ler a tabela inteira é exclusivamente o RLS.**

```sql
alter table marcacoes enable row level security;

create policy "somente as proprias marcacoes"
  on marcacoes for all
  using (auth.uid() = usuario_id)
  with check (auth.uid() = usuario_id);
```

`auth.uid()` é a identidade de quem está pedindo. `using` filtra o que pode ser lido e
alterado; `with check` impede gravar uma linha em nome de outra pessoa.

Sem essas políticas, o app funciona perfeitamente **e vaza tudo em silêncio**. Não há
sintoma. É por isso que a seção 10 exige verificação automatizada.

### Limites de tentativa

Padrões do Supabase, confirmados na documentação em 2026-09-09:

| Operação | Limite | Ajustável |
|---|---|---|
| Login e cadastro | 30 por 5 min, por IP | Sim |
| Renovação de sessão | 150 por 5 min, por IP | Sim |
| E-mail de recuperação | 2/hora no serviço embutido | Não, sem SMTP próprio |

Excedido o limite, a resposta é HTTP 429. Isso barra força bruta sem código nosso.

### Cookies

Receita oficial do `@supabase/ssr`, com `Secure` e `SameSite=Lax`.

**Limitação conhecida e aceita:** os cookies **não são `httpOnly`** — decisão de projeto
do Supabase, documentada, porque o cliente do navegador precisa ler o token para renovar
a sessão. Consequência: uma falha de XSS permitiria roubo de sessão.

Foi aceita porque: o React escapa conteúdo por padrão; o app não exibe texto escrito por
usuários; e uma sessão roubada dá acesso a uma lista de filmes, não a dinheiro ou dados
sensíveis. A alternativa — fazer tudo por Server Actions com cookies `httpOnly` — sai da
receita documentada, e improvisar em autenticação costuma criar riscos maiores.

## 7. Arquitetura

### Rotas

```
app/
├── page.tsx                    →  /                 aba "Em alta" (catálogo atual)
├── quero-assistir/page.tsx     →  /quero-assistir   aba
├── ja-assisti/page.tsx         →  /ja-assisti       aba
├── entrar/page.tsx             →  /entrar           login e cadastro na mesma tela
└── entrar/recuperar/page.tsx   →  redefinição de senha
middleware.ts                   →  renova a sessão a cada requisição
```

Quando o login com Google entrar, ele acrescenta uma rota `auth/callback/route.ts` para
receber o retorno — nada do que existe precisa mudar.

```
```

Abas são **rotas**, não parâmetros: o link fica compartilhável, o botão voltar funciona,
cada aba ganha o próprio esqueleto de carregamento, e o Google indexa o catálogo sem
confundi-lo com listas pessoais.

### Módulos

| Arquivo | Responsabilidade |
|---|---|
| `lib/supabase/navegador.ts` | Cliente para código que roda no navegador |
| `lib/supabase/servidor.ts` | Cliente para Server Components e Server Actions |
| `lib/marcacoes/consultas.ts` | Ler marcações: lista por status, conjunto de IDs |
| `lib/marcacoes/acoes.ts` | Server Actions de marcar e desmarcar |
| `lib/marcacoes/estados.ts` | Funções puras: estado do botão, mapa de IDs **[TESTADO]** |
| `components/abas.tsx` | Navegação entre as três abas |
| `components/botao-marcar.tsx` | Os dois botões da ficha |
| `components/botao-fila.tsx` | O botão único do pôster |
| `components/convite-login.tsx` | O convite exibido no lugar da lista |

### Uma consulta, não vinte

Para desenhar o botão correto em cada pôster, a página precisa saber quais filmes já
foram marcados. Feito ingenuamente seriam 20 consultas, uma por pôster.

A página faz **uma** consulta trazendo os IDs marcados do usuário, converte num `Set` e
passa pronto para a grade. Vinte pôsteres, uma ida ao banco.

## 8. Telas

### Abas no cabeçalho

Ficam ao lado da marca, na mesma faixa — não numa segunda linha, que comeria altura no
celular. No celular rolam na horizontal. O herói continua exclusivo da aba "Em alta".

### Marcar um filme

- **Na ficha:** dois botões, `Quero assistir` e `Já assisti`. Clicar em um desmarca o
  outro, porque os estados são excludentes. Clicar no já ativo desmarca.
- **No pôster da grade:** **um** botão pequeno no canto, só para a fila. Dois botões num
  pôster de 200px ficariam apertados demais para acertar no celular. O controle completo
  fica na ficha.

### Ordem e tamanho das listas

**Ordem: marcação mais recente primeiro** (`criado_em desc`). É a única ordem que faz
sentido sem o usuário escolher: o que acabou de entrar na fila é o que está na cabeça
dele. Ordenar por título deixaria os filmes recém-marcados perdidos no meio do alfabeto.

**Limite de 24 filmes por página**, com botão de carregar mais. O limite não é estético:
como guardamos apenas o número do filme, cada item exibido custa uma busca ao TMDB.
Mostrar uma lista de 500 de uma vez dispararia 500 chamadas simultâneas. Vinte e quatro
cabe em três linhas da grade no desktop e mantém a página rápida.

O índice `(usuario_id, status)` da seção 5 serve exatamente a essa consulta.

### Deslogado

Nada de redirecionar para `/entrar` — redirecionar arranca a pessoa do contexto. A
própria aba mostra o convite no lugar da lista, com o botão de entrar. Idem ao tentar
marcar um filme.

### Tela de entrar

Uma página com alternância entre "entrar" e "criar conta", em vez de duas rotas quase
idênticas. Contém: e-mail, senha, botão principal e o link de recuperação. O botão
"Entrar com Google" entra depois, no mesmo lugar.

## 9. Erros e estados

| Situação | Resposta |
|---|---|
| Senha errada **ou** e-mail inexistente | **A mesma mensagem** para os dois: "E-mail ou senha incorretos". Mensagens distintas permitiriam descobrir quem tem conta no site (enumeração de usuários) |
| E-mail já cadastrado | "Esse e-mail já tem conta. Quer entrar?" com link direto |
| **Supabase fora do ar ou hibernado** | O catálogo continua funcionando; apenas os botões de marcar somem, com aviso discreto |
| Sessão expirada durante a navegação | O `middleware.ts` renova sozinho; se não conseguir, trata como deslogado, sem erro na tela |
| Lista vazia | Estado vazio, não erro: "Sua fila está vazia. Marque filmes enquanto navega." |
| Filme marcado sumiu do TMDB | Pula o item em silêncio |
| Gravação da marcação falha | **Interface otimista com reversão**: o botão muda na hora; se a gravação falhar, volta ao estado anterior e avisa |

### Isolamento de falhas

O catálogo depende do TMDB. As marcações dependem do Supabase. São independentes, e a
regra é: **se o Supabase cair, o catálogo continua funcionando.**

Isto não é hipótese. O projeto gratuito **hiberna após 7 dias sem acesso**, então quem
abrir o site depois de duas semanas paradas vai encontrar o banco dormindo. Sem
isolamento, a parte que nem precisa de banco cairia junto.

## 10. Testes

### Funções puras, com Vitest

- Estado do botão dado o status do filme (não marcado / na fila / já visto)
- Conversão da lista de marcações em `Set` de IDs para consulta rápida
- Montagem dos endereços das abas

### Verificação automatizada do RLS

O RLS vive dentro do banco, não no nosso código: o Vitest sozinho não tem como
verificá-lo. E ele é a **única** coisa que separa a lista de um usuário da de outro — mal
configurado, o app funciona e vaza em silêncio.

**Um segundo projeto Supabase, exclusivo para testes.** Os testes:

1. Cadastram dois usuários pela porta da frente, com e-mail e senha
2. Cada um insere marcações próprias
3. Verificam que o usuário A recebe **zero linhas** ao consultar as de B
4. Verificam que A não consegue gravar uma linha em nome de B

Usam a **mesma chave publicável que o navegador usa** — nunca a `service_role`. O teste
ataca o banco exatamente como um invasor atacaria: se ele não passa, ninguém passa.

No projeto de testes, a confirmação de e-mail fica desligada, para que o cadastro
automatizado não dependa de caixa de entrada.

## 11. Configuração externa — passos do autor

Não podem ser feitos pelo assistente: exigem e-mail, senha e aceite de termos em nome
do usuário.

- [x] Conta Supabase criada em `leopoldinofn87@gmail.com` — 09/09/2026
- [ ] Projeto `ta-no-stream` criado (o do app), com confirmação de e-mail desligada
- [ ] Projeto `ta-no-stream-testes` criado, com confirmação de e-mail desligada
- [ ] Variáveis do Supabase cadastradas no painel da Vercel

Adiados, sem impacto em código:

- [ ] Domínio próprio + SMTP, para liberar a recuperação de senha em escala
- [ ] Projeto no Google Cloud, para o login com Google

## 12. Limites conhecidos

| Limite | Consequência | Saída se incomodar |
|---|---|---|
| Projeto gratuito hiberna após 7 dias | Marcações indisponíveis até reativar no painel | Plano pago, ou uma visita semanal |
| 2 projetos gratuitos por conta | App e testes ocupam as duas vagas | Plano pago, ou apagar o de testes quando não estiver usando |
| Cookies não são `httpOnly` | Um XSS permitiria roubo de sessão | Migrar tudo para Server Actions |
| Confirmação de e-mail desligada | Alguém pode se cadastrar com endereço que não é seu | Comprar domínio e ligar um SMTP próprio |
| Recuperação de senha a 2/hora | A terceira pessoa a esquecer a senha na mesma hora fica sem o e-mail | Idem acima |
| Lista com muitos filmes | Uma chamada ao TMDB por filme na primeira carga, limitada a 24 por página | Guardar título e pôster na tabela, respeitando o limite de 6 meses do TMDB |
