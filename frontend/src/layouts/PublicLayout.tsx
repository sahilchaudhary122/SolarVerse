import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Menu, Sun, X } from 'lucide-react'
import { IconButton, ThemeToggle } from '../components/ui'

const publicLinks = [
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/packages', label: 'Packages' },
  { to: '/projects', label: 'Projects' },
  { to: '/contact', label: 'Contact' },
]

function linkClass(isActive: boolean) {
  return `rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-surface-raised hover:text-brand focus-visible:outline-offset-2 ${isActive ? 'text-brand' : 'text-muted'}`
}

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const closeMenu = () => setMenuOpen(false)

  return <div className="flex min-h-screen flex-col bg-app-bg text-app-text">
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" onClick={closeMenu} className="flex shrink-0 items-center gap-2 font-bold tracking-tight text-app-text">
          <span className="grid size-9 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-5" /></span>
          <span className="text-lg">Solar<span className="text-brand">Verse</span></span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {publicLinks.map((link) => <NavLink key={link.to} to={link.to} className={({ isActive }) => linkClass(isActive)}>{link.label}</NavLink>)}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          <Link to="/login" className="inline-flex min-h-10 items-center rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-offset-2 dark:text-gray-950 sm:px-4">Sign in</Link>
          <IconButton label={menuOpen ? 'Close public navigation' : 'Open public navigation'} aria-expanded={menuOpen} aria-controls="public-mobile-navigation" className="lg:hidden" onClick={() => setMenuOpen((open) => !open)}>
            {menuOpen ? <X aria-hidden="true" className="size-5" /> : <Menu aria-hidden="true" className="size-5" />}
          </IconButton>
        </div>
      </div>
      {menuOpen && <nav id="public-mobile-navigation" aria-label="Mobile navigation" className="border-t border-border bg-surface px-4 py-3 lg:hidden">
        <div className="mx-auto grid max-w-7xl gap-1 sm:grid-cols-2">
          {publicLinks.map((link) => <NavLink key={link.to} to={link.to} onClick={closeMenu} className={({ isActive }) => linkClass(isActive)}>{link.label}</NavLink>)}
          <NavLink to="/login" onClick={closeMenu} className={({ isActive }) => linkClass(isActive)}>Sign in</NavLink>
        </div>
      </nav>}
    </header>

    <main className="flex-1"><Outlet /></main>

    <footer className="border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
        <div><Link to="/" className="inline-flex items-center gap-2 font-bold text-app-text"><Sun aria-hidden="true" className="size-5 text-brand" />SolarVerse</Link><p className="mt-2 max-w-md text-sm leading-relaxed text-muted">Solar options, project guidance and support shaped around your site.</p></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
          {publicLinks.map((link) => <Link key={link.to} to={link.to} className="py-1 text-muted hover:text-brand">{link.label}</Link>)}
          <Link to="/consultation" className="py-1 font-semibold text-brand">Request a consultation</Link>
          <Link to="/login" className="py-1 text-muted hover:text-brand">Sign in</Link>
          <Link to="/register" className="py-1 font-semibold text-brand hover:underline">Create Account</Link>
        </div>
      </div>
      <div className="border-t border-border"><p className="mx-auto max-w-7xl px-4 py-4 text-xs text-muted sm:px-6 lg:px-8">© {new Date().getFullYear()} SolarVerse</p></div>
    </footer>
  </div>
}
