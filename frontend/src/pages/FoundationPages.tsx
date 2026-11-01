import { Link } from 'react-router-dom'
import { ArrowRight, Sun } from 'lucide-react'
import { Card, EmptyState, PageHeader } from '../components/ui'

export function FoundationPage({ title, description, legacyPath }: { title: string; description: string; legacyPath?: string }) {
  return <><PageHeader title={title} description={description} eyebrow="SolarVerse workspace" />
    <Card className="p-6 sm:p-8"><EmptyState title="This workspace is ready for its next phase" description="The navigation and page foundation are in place. This screen will connect to the approved SolarVerse workflow when its service contract is ready." />
      {legacyPath && <div className="mt-5 flex flex-wrap items-center justify-center gap-3"><Link to={legacyPath} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-app-text hover:bg-surface-raised">Open existing demo workflow <ArrowRight className="size-4" /></Link></div>}
    </Card></>
}

export function PublicLanding() {
  return <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8">
    <section className="grid items-center gap-10 rounded-2xl border border-border bg-surface p-6 shadow-[var(--shadow-card)] sm:p-10 lg:grid-cols-[1.1fr_.9fr] lg:p-14">
      <div><p className="mb-3 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-accent"><Sun className="size-4" />Powering better energy decisions</p><h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight text-app-text sm:text-5xl">Solar projects, managed with clarity.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">From the first consultation to ongoing service, SolarVerse brings the people and work behind your solar installation into one connected experience.</p><div className="mt-7 flex flex-wrap gap-3"><Link to="/consultation" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-strong dark:text-gray-950">Request a consultation <ArrowRight className="size-4" /></Link><Link to="/services" className="inline-flex min-h-10 items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-app-text hover:bg-surface-raised">Explore our services</Link></div></div>
      <div className="relative min-h-64 overflow-hidden rounded-xl bg-brand-panel p-6 text-white sm:min-h-80 sm:p-8"><div className="absolute -right-10 -top-16 size-64 rounded-full bg-brand/25 blur-3xl" /><div className="relative flex h-full min-h-52 flex-col justify-between"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white/70">SolarVerse</span><Sun className="size-7 text-brand" /></div><div><p className="text-2xl font-semibold">A thoughtful solar journey</p><p className="mt-2 max-w-sm text-sm leading-relaxed text-white/70">Talk to our team about a system designed around your site and energy goals.</p></div><Link to="/consultation" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline">Start a conversation <ArrowRight className="size-4" /></Link></div></div>
    </section>
    <section className="grid gap-4 py-10 sm:grid-cols-3">{[['Designed for your site', 'A clear assessment before a proposal is prepared.'], ['A connected project', 'Keep installation and service details together.'], ['Support that continues', 'Find a straightforward path to help when you need it.']].map(([title, body]) => <Card key={title} className="p-5"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{body}</p></Card>)}</section>
  </div>
}

