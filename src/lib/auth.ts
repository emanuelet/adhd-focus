import { SignJWT, jwtVerify } from 'jose'

const secret = () => new TextEncoder().encode(process.env.APP_SECRET!)

export async function signSession(): Promise<string> {
  return new SignJWT({ sub: 'user' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret())
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret())
    return true
  } catch {
    return false
  }
}
