import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { dashboardForPrincipal, type AuthPrincipal } from './authService'
import { useAuth } from './AuthProvider'

type Audience = 'staff' | 'admin' | 'customer' | 'any'

function canAccess(principal: AuthPrincipal, audience: Audience) {
  if (audience === 'any') return true
  if (audience === 'admin') return principal.kind === 'staff' && principal.role === 'system_admin'
  return audience === 'staff' ? principal.kind === 'staff' : principal.kind === 'customer'
}

export function RequireSession({ audience, loginPath = '/login' }: { audience: Audience; loginPath?: string }) {
  // This improves frontend navigation only; protected data and actions still require backend authorization.
  const { principal, ready } = useAuth()
  const location = useLocation()

  // Visual-only admin preview for local development. Vite replaces DEV with false in production builds.
  // This bypass does not create an auth principal and never applies to staff/customer routes.
  const developmentPreview = audience === 'admin'
    && import.meta.env.DEV
    && new URLSearchParams(location.search).get('preview') === '1'

  if (developmentPreview) return <Outlet />
  if (!ready) return <div className="grid min-h-48 place-items-center text-sm text-muted">Restoring session…</div>

  if (!principal) return <Navigate to={loginPath} replace />
  if (!canAccess(principal, audience)) return <Navigate to={dashboardForPrincipal(principal)} replace />
  return <Outlet />
}
