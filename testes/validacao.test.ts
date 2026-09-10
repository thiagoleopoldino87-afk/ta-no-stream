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
