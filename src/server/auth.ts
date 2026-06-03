import { createServerFn } from '@tanstack/react-start'
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server'
import { redirect } from '@tanstack/react-router'
import { signSession, verifySession } from '~/lib/auth'

export const login = createServerFn({ method: 'POST' })
  .inputValidator((d: unknown): { password: string } => {
    if (typeof d !== 'object' || d === null) throw new Error('Invalid input')
    if (!('password' in d) || typeof (d as any).password !== 'string') throw new Error('Password required')
    return d as { password: string }
  })
  .handler(async ({ data }) => {
    if (data.password !== process.env.APP_PASSWORD) {
      throw new Error('Incorrect password')
    }
    const token = await signSession()
    setCookie('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })
    throw redirect({ to: '/' })
  })

export const logout = createServerFn({ method: 'POST' })
  .handler(async () => {
    deleteCookie('session')
    throw redirect({ to: '/login' })
  })

export async function requireAuth() {
  const token = getCookie('session')
  if (!token || !(await verifySession(token))) {
    throw redirect({ to: '/login' })
  }
}
