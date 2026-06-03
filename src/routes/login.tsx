import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { login } from '~/server/auth'

export const Route = createFileRoute('/login')({
  component: LoginPage,
})

function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login({ data: { password } })
    } catch (err: any) {
      if (!err?.isRedirect) setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#0c0e18', color: '#ddd8f0', fontFamily: "'DM Sans', sans-serif" }}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: 300 }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>⬡ ADHD Focus</h1>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          style={{ padding: '0.75rem', borderRadius: 8, border: '1px solid #1e2133', background: '#12141e', color: '#ddd8f0', fontSize: '1rem' }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem', borderRadius: 8, border: 'none', background: '#f5a623', color: '#0c0e18', fontWeight: 600, fontSize: '1rem', cursor: 'pointer' }}
        >
          {loading ? 'Logging in…' : 'Log in →'}
        </button>
        {error && <p style={{ color: '#f87171', margin: 0 }}>{error}</p>}
      </form>
    </div>
  )
}
