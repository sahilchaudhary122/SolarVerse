import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CalendarDays, CheckCircle2, ClipboardList, FileText, LifeBuoy, MapPin, PackageCheck, ShieldCheck, Sun, Zap } from 'lucide-react'
import { Badge, Button, Card, PageHeader } from '../components/ui'
import { customerActivity, customerEnquiries, customerInstallations, customerNotifications, customerOrders, customerProfile, customerProjects, customerQuotations, customerServiceRequests, customerWarranties, customerProjectStages, type CustomerProject } from '../data/customerDemo'

const customerActions = [
  { label: 'Submit an enquiry', description: 'Open the SolarVerse enquiry form.', to: '/contact', icon: ClipboardList, kind: 'primary' },
  { label: 'View quotations', description: 'Open your quotation workspace.', to: '/customer/quotations', icon: FileText, kind: 'secondary' },
  { label: 'Track an order', description: 'Open order and delivery details.', to: '/customer/orders', icon: PackageCheck, kind: 'secondary' },
  { label: 'Raise a service request', description: 'Open service request support.', to: '/customer/service', icon: LifeBuoy, kind: 'secondary' },
] as const

function ProjectCard({ project, onSelect }: { project: CustomerProject; onSelect: (project: CustomerProject) => void }) {
  const completeStages = project.currentStage
  const progress = Math.round(completeStages / customerProjectStages.length * 100)
  return <Card className="flex h-full flex-col p-5">
    <div className="flex items-start justify-between gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-md bg-brand/10 text-brand"><Sun aria-hidden="true" className="size-5" /></div><Badge tone="info">Illustrative project</Badge></div>
    <h2 className="mt-4 text-lg font-semibold text-app-text">{project.siteName}</h2>
    <p className="mt-1 flex items-start gap-1.5 text-sm text-muted"><MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />{project.address}</p>
    <div className="mt-4 flex flex-wrap gap-2"><Badge tone="brand">{project.capacity}</Badge><Badge>{project.systemType}</Badge></div>
    <p className="mt-4 text-sm font-medium text-app-text">{project.status}</p>
    <div className="mt-3"><div className="mb-1.5 flex justify-between text-xs text-muted"><span>Journey progress</span><span>{progress}% · demo</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${progress}%` }} /></div></div>
    {project.expectedInstallation && <p className="mt-3 flex items-center gap-2 text-sm text-muted"><CalendarDays aria-hidden="true" className="size-4" />Expected installation: {project.expectedInstallation}</p>}
    <Button variant="secondary" className="mt-5 w-full" onClick={() => onSelect(project)}>View project progress</Button>
  </Card>
}

function ProjectTimeline({ project }: { project: CustomerProject }) {
  return <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{customerProjectStages.map((stage, index) => {
    const completed = index < project.currentStage
    const current = index === project.currentStage
    return <li key={stage} className={`flex items-start gap-3 rounded-md border p-3 ${completed ? 'border-brand/25 bg-brand/5' : current ? 'border-brand bg-brand/10' : 'border-border bg-surface'}`}>
      <span className={`grid size-7 shrink-0 place-items-center rounded-full ${completed ? 'bg-brand text-white dark:text-gray-950' : current ? 'bg-brand text-white dark:text-gray-950' : 'bg-surface-raised text-muted'}`}>{completed ? <CheckCircle2 aria-hidden="true" className="size-4" /> : <span className="text-xs font-bold">{index + 1}</span>}</span>
      <span><span className={`block text-sm font-semibold ${completed || current ? 'text-app-text' : 'text-muted'}`}>{stage}</span><span className="mt-0.5 block text-xs text-muted">{completed ? 'Completed · demo' : current ? 'Current stage · demo' : 'Not started'}</span></span>
    </li>
  })}</ol>
}

export function CustomerDashboard() {
  const [selectedProject, setSelectedProject] = useState(customerProjects[0])
  const activeQuotations = customerQuotations.filter((quotation) => quotation.status.startsWith('Ready')).length
  const openRequests = customerServiceRequests.filter((request) => request.status.startsWith('Open')).length
  const unread = customerNotifications.filter((notification) => !notification.read).length
  const metrics = [
    { label: 'Total enquiries', value: customerEnquiries.length, icon: ClipboardList, detail: 'Illustrative customer requests' },
    { label: 'Active quotations', value: activeQuotations, icon: FileText, detail: 'Sample items ready to review' },
    { label: 'Active orders', value: customerOrders.length, icon: PackageCheck, detail: 'Demo confirmed orders' },
    { label: 'Ongoing installations', value: customerInstallations.filter((item) => item.status.startsWith('Work')).length, icon: Zap, detail: 'Illustrative installation work' },
    { label: 'Active warranties', value: customerWarranties.filter((item) => item.status.startsWith('Active')).length, icon: ShieldCheck, detail: 'Sample coverage records' },
    { label: 'Open service requests', value: openRequests, icon: LifeBuoy, detail: 'Illustrative support requests' },
  ]

  return <div>
    <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">This customer workspace uses illustrative local demo data. It is not live account or project information, and no changes are saved to a server or database.</div>
    <PageHeader eyebrow="Customer portal" title={`Welcome, ${customerProfile.name}`} description="A clear view of your illustrative solar journey and related customer records." actions={<Badge tone="success">{customerProfile.status}</Badge>} />

    <section aria-label="Customer overview" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(({ label, value, icon: Icon, detail }) => <Card key={label} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-app-text">{value}</p></div><span className="grid size-9 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-4" /></span></div><p className="mt-2 text-xs text-muted">{detail}</p></Card>)}</section>

    <section aria-labelledby="customer-projects-heading" className="mt-7"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-accent">Your solar sites</p><h2 id="customer-projects-heading" className="mt-1 text-xl font-bold text-app-text">My solar projects</h2><p className="mt-1 text-sm text-muted">Sample sites and statuses for this demo customer.</p></div><Link to="/customer/sites" className="text-sm font-semibold text-brand hover:underline">View sites <ArrowRight aria-hidden="true" className="inline size-4" /></Link></div><div className="grid gap-4 lg:grid-cols-2">{customerProjects.map((project) => <ProjectCard key={project.id} project={project} onSelect={setSelectedProject} />)}</div></section>

    <section aria-labelledby="project-timeline-heading" className="mt-7"><Card className="p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-accent">Project progress timeline</p><h2 id="project-timeline-heading" className="mt-1 text-xl font-bold text-app-text">{selectedProject.siteName}</h2><p className="mt-1 text-sm text-muted">Customer-friendly milestones · illustrative status</p></div><label className="grid gap-1 text-xs font-medium text-muted">Choose demo project<select className="min-h-10 rounded-md border border-border bg-surface px-3 text-sm text-app-text focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/20" value={selectedProject.id} onChange={(event) => { const project = customerProjects.find((item) => item.id === event.target.value); if (project) setSelectedProject(project) }}>{customerProjects.map((project) => <option key={project.id} value={project.id}>{project.siteName}</option>)}</select></label></div><ProjectTimeline project={selectedProject} /></Card></section>

    <section className="mt-7 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5"><div className="mb-4 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-accent">Customer shortcuts</p><h2 className="mt-1 text-lg font-bold text-app-text">Quick actions</h2></div><Badge tone="info">Some pages are demo placeholders</Badge></div><div className="grid gap-3 sm:grid-cols-2">{customerActions.map(({ label, description, to, icon: Icon, kind }) => <Link key={to} to={to} className="group flex min-h-24 items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:border-brand/40 hover:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus"><span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-4" /></span><span className="min-w-0"><span className="block font-semibold text-app-text">{label}</span><span className="mt-1 block text-xs leading-relaxed text-muted">{description} {kind === 'secondary' && 'Demo placeholder.'}</span></span><ArrowRight aria-hidden="true" className="ml-auto size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" /></Link>)}</div></Card>
      <Card className="p-5"><div className="mb-4 flex items-center justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wider text-accent">Recent updates</p><h2 className="mt-1 text-lg font-bold text-app-text">Recent activity</h2></div><Badge tone="neutral">Illustrative</Badge></div><ol className="space-y-4">{customerActivity.map((item) => <li key={item.id} className="flex gap-3"><span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" /><div><p className="text-sm leading-relaxed text-app-text">{item.text}</p><p className="mt-1 text-xs text-muted">{item.date} · {item.type}</p></div></li>)}</ol><Link to="/customer/notifications" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand hover:underline">Notifications <Bell aria-hidden="true" className="size-4" /><span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-xs">{unread}</span></Link></Card>
    </section>
  </div>
}

export default CustomerDashboard
