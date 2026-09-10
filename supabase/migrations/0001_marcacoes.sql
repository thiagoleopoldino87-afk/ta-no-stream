-- ============================================================
-- ta-no-stream — marcacoes de filmes por usuario
--
-- Rodar no SQL Editor do Supabase, nos DOIS projetos:
--   1. ta-no-stream          (o do app)
--   2. ta-no-stream-testes   (o dos testes automatizados de RLS)
--
-- Ver: docs/superpowers/specs/2026-09-09-contas-e-marcacoes-design.md
-- ============================================================

create table if not exists marcacoes (
  id          uuid        primary key default gen_random_uuid(),

  -- Aponta para a tabela de usuarios que o proprio Supabase mantem.
  -- on delete cascade: conta apagada leva as marcacoes junto, automaticamente.
  -- Nao e gentileza, e exigencia da LGPD — e o banco cumpre sozinho.
  usuario_id  uuid        not null references auth.users(id) on delete cascade,

  -- So o numero do filme no TMDB. Nenhuma copia de titulo, poster ou sinopse:
  -- esses dados sao do TMDB e sao buscados na hora, com cache de 24h.
  filme_id    integer     not null,

  -- O banco RECUSA qualquer valor fora desta lista. Um erro de digitacao no
  -- codigo falha na gravacao, em vez de criar um estado fantasma que nenhuma
  -- consulta encontra.
  status      text        not null check (status in ('quero_assistir', 'ja_assisti')),

  criado_em   timestamptz not null default now(),

  -- A peca mais importante: UMA linha por pessoa por filme.
  -- E isto que torna as marcacoes excludentes no nivel do banco — nao existe
  -- forma de o mesmo filme estar em dois estados, nem que o codigo tente.
  unique (usuario_id, filme_id)
);

-- Serve a consulta que abre cada aba: "as marcacoes DESTE usuario com ESTE
-- status". Sem ele, o banco varreria a tabela inteira a cada abertura.
create index if not exists marcacoes_usuario_status
  on marcacoes (usuario_id, status);

-- ============================================================
-- Row Level Security
--
-- Nao e uma camada extra: e A seguranca. A chave publicavel do projeto e
-- publica por definicao — qualquer pessoa pode copia-la do navegador. O que
-- impede essa pessoa de ler a tabela inteira e exclusivamente o RLS.
--
-- Sem estas politicas o app funciona perfeitamente E vaza tudo em silencio.
-- Nao ha sintoma. Por isso a verificacao e automatizada.
-- ============================================================

alter table marcacoes enable row level security;

drop policy if exists "somente as proprias marcacoes" on marcacoes;

create policy "somente as proprias marcacoes"
  on marcacoes
  for all
  to authenticated
  using      (auth.uid() = usuario_id)   -- o que pode ser LIDO e alterado
  with check (auth.uid() = usuario_id);  -- impede gravar em nome de outro

-- auth.uid() e a identidade de quem esta pedindo agora.
-- using  -> filtra as linhas que a pessoa enxerga
-- with check -> valida as linhas que a pessoa tenta gravar
--
-- Repare no "to authenticated": visitantes sem conta nao alcancam esta tabela
-- de forma nenhuma. O catalogo continua aberto porque ele nem passa por aqui.
