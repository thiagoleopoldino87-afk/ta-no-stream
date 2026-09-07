# ta-no-stream — Documento de Design

**Data:** 2026-09-07
**Status:** Aprovado, aguardando plano de implementação
**Autor:** Thiago Leopoldino, com Claude

---

## 1. O que é

Um catálogo navegável dos filmes disponíveis nos serviços de streaming no Brasil.
A pessoa entra, vê filmes, filtra por serviço, gênero, ano e nota, e descobre onde
assistir cada um.

**A pergunta que o app responde:** "quero navegar o que está disponível agora".

## 2. Escopo

### Dentro
- Apenas **filmes** (sem séries)
- Apenas disponibilidade por **assinatura** (`flatrate`) — sem aluguel nem compra
- Apenas a região **Brasil** (`watch_region=BR`)
- Uma lista curada de **10 a 15 serviços principais**, definida a partir da resposta
  de `/watch/providers/movie?watch_region=BR`
- Duas telas: catálogo e ficha do filme
- **Quatro filtros:** serviço, gênero, ano e nota
- Busca por título, com a limitação descrita abaixo
- Seletor "meus serviços" salvo no navegador

### Limitação conhecida da busca

O TMDB **não permite buscar texto e filtrar por serviço de streaming ao mesmo tempo** —
`/search/movie` e `/discover/movie` são endpoints distintos que não se combinam.

Consequência: ao buscar "Matrix", o app consulta o acervo global do TMDB e depois
verifica a disponibilidade de cada resultado. Funciona, mas gasta mais chamadas e é
mais lento que o resto do app. É o preço da arquitetura sem banco próprio, e o dia em
que isso incomodar é o dia de migrar para o descrito na seção 12.

### Fora (decidido de propósito)
Séries, aluguel/compra, outras regiões, provedores de nicho, login, lista "quero ver",
"entrou essa semana", recomendações personalizadas, avaliações do usuário, perfis.

Nenhum desses é ruim. Cada um dobra o trabalho, e nenhum importa se as duas telas
principais não estiverem boas.

## 3. Restrições impostas pelo TMDB

Verificadas na documentação oficial em 2026-09-07:

1. **Uso comercial é proibido** no plano gratuito. Sem anúncios, sem cobrança.
   Monetizar exige contrato separado com o TMDB.
2. **Atribuição obrigatória:** logo do TMDB + o aviso "este aplicativo usa o TMDB e as
   APIs do TMDB, mas não é endossado, certificado ou aprovado pelo TMDB". Para os dados
   de disponibilidade, atribuição adicional ao **JustWatch**. O TMDB declara que revoga
   o acesso de quem não cumpre.
3. **Sem deep link para o streaming.** A API não fornece e o TMDB pede que se linke
   para a página de watch deles.
4. **Cache máximo de 6 meses** para qualquer dado obtido da API.
5. **Limite de 500 páginas por consulta** (~10.000 resultados). Irrelevante para a
   abordagem escolhida, mas trava qualquer tentativa futura de sincronizar o acervo
   inteiro numa única query.
6. **Rate limit** de aproximadamente 40 requisições por segundo, sem teto diário.

## 4. Decisões e justificativas

| Decisão | Escolha | Por quê |
|---|---|---|
| Arquitetura de dados | Proxy fino, sem banco próprio | Os quatro filtros escolhidos (serviço, gênero, ano, nota) já existem no `/discover`. Um banco só se justificaria para busca dentro do provedor e para "novidades da semana", que estão fora de escopo. |
| Framework | Next.js (App Router) | Server Components eliminam a camada de proxy manual; ISR resolve cache e velocidade; é o framework React mais documentado, o que importa muito para um autor iniciante. |
| Linguagem | TypeScript | Pega erros antes de rodar — inclusive os erros do assistente que escreve o código. |
| Estilo | Tailwind CSS v4 | Combinação mais documentada do ecossistema React. |
| Componentes | shadcn/ui (sobre Radix) | Copia o código-fonte para o projeto em vez de virar dependência opaca: dá para ler, entender e editar. |
| Testes | Vitest | Mais simples de configurar e o mais rápido hoje. |
| Hospedagem | Vercel | Empresa criadora do Next.js; deploy conectado ao GitHub sem configuração. |
| Contas de usuário | Nenhuma no v1 | Zero atrito. O terreno fica preparado (ver seção 8). |
| Primeira visita | Mostra tudo | Nenhum pedágio antes do conteúdo. Personalizar é opcional e persiste. |

## 5. Arquitetura

### Camadas

```
Navegador  →  Server Component  →  lib/tmdb/  →  API do TMDB
  (só HTML)    (roda no servidor)  (nosso formato)
```

1. **Telas** — nunca conhecem o TMDB. Chamam funções de `lib/tmdb/` e recebem o
   *nosso* formato de dados.
2. **`lib/tmdb/`** — única fronteira com a API externa. Traduz a resposta do TMDB para
   os nossos tipos. É esta camada que torna aditiva uma futura migração para banco
   próprio: reescreve-se o interior dela e nenhuma tela muda.
3. **Server Components** — rodam no servidor por padrão, então a chave da API nunca é
   enviada ao navegador.

### Rotas

```
app/
├── page.tsx              →  /              catálogo com filtros
├── loading.tsx           →  esqueleto do catálogo
├── error.tsx             →  falha ao carregar
└── filme/
    └── [id]/
        ├── page.tsx      →  /filme/27205   ficha do filme
        ├── loading.tsx
        └── not-found.tsx →  filme inexistente
```

### Estado dos filtros

Os filtros vivem **na URL**, não na memória do React:
`/?servico=8&genero=28&ano=2024&nota=7`

Isso resolve três coisas de uma vez: o link é compartilhável, o botão voltar do
navegador funciona, e cada combinação é indexável pelo Google.

**A busca não tem tela própria.** Ela é um modo da mesma página de catálogo,
acionado por `/?busca=matrix`. Quando o parâmetro `busca` está presente, a página
consulta `/search/movie` em vez de `/discover/movie` e os filtros de serviço ficam
desabilitados, com aviso explicando o motivo (ver a limitação na seção 2). Isso mantém
a promessa de duas telas apenas.

### Endpoints do TMDB usados

| Endpoint | Uso |
|---|---|
| `GET /discover/movie` | Catálogo com filtros |
| `GET /movie/{id}` | Ficha (com `append_to_response=credits,videos,watch/providers`) |
| `GET /search/movie` | Busca por título |
| `GET /watch/providers/movie` | Lista de serviços do Brasil |
| `GET /genre/movie/list` | Lista de gêneros |

Parâmetros fixos em todas as chamadas: `language=pt-BR`, `region=BR`,
`watch_region=BR`, `with_watch_monetization_types=flatrate`.

Imagens: `https://image.tmdb.org/t/p/{tamanho}{caminho}`.

**Os IDs numéricos dos serviços serão obtidos de `/watch/providers/movie?watch_region=BR`
durante a implementação — não devem ser inventados nem copiados de memória.**

### Revalidação (ISR)

- Catálogo: revalida a cada **6 horas**
- Ficha do filme: revalida a cada **24 horas**

Catálogo de streaming não muda de minuto em minuto. Isso torna as páginas quase
instantâneas e reduz drasticamente as chamadas ao TMDB.

## 6. Telas

### Catálogo (`/`)

É a home. Não existe página de boas-vindas: uma tela que só leva a outra tela é pedágio.

- **Filtros:** serviço, gênero, ano e nota. Barra horizontal visível no desktop; botão
  "FILTROS" que abre gaveta no celular. O botão exibe a contagem de filtros ativos.
- **Busca:** ícone no cabeçalho. Ao buscar, a mesma página troca a fonte de dados e
  desabilita o filtro de serviço, explicando por quê.
- **Grade:** 2 colunas no celular, 4 no desktop, com espaçamento generoso
- **Paginação:** carregar mais resultados

### Ficha do filme (`/filme/[id]`)

Sinopse, ano, duração, nota, elenco principal, trailer e **onde assistir** — com link
para a página do TMDB, nunca direto para o streaming.

### Seletor "meus serviços"

Não é tela, é configuração persistente. A pessoa marca o que assina e o catálogo passa
a mostrar só o que ela pode ver. Guardado no navegador.

## 7. Design system

Base: `DESIGN-lamborghini.md`. Preto absoluto, dourado como única cor, tipografia
grande em caixa alta, cantos retos.

### Cores

| Papel | Cor |
|---|---|
| Fundo da página | `#000000` |
| Superfície elevada (cartão, gaveta) | `#202020` |
| Texto principal | `#FFFFFF` |
| Texto secundário (ano, duração, gênero) | `#7D7D7D` |
| **Botão "Onde assistir"** | `#FFC000` |
| **Filtro ativo** | `#FFC000` |
| Borda de campo | branco a 50% de opacidade |

O dourado aparece em **exatamente dois lugares** no app inteiro. É essa disciplina que
faz a cor significar alguma coisa.

### Tipografia

`Archivo` (Google Fonts) substitui a `LamboType`, que é proprietária da Lamborghini e
não pode ser usada. Escolhida por ser variável em **peso e largura**, permitindo
reproduzir a compressão dos títulos grandes do sistema original.

### Adaptações conscientes do sistema

Três regras do documento original entram em conflito com um catálogo. Foram resolvidas,
não ignoradas:

1. **"Não crie layouts ocupados com muitos elementos pequenos."** No site original,
   quem carrega o peso emocional é a fotografia do carro. Aqui, esse papel é do
   **pôster do filme**. A grade respeita a regra desde que os pôsteres sejam grandes e
   o preto entre eles generoso — 2 colunas no celular, 4 no desktop, nunca miniaturas
   espremidas.
2. **"Sem animação de hover com escala ou deslocamento."** O pôster não cresce: ele
   **escurece** e revela título e disponibilidade em branco por cima. Mudança de cor e
   opacidade apenas — dentro da regra, e funciona melhor no celular, onde hover não existe.
3. **Hero em vídeo de tela cheia.** Removido. Contradiz a decisão de não colocar pedágio
   antes do conteúdo. O peso cinematográfico vem do próprio preto absoluto.

### Cantos

`0px` em tudo — botões, cartões, imagens. Pôster de cinema é retangular; a regra cai bem.

## 8. Preparação para autenticação futura

Não há login no v1, mas nenhuma tela conversa diretamente com o armazenamento do
navegador. Existe um módulo `lib/preferencias/` com uma interface única:

- `meusServicos()` / `definirMeusServicos(lista)`
- (futuro) `minhaLista()` / `adicionarNaLista(id)`

Hoje há uma só implementação, gravando no navegador. Quando o login entrar, escreve-se
uma segunda implementação com Supabase (`user_id` + RLS) e troca-se uma linha. Os
objetos já nascem no formato que a tabela terá, então a migração no dia do login é
subir o conteúdo local para a conta, uma única vez.

## 9. Erros e estados

| Situação | Resposta |
|---|---|
| Filtro sem resultados | **Estado vazio**, não erro. Explica e oferece saída ("remover filtro de ano", "limpar tudo"). |
| TMDB fora do ar ou lento | Mensagem humana e acionável + botão "tentar de novo". Nunca texto técnico. |
| Carregando | **Esqueleto** no formato exato dos pôsteres. Nunca tela branca. |
| Filme inexistente na URL | `not-found.tsx` |
| Trailer não carrega | **Degradação graciosa**: só o trailer some, a ficha continua inteira. |
| Filme sem pôster no TMDB | Retângulo `#202020` com o título em branco, centralizado. Nunca ícone de imagem quebrada. |

Os três primeiros são arquivos de nome reservado do Next.js (`loading.tsx`,
`error.tsx`, `not-found.tsx`) — o framework os usa automaticamente, sem `if` nenhum.

## 10. Testes

Princípio: **testar o que quebra em silêncio.**

**Serão testados:**
- A tradução dos dados do TMDB para o nosso formato. É pura (entra dado, sai dado, sem
  rede) e é onde moram os erros silenciosos: filme sem data, sem pôster, com nota zero.
  Se ela falhar, o app mostra dado errado sem reclamar.
- A montagem dos parâmetros de filtro. Se ela errar, vêm os filmes errados e não há como
  perceber olhando a tela.

**Não serão testados:**
- Aparência. Caro, frágil a cada ajuste de estilo, e visível a olho nu.
- A API do TMDB. Não é nosso código e não a controlamos.

Ferramenta: **Vitest**. Os testes são escritos **antes** do código que testam.

## 11. Conformidade — checklist obrigatório antes de publicar

- [ ] Logo do TMDB visível, menos proeminente que a marca do app
- [ ] Texto: "Este aplicativo usa o TMDB e as APIs do TMDB, mas não é endossado, certificado ou aprovado pelo TMDB"
- [ ] Atribuição ao **JustWatch** como fonte dos dados de disponibilidade
- [ ] Link de "onde assistir" apontando para a página do TMDB, nunca direto para o streaming
- [ ] Nenhum anúncio e nenhuma cobrança
- [ ] Chave da API apenas em variável de ambiente do servidor, nunca no código nem no navegador
- [ ] Nenhuma marca da Lamborghini utilizada (o sistema visual é referência; touro, nome e logotipos não entram)

## 12. Caminho de evolução

Quando busca dentro de um serviço ou "entrou essa semana" passarem a importar, o passo
é migrar para a **abordagem híbrida**: sincronizar um índice enxuto (id, título, ano,
pôster, nota, gêneros, serviços) para o Postgres e continuar buscando a ficha completa
no TMDB sob demanda. Como todo acesso à API está isolado em `lib/tmdb/`, a mudança é
aditiva e nenhuma tela precisa ser reescrita.
