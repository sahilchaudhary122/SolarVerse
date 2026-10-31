import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BatteryCharging, Building2, Check, Compass, House, LifeBuoy, Leaf, Sun, Wrench, Zap, type LucideIcon } from 'lucide-react'
import { Badge, Card, PageHeader } from '../components/ui'
import { EnquiryForm } from '../features/enquiry/EnquiryForm'

function usePageMetadata(title: string, description: string) {
  useEffect(() => {
    const previousTitle = document.title
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    const previousDescription = meta?.content
    document.title = title
    if (meta) meta.content = description
    return () => {
      document.title = previousTitle
      if (meta && previousDescription !== undefined) meta.content = previousDescription
    }
  }, [title, description])
}

function SolarIllustration({ compact = false }: { compact?: boolean }) {
  return <svg aria-label="Illustration of a home with rooftop solar panels" role="img" viewBox="0 0 560 400" className={`w-full ${compact ? 'h-48' : 'h-64 sm:h-80'}`}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="var(--sv-surface-raised)" /><stop offset="1" stopColor="var(--sv-accent)" stopOpacity=".18" /></linearGradient>
      <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1"><stop stopColor="var(--sv-brand)" /><stop offset="1" stopColor="var(--sv-brand-strong)" /></linearGradient>
    </defs>
    <rect width="560" height="400" rx="28" fill="url(#sky)" />
    <circle cx="440" cy="94" r="39" fill="var(--sv-brand)" opacity=".9" />
    <path d="M61 317h438" stroke="var(--sv-border)" strokeWidth="4" strokeLinecap="round" />
    <path d="M102 224 278 105l177 119v94H102z" fill="var(--sv-surface)" stroke="var(--sv-border)" strokeWidth="4" strokeLinejoin="round" />
    <path d="m73 225 205-139 203 139-18 25-185-126L91 250z" fill="url(#roof)" />
    <path d="m178 168 93-63 87 59-93 63z" fill="var(--sv-brand-panel)" stroke="var(--sv-accent)" strokeWidth="3" />
    <path d="m205 151 88 57m-53-91 87 58m-113-31 93-63m-67 81 94-64" stroke="var(--sv-accent)" strokeOpacity=".75" strokeWidth="2" />
    <path d="M239 318v-71a39 39 0 0 1 78 0v71" fill="var(--sv-surface-raised)" stroke="var(--sv-border)" strokeWidth="4" />
    <path d="M130 255h55v48h-55zm239 0h55v48h-55z" fill="var(--sv-accent)" opacity=".25" stroke="var(--sv-border)" strokeWidth="3" />
    <path d="M85 318c15-38 37-52 66-52m254 52c14-31 35-43 62-43" fill="none" stroke="var(--sv-accent)" strokeWidth="5" strokeLinecap="round" />
    <path d="M108 316c3-24 18-36 43-38m276 40c3-19 17-31 37-33" fill="none" stroke="var(--sv-accent)" strokeWidth="4" strokeLinecap="round" />
  </svg>
}

function SectionIntro({ eyebrow, title, description, align = 'center' }: { eyebrow: string; title: string; description: string; align?: 'left' | 'center' }) {
  return <div className={`mb-10 max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
    <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">{eyebrow}</p>
    <h2 className="text-3xl font-bold tracking-tight text-app-text sm:text-4xl">{title}</h2>
    <p className="mt-4 text-base leading-relaxed text-muted">{description}</p>
  </div>
}

function SolutionCard({ title, description, icon: Icon, label }: { title: string; description: string; icon: LucideIcon; label: string }) {
  return <Card className="group p-6 transition duration-200 hover:-translate-y-1 hover:border-brand/40 sm:p-7">
    <div className="mb-5 flex items-center justify-between"><span className="grid size-11 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span><Badge tone="brand">{label}</Badge></div>
    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
    <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
  </Card>
}

const services = [
  { title: 'On-grid solar', description: 'A grid-connected system planned around your property, energy use and local requirements.', icon: Sun },
  { title: 'Off-grid solar', description: 'A standalone system concept for sites where connection to the utility grid is unavailable or not desired.', icon: BatteryCharging },
  { title: 'Consultation and site survey', description: 'Discuss your goals and review site conditions before moving toward a system proposal.', icon: Compass },
  { title: 'Installation and commissioning', description: 'Coordinate installation, system checks and handover around the approved project plan.', icon: Wrench },
  { title: 'Maintenance and after-sales support', description: 'Get help with ongoing care and service questions after your system is installed.', icon: LifeBuoy },
]

const processSteps = [
  { number: '01', title: 'Share your goals', description: 'Tell us about the property, your energy needs and what you want solar to do for you.' },
  { number: '02', title: 'Review the site', description: 'Discuss site conditions and the information needed to shape a suitable system plan.' },
  { number: '03', title: 'Plan the system', description: 'Review the proposed configuration, scope and next steps together.' },
  { number: '04', title: 'Install and hand over', description: 'Coordinate installation, commissioning checks and a clear project handover.' },
]

function EnquiryCTA({ dark = false }: { dark?: boolean }) {
  return <section className={`px-4 py-16 sm:px-6 sm:py-20 lg:px-8 ${dark ? 'bg-brand-panel text-white' : 'bg-surface-raised text-app-text'}`}>
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
      <div className="max-w-2xl"><p className={`text-xs font-bold uppercase tracking-[.18em] ${dark ? 'text-accent' : 'text-accent'}`}>Start a conversation</p><h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Let’s explore what solar could look like for your site.</h2><p className={`mt-3 text-sm leading-relaxed sm:text-base ${dark ? 'text-white/70' : 'text-muted'}`}>Share a few details and use the enquiry form to start a discussion. The current form is a local demo and does not contact a server.</p></div>
      <Link to="/consultation" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-offset-2 dark:text-gray-950">Request a consultation <ArrowRight aria-hidden="true" className="size-4" /></Link>
    </div>
  </section>
}

export function HomePage() {
  usePageMetadata('SolarVerse | Solar energy, thoughtfully planned', 'Explore SolarVerse solar solutions, services and project process. Request a consultation using the enquiry form.')
  return <>
    <section className="relative overflow-hidden bg-app-bg">
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-12 lg:px-8 lg:py-20">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-accent"><Leaf aria-hidden="true" className="size-4" />Solar, planned around your property</div>
          <h1 className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-app-text sm:text-5xl lg:text-6xl">A more considered way to go <span className="text-brand">solar.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted sm:text-lg">Explore on-grid and off-grid solar options with a team that can guide you from an initial conversation through planning, installation and ongoing support.</p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Link to="/consultation" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-offset-2 dark:text-gray-950">Request a consultation <ArrowRight aria-hidden="true" className="size-4" /></Link><Link to="/services" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold text-app-text transition-colors hover:bg-surface-raised focus-visible:outline-offset-2">Explore services</Link></div>
          <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-sm text-muted"><span className="inline-flex items-center gap-2"><Check className="size-4 text-accent" />Residential and commercial enquiries</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-accent" />On-grid and off-grid options</span></div>
        </div>
        <div className="relative"><div className="absolute -inset-4 rounded-[2rem] bg-accent/10 blur-2xl" /><Card className="relative overflow-hidden p-2 sm:p-3"><SolarIllustration /><div className="flex items-center justify-between gap-4 px-3 pb-3 pt-1 sm:px-4"><div><p className="text-sm font-semibold">Designed for your site</p><p className="mt-1 text-xs text-muted">Start with a conversation about your energy goals.</p></div><span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Zap aria-hidden="true" className="size-5" /></span></div></Card></div>
      </div>
    </section>

    <section className="border-y border-border bg-surface py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow="Solar options" title="Choose a direction that fits your needs" description="System configuration depends on the site, energy goals and local conditions. A consultation can help clarify which approach may be suitable." /><div className="grid gap-4 md:grid-cols-2"><SolutionCard title="On-grid systems" label="Grid-connected" icon={Sun} description="A solar system connected to the electricity grid, planned around your property and how you use energy." /><SolutionCard title="Off-grid systems" label="Standalone" icon={BatteryCharging} description="A standalone solar approach for sites that need to operate independently of the utility grid. Storage and system design depend on project requirements." /></div></div></section>

    <section className="bg-app-bg py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow="Our services" title="Support through each stage" description="From early questions to ongoing care, find the right place to begin." /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[services[2], services[0], services[3]].map((service) => <SolutionCard key={service.title} {...service} label="Solar service" />)}</div><div className="mt-7 text-center"><Link to="/services" className="inline-flex min-h-10 items-center gap-2 px-3 text-sm font-semibold text-brand hover:underline">View all services <ArrowRight aria-hidden="true" className="size-4" /></Link></div></div></section>

    <section className="bg-surface py-16 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow="How it works" title="A clear process, from first question to handover" description="Every project is different. These are the broad stages you can expect to discuss with the SolarVerse team." /><ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{processSteps.map((step) => <li key={step.number} className="rounded-lg border border-border bg-app-bg p-5 sm:p-6"><p className="text-sm font-bold tracking-widest text-brand">{step.number}</p><h3 className="mt-5 text-lg font-semibold">{step.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p></li>)}</ol></div></section>

    <section className="bg-app-bg py-16 sm:py-20"><div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[.85fr_1.15fr] lg:px-8"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Project portfolio</p><h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Project stories are on the way.</h2><p className="mt-4 text-sm leading-relaxed text-muted">We are preparing a portfolio with verified project details. No customer projects or performance figures are presented here until that information is available.</p><Link to="/projects" className="mt-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-brand hover:underline">Visit project portfolio <ArrowRight aria-hidden="true" className="size-4" /></Link></div><Card className="overflow-hidden p-2"><div className="grid min-h-56 place-items-center rounded-md border border-dashed border-border bg-surface p-6 text-center sm:min-h-64"><div><span className="mx-auto grid size-12 place-items-center rounded-lg bg-accent/10 text-accent"><Building2 aria-hidden="true" className="size-6" /></span><p className="mt-4 font-semibold">Illustrative portfolio preview</p><p className="mt-1 text-sm text-muted">Placeholder artwork — not a completed SolarVerse installation.</p></div></div></Card></div></section>
    <EnquiryCTA dark />
  </>
}

export function AboutPage() {
  usePageMetadata('About SolarVerse | Our approach', 'Learn about SolarVerse’s mission, vision and approach to solar planning and installation.')
  const values = [
    ['Clarity', 'Explain options, project stages and open questions in plain language.'],
    ['Thoughtful planning', 'Consider the site and the customer’s goals before discussing a system approach.'],
    ['Accountability', 'Keep project communication and next steps clear throughout the process.'],
    ['Ongoing care', 'Make room for support and maintenance after installation.'],
  ]
  return <>
    <section className="bg-app-bg py-14 sm:py-20"><div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">About SolarVerse</p><h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">Solar projects should feel clear from the start.</h1><p className="mt-5 max-w-xl text-base leading-relaxed text-muted">SolarVerse helps customers explore solar options and navigate the steps involved in planning, installing and caring for a system. We focus on making the process easier to understand and easier to follow.</p></div><Card className="overflow-hidden p-2"><SolarIllustration /></Card></div></section>
    <section className="bg-surface py-14 sm:py-20"><div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 md:grid-cols-2 lg:px-8"><Card className="p-6 sm:p-8"><Badge tone="brand">Our mission</Badge><h2 className="mt-5 text-2xl font-bold">Make the solar journey easier to understand.</h2><p className="mt-3 leading-relaxed text-muted">We aim to help people make informed decisions through clear conversations, careful site review and coordinated project support.</p></Card><Card className="p-6 sm:p-8"><Badge tone="info">Our vision</Badge><h2 className="mt-5 text-2xl font-bold">A future where clean energy feels within reach.</h2><p className="mt-3 leading-relaxed text-muted">We want solar planning and ownership to be more approachable, with practical guidance at each stage.</p></Card></div></section>
    <section className="bg-app-bg py-14 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><SectionIntro eyebrow="How we work" title="Principles that guide the experience" description="These are the values we bring to each customer conversation and project." align="left" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{values.map(([title, text]) => <Card key={title} className="p-5"><span className="grid size-9 place-items-center rounded-md bg-accent/10 text-accent"><Check aria-hidden="true" className="size-4" /></span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-relaxed text-muted">{text}</p></Card>)}</div></div></section>
    <EnquiryCTA />
  </>
}

export function ServicesPage() {
  usePageMetadata('Solar Services | SolarVerse', 'Explore SolarVerse on-grid and off-grid solar services, consultation, surveys, installation and ongoing support.')
  return <>
    <section className="bg-app-bg py-14 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><PageHeader title="Solar services, shaped around your site" description="Explore the support available from early planning through installation and after-sales care." eyebrow="Services" /><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{services.map(({ title, description, icon: Icon }, index) => <Card key={title} className="p-6 sm:p-7"><div className="flex items-center justify-between"><span className="grid size-11 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span><span className="text-xs font-bold tracking-widest text-muted">0{index + 1}</span></div><h2 className="mt-5 text-xl font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{description}</p></Card>)}</div></div></section>
    <section className="border-y border-border bg-surface py-14 sm:py-16"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 lg:px-8"><div><h2 className="text-2xl font-bold">On-grid solar</h2><p className="mt-3 leading-relaxed text-muted">A grid-connected system can be considered for properties with an electricity connection. The right design depends on site conditions, energy use and applicable local requirements.</p></div><div><h2 className="text-2xl font-bold">Off-grid solar</h2><p className="mt-3 leading-relaxed text-muted">A standalone system can be explored for properties that need to operate independently of the utility grid. Storage, capacity and configuration depend on the project’s needs.</p></div></div></section>
    <EnquiryCTA dark />
  </>
}

const projectPlaceholders = [
  { title: 'Residential rooftop concept', text: 'Illustrative placeholder. No completed project details supplied.', icon: House },
  { title: 'Commercial site concept', text: 'Illustrative placeholder. No customer, location or capacity claims.', icon: Building2 },
  { title: 'Standalone system concept', text: 'Illustrative placeholder. Not a representation of an installed system.', icon: BatteryCharging },
]

export function ProjectsPage() {
  usePageMetadata('Solar Project Portfolio | SolarVerse', 'SolarVerse project portfolio. Verified project examples will be added when approved project details are available.')
  return <>
    <section className="bg-app-bg py-14 sm:py-20"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><PageHeader title="A portfolio built on real project details" description="We will share project stories here when verified details are ready. For now, these clearly labelled concepts show the kinds of work the portfolio may cover." eyebrow="Projects" /><div className="mb-6"><Badge tone="warning">Illustrative placeholders — not completed SolarVerse projects</Badge></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{projectPlaceholders.map(({ title, text, icon: Icon }) => <Card key={title} className="overflow-hidden"><div className="grid min-h-52 place-items-center bg-surface-raised p-6"><div className="grid size-20 place-items-center rounded-2xl border border-border bg-surface text-accent"><Icon aria-hidden="true" className="size-9" /></div></div><div className="p-5"><Badge>Illustrative concept</Badge><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-relaxed text-muted">{text}</p></div></Card>)}</div><p className="mt-6 text-xs text-muted">No customer names, installation locations, capacities or performance figures are represented.</p></div></section>
    <EnquiryCTA />
  </>
}

export function PackagesPage() {
  usePageMetadata('Solar Packages | SolarVerse', 'Discuss an on-grid or off-grid solar package with SolarVerse. Package details depend on site review and project requirements.')
  return <section className="bg-app-bg py-14 sm:py-20"><div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8"><PageHeader title="Packages start with the right questions" description="System components and capacity depend on the site and project requirements. We do not publish fixed package contents here." eyebrow="Solar packages" /><Card className="p-6 sm:p-8"><h2 className="text-xl font-semibold">Discuss a system for your site</h2><p className="mt-2 leading-relaxed text-muted">Share your goals and whether you are considering an on-grid or off-grid approach. The enquiry form is a local demo and does not send data to a server.</p><Link to="/consultation" className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-offset-2 dark:text-gray-950">Start an enquiry <ArrowRight aria-hidden="true" className="size-4" /></Link></Card></div></section>
}

export function EnquiryPage() {
  usePageMetadata('Enquiry | SolarVerse', 'Share your solar project details using the SolarVerse local demo enquiry form.')
  return <>
    <section className="border-b border-border bg-surface px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto max-w-7xl"><PageHeader title="Start with a conversation" description="Tell us about your property and the solar approach you are exploring." eyebrow="Enquiry" /></div>
    </section>
    <EnquiryForm />
  </>
}
