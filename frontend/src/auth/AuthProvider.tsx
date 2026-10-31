import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { pendingAuthAdapter, type AuthAdapter, type AuthPrincipal, type LoginCredentials } from './authService'

type AuthContextValue = {
  principal: AuthPrincipal | null
  signIn: (credentials: LoginCredentials) => Promise<AuthPrincipal>
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children, adapter = pendingAuthAdapter }: { children: ReactNode; adapter?: AuthAdapter }) {
  const [principal, setPrincipal] = useState<AuthPrincipal | null>(null)

  const signIn = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedPrincipal = await adapter.signIn(credentials)
    setPrincipal(authenticatedPrincipal)
    return authenticatedPrincipal
  }, [adapter])

  const signOut = useCallback(() => setPrincipal(null), [])
  const value = useMemo(() => ({ principal, signIn, signOut }), [principal, signIn, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
