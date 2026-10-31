import { Link, Outlet, useLocation } from 'react-router-dom'
import { Sun } from 'lucide-react'
import { ThemeToggle } from '../components/ui'

export function AuthLayout() {
  const isAdmin = useLocation().pathname === '/admin/login'
  const portal = isAdmin ? 'SolarVerse Administration' : 'SolarVerse account'
  return <main className="grid min-h-screen bg-app-bg lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.85fr)]">
    <section className="relative hidden overflow-hidden bg-brand-panel p-12 text-white lg:flex lg:flex-col lg:justify-between xl:p-16">
      <div className="absolute -right-28 -top-24 size-[28rem] rounded-full bg-brand/20 blur-3xl" />
      <Link to="/" className="relative z-10 flex items-center gap-3 font-bold"><span className="grid size-10 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun className="size-6" /></span><span className="text-xl">SolarVerse</span></Link>
      <div className="relative z-10 max-w-xl"><p className="mb-3 text-sm font-semibold uppercase tracking-[.18em] text-accent">{portal}</p><h1 className="text-4xl font-bold leading-tight xl:text-5xl">{isAdmin ? 'Secure access for SolarVerse administrators.' : 'A clearer path to a brighter energy future.'}</h1><p className="mt-5 max-w-lg text-base leading-relaxed text-white/70">{isAdmin ? 'Manage the SolarVerse workspace through an authorized administrator account.' : 'Your solar projects, service and updates in one considered workspace.'}</p></div>
      <p className="relative z-10 text-sm text-white/55">SolarVerse · Solar, thoughtfully managed</p>
    </section>
    <section className="flex min-h-screen flex-col p-4 sm:p-8">
      <div className="flex items-center justify-between lg:justify-end"><Link to="/" className="flex items-center gap-2 font-bold lg:hidden"><Sun className="size-5 text-brand" />SolarVerse</Link><ThemeToggle /></div>
      <div className="flex flex-1 items-center justify-center py-10"><div className="w-full max-w-md"><Outlet /></div></div>
      <div className="text-center text-sm text-muted">Need help? <Link className="font-semibold text-brand hover:underline" to="/contact">Contact SolarVerse</Link></div>
    </section>
  </main>
}
