import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { apiAuthAdapter, type AuthAdapter, type AuthPrincipal, type LoginCredentials } from './authService'
import { getAccessToken, setAccessToken } from '../lib/apiClient'

type AuthContextValue = {
  principal: AuthPrincipal | null
  ready: boolean
  signIn: (credentials: LoginCredentials) => Promise<AuthPrincipal>
  register: (input: { full_name: string; email: string; mobile: string; password: string }) => Promise<AuthPrincipal>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, adapter = apiAuthAdapter }: { children: ReactNode; adapter?: AuthAdapter }) {
  const [principal, setPrincipal] = useState<AuthPrincipal | null>(null)
  const [ready, setReady] = useState(() => !getAccessToken() || !adapter.currentPrincipal)

  useEffect(() => {
    if (!getAccessToken() || !adapter.currentPrincipal) return
    adapter.currentPrincipal()
      .then(setPrincipal)
      .catch(() => { setAccessToken(null); setPrincipal(null) })
      .finally(() => setReady(true))
  }, [adapter])

  useEffect(() => {
    const expireSession = () => { setPrincipal(null); setAccessToken(null) }
    window.addEventListener('solarverse:session-expired', expireSession)
    return () => window.removeEventListener('solarverse:session-expired', expireSession)
  }, [])

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedPrincipal = await adapter.signIn(credentials)
    setPrincipal(authenticatedPrincipal)
    return authenticatedPrincipal
  }, [adapter])

  const register = useCallback(async (input: { full_name: string; email: string; mobile: string; password: string }) => {
    if (!adapter.register) throw new Error('Registration is unavailable')
    const authenticatedPrincipal = await adapter.register(input)
    setPrincipal(authenticatedPrincipal)
    return authenticatedPrincipal
  }, [adapter])

  const signOut = useCallback(() => { setAccessToken(null); setPrincipal(null) }, [])
  const value = useMemo(() => ({ principal, ready, signIn, register, signOut }), [principal, ready, signIn, register, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
