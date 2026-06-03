import { describe, it, expect, beforeAll } from 'vitest'
import { signSession, verifySession } from '../auth'

beforeAll(() => {
  process.env.APP_SECRET = 'test-secret-at-least-32-chars-long-for-hs256!!'
})

describe('signSession', () => {
  it('returns a JWT string', async () => {
    const token = await signSession()
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)
  })
})

describe('verifySession', () => {
  it('returns true for a valid token', async () => {
    const token = await signSession()
    const result = await verifySession(token)
    expect(result).toBe(true)
  })

  it('returns false for an invalid token', async () => {
    const result = await verifySession('invalid.token.here')
    expect(result).toBe(false)
  })

  it('returns false for expired tokens', async () => {
    const { SignJWT } = await import('jose')
    const secret = new TextEncoder().encode(process.env.APP_SECRET!)
    const expired = await new SignJWT({ sub: 'user' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Date.now() / 1000 - 3600)
      .setExpirationTime('-1h')
      .sign(secret)
    const result = await verifySession(expired)
    expect(result).toBe(false)
  })
})
