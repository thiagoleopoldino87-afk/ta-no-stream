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
