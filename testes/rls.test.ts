import { createClient } from '@supabase/supabase-js'
import { beforeAll, describe, expect, test } from 'vitest'

/*
 * Este arquivo roda em "npm run test:rls", separado do "npm test" comum.
 *
 * Motivo: ele fala com um Supabase de verdade pela internet, entao (1) nao da
 * para rodar offline, (2) sem SUPABASE_TESTES_URL/SUPABASE_TESTES_PUBLISHABLE_KEY
 * configuradas a suite inteira fica vermelha por um motivo que nao e bug de
 * codigo, e (3) toda execucao cria dois usuarios novos no banco de testes,
 * que ninguem limpa automaticamente (decisao consciente, ver revisao final).
 * Juntar isso ao "npm test" tornaria a suite normal fragil e lenta sem essa
 * ligacao ficar obvia. Se reunificar os dois no futuro, resolva estes tres
 * pontos primeiro.
 *
 * Roda contra o PROJETO DE TESTES, nunca o do app.
 *
 * Usa a mesma chave publicavel que o navegador usa — nunca a service_role.
 * Isso e proposital: o teste ataca o banco exatamente como um invasor
 * atacaria. Se ele nao passa, ninguem passa.
 */
const URL_TESTES = process.env.SUPABASE_TESTES_URL!
const CHAVE_TESTES = process.env.SUPABASE_TESTES_PUBLISHABLE_KEY!

// Codigos de erro do PostgreSQL usados para conferir a CAUSA da falha, nao so
// que "algo deu errado". Um expect(error).not.toBeNull() passaria mesmo se o
// bloqueio viesse de um bug sem relacao com RLS (coluna errada, gatilho
// quebrado) — e o teste afirmaria ter provado algo que nao provou.
const CODIGO_VIOLACAO_RLS = '42501' // insufficient_privilege
const CODIGO_VIOLACAO_UNICIDADE = '23505' // unique_violation
const CODIGO_VIOLACAO_CHECK = '23514' // check_violation

// Cada linha usa um filme_id proprio para nao disputar a mesma linha entre
// testes, o que tornaria o resultado dependente da ordem de execucao. A unica
// excecao deliberada e o teste de unicidade, que precisa mirar a MESMA linha
// que a Alice ja tem, de proposito.
const FILME_ALICE = 278
const FILME_BRUNO = 27205
const FILME_INSERCAO_ALHEIA = 550
const FILME_STATUS_INVALIDO = 999

// Contador para dar um storageKey unico a cada cliente. Sem isso, todo
// createClient() usa a mesma chave de storage por padrao e o SDK acusa
// "Multiple GoTrueClient instances detected" mesmo sem persistir sessao.
let proximoRotulo = 0

function clienteAnonimo() {
  proximoRotulo += 1
  return createClient(URL_TESTES, CHAVE_TESTES, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      storageKey: `sb-teste-rls-${proximoRotulo}`,
    },
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
      throw new Error(
        'Faltam SUPABASE_TESTES_URL e SUPABASE_TESTES_PUBLISHABLE_KEY no .env.local',
      )
    }
    alice = await criarUsuario()
    bruno = await criarUsuario()

    const { error: erroAlice } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: FILME_ALICE, status: 'quero_assistir' })
    if (erroAlice) throw new Error(`Falha ao preparar marcacao da Alice: ${erroAlice.message}`)

    const { error: erroBruno } = await bruno.cliente
      .from('marcacoes')
      .insert({ usuario_id: bruno.id, filme_id: FILME_BRUNO, status: 'ja_assisti' })
    if (erroBruno) throw new Error(`Falha ao preparar marcacao do Bruno: ${erroBruno.message}`)
  })

  test('cada um enxerga apenas a propria marcacao', async () => {
    const { data: daAlice } = await alice.cliente.from('marcacoes').select('filme_id')
    const { data: doBruno } = await bruno.cliente.from('marcacoes').select('filme_id')

    expect(daAlice?.map((m) => m.filme_id)).toEqual([FILME_ALICE])
    expect(doBruno?.map((m) => m.filme_id)).toEqual([FILME_BRUNO])
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
      .insert({ usuario_id: bruno.id, filme_id: FILME_INSERCAO_ALHEIA, status: 'quero_assistir' })

    // 42501 e a violacao de RLS. Conferir o codigo, e nao apenas "houve erro",
    // impede o teste de passar por um motivo diferente do que afirma provar.
    expect(error?.code).toBe(CODIGO_VIOLACAO_RLS)
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
    // Mira de proposito a MESMA linha (FILME_ALICE) criada no beforeAll: e
    // essa reincidencia que deve disparar a restricao de unicidade.
    const { error } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: FILME_ALICE, status: 'ja_assisti' })

    // Barrado pela restricao unique (usuario_id, filme_id)
    expect(error?.code).toBe(CODIGO_VIOLACAO_UNICIDADE)
  })

  test('status invalido e recusado pelo banco', async () => {
    const { error } = await alice.cliente
      .from('marcacoes')
      .insert({ usuario_id: alice.id, filme_id: FILME_STATUS_INVALIDO, status: 'ja_assistiu' })

    // Barrado pela restricao check
    expect(error?.code).toBe(CODIGO_VIOLACAO_CHECK)
  })
})
