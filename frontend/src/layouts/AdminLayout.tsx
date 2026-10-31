import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Menu, Settings, ShieldCheck, Sun, Users, UserCog, X } from 'lucide-react'
import { Avatar, Button, IconButton, ThemeToggle } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'

const adminLinks = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/staff', label: 'Staff management', icon: UserCog },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheck },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'System settings', icon: Settings },
]

export function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const isDevelopmentPreview = import.meta.env.DEV && new URLSearchParams(location.search).get('preview') === '1'
  const adminDestination = (pathname: string) => ({ pathname, search: isDevelopmentPreview ? '?preview=1' : '' })
  const closeAndLogout = () => {
    signOut()
    setMobileOpen(false)
    navigate('/login', { replace: true })
  }
  const linkClass = ({ isActive }: { isActive: boolean }) => `flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-offset-2 ${isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileOpen && <button type="button" aria-label="Close admin navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
    <aside id="admin-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5">
        <Link to={adminDestination('/admin/dashboard')} onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-4" /></span>SolarVerse <span className="text-xs font-medium text-muted">Admin</span></Link>
        <IconButton label="Close admin navigation" className="lg:hidden" onClick={() => setMobileOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton>
      </div>
      <div className="px-5 pb-2 pt-6"><p className="text-xs font-bold uppercase tracking-wider text-muted">Administration</p><p className="mt-1 text-xs text-muted">Workspace navigation</p></div>
      <nav aria-label="Administrator navigation" className="flex-1 space-y-1 overflow-y-auto px-3 py-2">{adminLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={adminDestination(to)} end={end} onClick={() => setMobileOpen(false)} className={linkClass}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</NavLink>)}</nav>
      <div className="grid gap-3 border-t border-border p-4"><div className="flex items-center gap-2"><Avatar name="System administrator" size="sm" /><div><p className="text-sm font-semibold">System administrator</p><p className="text-xs text-muted">Role from active session</p></div></div><Link to="/" className="text-sm text-muted hover:text-brand focus-visible:outline-offset-2">← Public website</Link></div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2"><IconButton label="Open admin navigation" aria-expanded={mobileOpen} aria-controls="admin-navigation" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Admin workspace</span></div>
        <div className="flex items-center gap-2"><ThemeToggle /><Button variant="secondary" onClick={closeAndLogout} className="min-h-9 px-3 py-1 text-xs sm:text-sm">Log out</Button></div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isDevelopmentPreview && <div role="status" className="mb-5 rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm leading-relaxed text-app-text">Development-only admin preview. Authentication is bypassed for visual review only; no session is created. This preview is unavailable in production.</div>}
        <Outlet />
      </main>
    </div>
  </div>
}
