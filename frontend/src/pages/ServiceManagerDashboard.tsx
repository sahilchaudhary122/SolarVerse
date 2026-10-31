import { useState } from 'react'
import { Activity, AlertTriangle, BarChart3, CheckCircle2, ClipboardList, Clock3, LifeBuoy, Menu, Users, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, IconButton, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeToggle } from '../components/ui'
import { Pagination, type PageSize } from '../components/ui/Pagination'

type TicketStatus = 'Open' | 'Assigned' | 'In progress' | 'Resolved — awaiting customer confirmation' | 'Closed — customer confirmed resolution'
type Priority = 'Low' | 'Normal' | 'High' | 'Urgent'
type Ticket = {
  id: string
  customer: string
  phone: string
  site: string
  category: string
  priority: Priority
  technicianId: string | null
  createdAt: string
  status: TicketStatus
  updatedAt: string
  description: string
  serviceNotes: string
  activity: string[]
  overdue: boolean
  resolutionHours?: number
}
type Technician = { id: string; name: string; employeeId: string }
type Section = 'overview' | 'tickets' | 'technicians' | 'reports' | 'workflow'

const technicians: Technician[] = [
  { id: 'DEMO-TECH-01', name: 'Demo Technician 01', employeeId: 'DEMO-EMP-101' },
  { id: 'DEMO-TECH-02', name: 'Demo Technician 02', employeeId: 'DEMO-EMP-102' },
  { id: 'DEMO-TECH-03', name: 'Demo Technician 03', employeeId: 'DEMO-EMP-103' },
  { id: 'DEMO-TECH-04', name: 'Demo Technician 04', employeeId: 'DEMO-EMP-104' },
  { id: 'DEMO-TECH-05', name: 'Demo Technician 05', employeeId: 'DEMO-EMP-105' },
  { id: 'DEMO-TECH-06', name: 'Demo Technician 06', employeeId: 'DEMO-EMP-106' },
]

const categories = ['Inverter fault', 'Electrical issue', 'Monitoring connectivity', 'Installation workmanship', 'Preventive maintenance']
const priorities: Priority[] = ['Low', 'Normal', 'High', 'Urgent']
const ticketStatuses: TicketStatus[] = ['Open', 'Assigned', 'In progress', 'Resolved — awaiting customer confirmation', 'Closed — customer confirmed resolution']
const editableStatuses = ticketStatuses.slice(0, 4)

// Generated fixtures use demo identifiers and fictional customer/site values only.
const initialTickets: Ticket[] = Array.from({ length: 24 }, (_, index) => {
  const status = ticketStatuses[index % ticketStatuses.length]
  const category = categories[index % categories.length]
  const customerIndex = index + 1
  return {
    id: `DEMO-TKT-${String(1001 + index).padStart(4, '0')}`,
    customer: `Sample Customer ${String(customerIndex).padStart(2, '0')}`,
    phone: `+00 000 000 ${String(501 + index).slice(-3)}`,
    site: `Plot DEMO-${customerIndex}, Sample Solar Estate, Demo City`,
    category,
    priority: priorities[(index * 3) % priorities.length],
    technicianId: index % 7 === 0 ? null : technicians[(index * 2) % technicians.length].id,
    createdAt: `${String(20 + index % 10).padStart(2, '0')} Oct 2026`,
    status,
    updatedAt: `${String(28 + index % 4).padStart(2, '0')} Oct 2026`,
    description: `${category} reported at a sample SolarVerse customer site. This fictional ticket is provided for interface demonstration only.`,
    serviceNotes: `Demo service note for DEMO-TKT-${String(1001 + index).padStart(4, '0')}: inspect the reported issue and record findings.`,
    activity: [
      `${String(28 + index % 4).padStart(2, '0')} Oct · Sample ticket record created.`,
      status === 'Open' ? 'Awaiting demo assignment.' : `Demo status: ${status}.`,
    ],
    overdue: index % 6 === 0 && status !== ticketStatuses[4],
    resolutionHours: index % 5 >= 3 ? 6 + (index % 7) * 3 : undefined,
  }
})

const monthlyTrends = [
  { month: 'Jun', created: 28, resolved: 21, confirmed: 18 },
  { month: 'Jul', created: 31, resolved: 25, confirmed: 22 },
  { month: 'Aug', created: 35, resolved: 27, confirmed: 24 },
  { month: 'Sep', created: 29, resolved: 26, confirmed: 23 },
  { month: 'Oct', created: 38, resolved: 30, confirmed: 26 },
  { month: 'Nov', created: 22, resolved: 16, confirmed: 13 },
]

const navItems: Array<{ id: Section; label: string; icon: typeof LifeBuoy }> = [
  { id: 'overview', label: 'Service Overview', icon: BarChart3 },
  { id: 'tickets', label: 'Service Tickets', icon: LifeBuoy },
  { id: 'technicians', label: 'Technician Monitoring', icon: Users },
  { id: 'reports', label: 'Activity and Reports', icon: Activity },
  { id: 'workflow', label: 'Service Workflow', icon: ClipboardList },
]

function priorityTone(priority: Priority) {
  if (priority === 'Urgent') return 'danger' as const
  if (priority === 'High') return 'warning' as const
  if (priority === 'Normal') return 'info' as const
  return 'neutral' as const
}

function statusTone(status: TicketStatus) {
  if (status === 'Closed — customer confirmed resolution') return 'success' as const
  if (status === 'Resolved — awaiting customer confirmation') return 'warning' as const
  if (status === 'In progress') return 'info' as const
  if (status === 'Assigned') return 'brand' as const
  return 'neutral' as const
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof LifeBuoy }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-app-text sm:text-3xl">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">{detail}</p></Card>
}

export function ServiceManagerDashboard() {
  const [section, setSection] = useState<Section>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [tickets, setTickets] = useState(initialTickets)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [technicianFilter, setTechnicianFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const [activity, setActivity] = useState(() => initialTickets.slice(0, 6).map((ticket, index) => ({ id: `DEMO-ACT-${index + 1}`, ticketId: ticket.id, label: ticket.activity[0] })))

  const closedStatus = ticketStatuses[4]
  const resolvedStatus = ticketStatuses[3]
  const openCount = tickets.filter((ticket) => ticket.status !== closedStatus).length
  const highPriorityCount = tickets.filter((ticket) => ticket.priority === 'High' || ticket.priority === 'Urgent').length
  const overdueCount = tickets.filter((ticket) => ticket.overdue && ticket.status !== closedStatus).length
  const awaitingCustomerCount = tickets.filter((ticket) => ticket.status === resolvedStatus).length
  const resolvedSample = tickets.filter((ticket) => ticket.resolutionHours !== undefined && (ticket.status === resolvedStatus || ticket.status === closedStatus))
  const averageResolutionHours = resolvedSample.length ? Math.round(resolvedSample.reduce((sum, ticket) => sum + (ticket.resolutionHours ?? 0), 0) / resolvedSample.length) : 0
  const selectedTicket = tickets.find((ticket) => ticket.id === selectedTicketId) ?? null
  const filteredTickets = tickets.filter((ticket) => {
    const assignedName = technicians.find((technician) => technician.id === ticket.technicianId)?.name ?? 'Unassigned'
    const searchValue = `${ticket.id} ${ticket.customer} ${ticket.phone} ${ticket.site} ${ticket.category} ${ticket.priority} ${ticket.status} ${assignedName}`.toLowerCase()
    return searchValue.includes(search.toLowerCase())
      && (statusFilter === 'all' || ticket.status === statusFilter)
      && (priorityFilter === 'all' || ticket.priority === priorityFilter)
      && (categoryFilter === 'all' || ticket.category === categoryFilter)
      && (technicianFilter === 'all' || (technicianFilter === 'unassigned' ? ticket.technicianId === null : ticket.technicianId === technicianFilter))
  })
  const pageCount = Math.max(1, Math.ceil(filteredTickets.length / pageSize))
  const safePage = Math.min(currentPage, pageCount)
  const pageTickets = filteredTickets.slice((safePage - 1) * pageSize, safePage * pageSize)

  const resetPage = () => setCurrentPage(1)
  const logActivity = (ticketId: string, label: string) => {
    setActivity((current) => [{ id: `DEMO-ACT-${Date.now()}`, ticketId, label: `${label} · local preview` }, ...current].slice(0, 12))
  }
  const updateTicket = (ticketId: string, patch: Partial<Ticket>, message: string) => {
    setTickets((current) => current.map((ticket) => ticket.id === ticketId ? { ...ticket, ...patch, updatedAt: 'Just now · demo' } : ticket))
    logActivity(ticketId, message)
    setNotice(`${message} This change exists in local demo state only; no server or database was updated.`)
  }
  const assignTicket = (ticket: Ticket, technicianId: string) => updateTicket(ticket.id, { technicianId: technicianId || null, status: ticket.status === 'Open' && technicianId ? 'Assigned' : ticket.status }, `Technician ${technicianId ? 'assignment changed' : 'unassigned'} for ${ticket.id}`)
  const updateStatus = (ticket: Ticket, status: TicketStatus) => {
    if (status === closedStatus) return
    updateTicket(ticket.id, { status }, `${ticket.id} moved to ${status}`)
  }
  const confirmCustomerResolution = (ticket: Ticket) => {
    if (ticket.status !== resolvedStatus) return
    updateTicket(ticket.id, { status: closedStatus, overdue: false }, `Sample customer confirmation recorded for ${ticket.id}`)
  }

  const inProgressByTech = (technicianId: string) => tickets.filter((ticket) => ticket.technicianId === technicianId && ticket.status === 'In progress').length
  const resolvedByTech = (technicianId: string) => tickets.filter((ticket) => ticket.technicianId === technicianId && (ticket.status === resolvedStatus || ticket.status === closedStatus)).length
  const overdueByTech = (technicianId: string) => tickets.filter((ticket) => ticket.technicianId === technicianId && ticket.overdue && ticket.status !== closedStatus).length
  const techChartData = technicians.map((technician) => ({ name: technician.name.replace('Demo Technician ', 'Tech '), assigned: tickets.filter((ticket) => ticket.technicianId === technician.id).length, resolved: resolvedByTech(technician.id) }))

  const ticketRow = (ticket: Ticket) => <TableRow key={ticket.id}>
    <TableCell className="whitespace-nowrap font-semibold">{ticket.id}</TableCell>
    <TableCell><div className="font-medium">{ticket.customer}</div><div className="mt-1 text-xs text-muted">{ticket.site}</div></TableCell>
    <TableCell>{ticket.category}</TableCell>
    <TableCell><Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge></TableCell>
    <TableCell>{technicians.find((technician) => technician.id === ticket.technicianId)?.name ?? 'Unassigned'}</TableCell>
    <TableCell className="whitespace-nowrap">{ticket.createdAt}</TableCell>
    <TableCell><Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge></TableCell>
    <TableCell className="whitespace-nowrap">{ticket.updatedAt}</TableCell>
    <TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setSelectedTicketId(ticket.id)}>Open ticket</Button></TableCell>
  </TableRow>

  const overview = () => <>
    <PageHeader eyebrow="Service manager workspace" title="Service Overview" description="Illustrative service workload and customer-confirmation summary." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <Metric label="Total service tickets" value={tickets.length} detail="Illustrative demo records" icon={LifeBuoy} />
      <Metric label="Open tickets" value={openCount} detail="Includes resolved items awaiting confirmation" icon={ClipboardList} />
      <Metric label="High-priority tickets" value={highPriorityCount} detail="High and urgent · demo" icon={AlertTriangle} />
      <Metric label="Overdue tickets" value={overdueCount} detail="Illustrative due-date flags" icon={Clock3} />
      <Metric label="Awaiting customer confirmation" value={awaitingCustomerCount} detail="These remain open until confirmation" icon={CheckCircle2} />
      <Metric label="Average resolution time" value={`${averageResolutionHours} hrs`} detail="Sample completed ticket durations" icon={Activity} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Ticket status summary</h2><p className="mt-1 text-sm text-muted">Sample counts across the workflow</p><ul className="mt-4 space-y-3">{ticketStatuses.map((status) => <li key={status} className="flex flex-wrap items-center justify-between gap-2"><Badge tone={statusTone(status)}>{status}</Badge><span className="font-semibold tabular-nums text-app-text">{tickets.filter((ticket) => ticket.status === status).length} · demo</span></li>)}</ul></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Recent service activity</h2><p className="mt-1 text-sm text-muted">Local demo activity entries</p><ActivityList entries={activity.slice(0, 6)} /></Card>
    </div>
  </>

  const ticketManagement = () => <>
    <PageHeader eyebrow="Service manager workspace" title="Service Ticket Management" description="Search and filter the complete illustrative ticket list before pagination." />
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="sm:col-span-2 xl:col-span-1"><Input label="Search tickets" type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="ID, customer, site or issue" /></div>
        <Select label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resetPage() }}><option value="all">All statuses</option>{ticketStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</Select>
        <Select label="Filter by priority" value={priorityFilter} onChange={(event) => { setPriorityFilter(event.target.value); resetPage() }}><option value="all">All priorities</option>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</Select>
        <Select label="Filter by category" value={categoryFilter} onChange={(event) => { setCategoryFilter(event.target.value); resetPage() }}><option value="all">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}</Select>
        <Select label="Filter by technician" value={technicianFilter} onChange={(event) => { setTechnicianFilter(event.target.value); resetPage() }}><option value="all">All technicians</option><option value="unassigned">Unassigned</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}</Select>
      </div>
      {pageTickets.length > 0 ? <Table><TableHead><tr><TableHeader>Ticket ID</TableHeader><TableHeader>Customer / site</TableHeader><TableHeader>Issue category</TableHeader><TableHeader>Priority</TableHeader><TableHeader>Assigned technician</TableHeader><TableHeader>Created date</TableHeader><TableHeader>Status</TableHeader><TableHeader>Last updated</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{pageTickets.map(ticketRow)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">No demo tickets match the current search and filters.</div>}
      <Pagination currentPage={currentPage} pageSize={pageSize} totalCount={filteredTickets.length} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }} label="Service ticket pages" />
    </Card>
  </>

  const technicianMonitoring = () => <>
    <PageHeader eyebrow="Service manager workspace" title="Technician Monitoring" description="Illustrative workload by demo technician. View a technician's assigned sample tickets." />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{technicians.map((technician) => {
      const assigned = tickets.filter((ticket) => ticket.technicianId === technician.id)
      const workload = assigned.length >= 5 ? 'High' : assigned.length >= 3 ? 'Moderate' : 'Light'
      const loadPercent = Math.min(100, assigned.length / 6 * 100)
      return <Card key={technician.id} className="p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-app-text">{technician.name}</h2><p className="mt-1 text-xs text-muted">{technician.employeeId}</p></div><Badge tone={workload === 'High' ? 'warning' : workload === 'Moderate' ? 'info' : 'success'}>{workload} demo workload</Badge></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${loadPercent}%` }} /></div><p className="mt-1 text-right text-xs text-muted">{assigned.length} assigned · illustrative scale</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-muted">Assigned tickets</dt><dd className="mt-1 font-semibold text-app-text">{assigned.length}</dd></div><div><dt className="text-muted">In progress</dt><dd className="mt-1 font-semibold text-app-text">{inProgressByTech(technician.id)}</dd></div><div><dt className="text-muted">Resolved / awaiting confirmation</dt><dd className="mt-1 font-semibold text-app-text">{resolvedByTech(technician.id)}</dd></div><div><dt className="text-muted">Overdue assignments</dt><dd className="mt-1 font-semibold text-app-text">{overdueByTech(technician.id)}</dd></div></dl><Button variant="secondary" className="mt-4 w-full" onClick={() => { setTechnicianFilter(technician.id); setCurrentPage(1); setSection('tickets') }}>View assigned tickets</Button></Card>
    })}</div>
  </>

  const reports = () => <>
    <PageHeader eyebrow="Service manager workspace" title="Service Activity and Reports" description="Illustrative trends, category and priority breakdowns, technician workload, and confirmation summaries." />
    <div className="mb-5 grid gap-4 sm:grid-cols-2"><Metric label="Awaiting customer confirmation" value={awaitingCustomerCount} detail="Resolved by technician; still open" icon={Clock3} /><Metric label="Closed after confirmation" value={tickets.filter((ticket) => ticket.status === closedStatus).length} detail="Sample customer-confirmed records" icon={CheckCircle2} /></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Issue category breakdown</h2><p className="mt-1 text-sm text-muted">Ticket counts by sample category</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={categories.map((category) => ({ category, count: tickets.filter((ticket) => ticket.category === category).length }))} layout="vertical" margin={{ top: 6, right: 14, left: 10, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis type="category" dataKey="category" width={155} tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><Tooltip /><Bar dataKey="count" name="Tickets · demo" fill="var(--sv-brand)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Ticket priority breakdown</h2><p className="mt-1 text-sm text-muted">Sample distribution; not live workload</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={priorities.map((priority) => ({ priority, count: tickets.filter((ticket) => ticket.priority === priority).length }))} dataKey="count" nameKey="priority" cx="50%" cy="50%" outerRadius={90} label>{priorities.map((priority, index) => <Cell key={priority} fill={['var(--sv-muted)', 'var(--sv-brand)', 'var(--sv-warning)', 'var(--sv-danger)'][index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-2">{priorities.map((priority) => <Badge key={priority} tone={priorityTone(priority)}>{priority}: {tickets.filter((ticket) => ticket.priority === priority).length}</Badge>)}</div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Monthly ticket trends</h2><p className="mt-1 text-sm text-muted">Sample tickets created, resolved, and confirmed</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyTrends} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="created" name="Created · demo" stroke="var(--sv-brand-strong)" strokeWidth={2} /><Line type="monotone" dataKey="resolved" name="Resolved · demo" stroke="var(--sv-brand)" strokeWidth={2} /><Line type="monotone" dataKey="confirmed" name="Customer confirmed · demo" stroke="var(--sv-brand-fresh)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Technician performance</h2><p className="mt-1 text-sm text-muted">Assigned versus resolved sample ticket counts</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={techChartData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="name" tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Bar dataKey="assigned" name="Assigned · demo" fill="var(--sv-brand-strong)" radius={[3, 3, 0, 0]} /><Bar dataKey="resolved" name="Resolved · demo" fill="var(--sv-brand-fresh)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5 xl:col-span-2"><h2 className="font-semibold text-app-text">Recent service activity</h2><p className="mt-1 text-sm text-muted">Sample activity feed; local demo actions appear at the top</p><ActivityList entries={activity.slice(0, 10)} /></Card>
    </div>
  </>

  const workflow = () => <>
    <PageHeader eyebrow="Service manager workspace" title="Service Workflow" description="Illustrative ticket lifecycle with explicit customer confirmation before closure." />
    <Card className="p-5 sm:p-6"><ol className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">{ticketStatuses.map((status, index) => <li key={status} className="flex items-start gap-3 rounded-md border border-border bg-surface-raised/50 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">{index + 1}</span><div><h2 className="font-semibold text-app-text">{status}</h2><p className="mt-1 text-xs leading-relaxed text-muted">{index === 3 ? 'Technician work is marked resolved; the ticket stays open pending customer confirmation.' : index === 4 ? 'Closed only after customer confirmation that the issue is resolved.' : 'Illustrative workflow stage.'}</p></div></li>)}</ol><div className="mt-5 rounded-md border border-warning/30 bg-warning/5 p-4 text-sm leading-relaxed text-app-text"><strong>Customer confirmation rule:</strong> marking work resolved does not close a ticket. In this demo, only the explicit “Preview customer confirmation” action on a resolved ticket changes its sample status to closed. No backend transition contract is assumed.</div></Card>
  </>

  const content = () => {
    switch (section) {
      case 'overview': return overview()
      case 'tickets': return ticketManagement()
      case 'technicians': return technicianMonitoring()
      case 'reports': return reports()
      case 'workflow': return workflow()
    }
  }

  const updateDetailTicket = (patch: Partial<Ticket>, message: string) => {
    if (selectedTicket) updateTicket(selectedTicket.id, patch, message)
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close service manager navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="service-manager-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><span className="font-bold">SolarVerse <span className="text-xs font-medium text-muted">Service Manager</span></span><IconButton label="Close service manager navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Manager preview</p><p className="mt-1 text-sm font-medium text-app-text">Demo service manager</p></div>
      <nav aria-label="Service manager navigation" className="flex-1 space-y-1 overflow-y-auto p-3">{navItems.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMobileNavOpen(false); setNotice('') }} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative data · local state only</div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open service manager navigation" aria-expanded={mobileNavOpen} aria-controls="service-manager-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Service manager workspace</span></div><ThemeToggle /></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">SERVICE MANAGER DEMO PREVIEW — NOT AUTHENTICATED</div><div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All service tickets, customers, sites, contacts, technicians, dates, metrics, and activity entries are illustrative. Local priority, assignment, and status previews are not sent to an API or saved to PostgreSQL.</div>{notice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{notice}</div>}{content()}</main>
    </div>
    <Modal open={selectedTicket !== null} onClose={() => setSelectedTicketId(null)} title={selectedTicket?.id ?? 'Service ticket'} description="Illustrative service ticket detail. Changes remain local to this demo.">
      {selectedTicket && <div className="grid gap-5">
        <div className="grid gap-3 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p><p className="mt-1 font-medium text-app-text">{selectedTicket.customer}</p><p className="mt-1 text-sm text-muted">{selectedTicket.phone}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Site / location</p><p className="mt-1 text-sm text-app-text">{selectedTicket.site}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Issue category</p><p className="mt-1 text-sm text-app-text">{selectedTicket.category}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Description</p><p className="mt-1 text-sm leading-relaxed text-app-text">{selectedTicket.description}</p></div></div>
        <div className="grid gap-3 sm:grid-cols-3"><Select label="Demo priority" value={selectedTicket.priority} onChange={(event) => updateDetailTicket({ priority: event.target.value as Priority }, `${selectedTicket.id} priority changed to ${event.target.value}`)}>{priorities.map((priority) => <option key={priority}>{priority}</option>)}</Select><Select label="Demo technician assignment" value={selectedTicket.technicianId ?? ''} onChange={(event) => assignTicket(selectedTicket, event.target.value)}><option value="">Unassigned</option>{technicians.map((technician) => <option key={technician.id} value={technician.id}>{technician.name}</option>)}</Select><div><Select label="Demo status preview" value={selectedTicket.status} disabled={selectedTicket.status === closedStatus} onChange={(event) => updateStatus(selectedTicket, event.target.value as TicketStatus)}>{editableStatuses.map((status) => <option key={status} value={status}>{status}</option>)}{selectedTicket.status === closedStatus && <option value={closedStatus}>{closedStatus}</option>}</Select><p className="mt-1 text-xs text-muted">Status choices are demo-only and do not define backend transitions.</p></div></div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-surface-raised/50 p-3"><div><p className="text-sm font-semibold text-app-text">Current status</p><div className="mt-1"><Badge tone={statusTone(selectedTicket.status)}>{selectedTicket.status}</Badge></div></div>{selectedTicket.status === resolvedStatus ? <Button onClick={() => confirmCustomerResolution(selectedTicket)}>Preview customer confirmation</Button> : selectedTicket.status === closedStatus ? <span className="text-sm text-success">Customer-confirmed sample closure</span> : <p className="max-w-sm text-xs leading-relaxed text-muted">A technician resolution will remain open until a customer confirms resolution.</p>}</div>
        <div><h2 className="text-sm font-semibold text-app-text">Service notes · demo</h2><p className="mt-1 text-sm leading-relaxed text-muted">{selectedTicket.serviceNotes}</p></div>
        <div><h2 className="text-sm font-semibold text-app-text">Activity history</h2><ol className="mt-2 space-y-2">{selectedTicket.activity.map((entry) => <li key={entry} className="border-l-2 border-brand/30 pl-3 text-sm text-muted">{entry}</li>)}</ol></div>
      </div>}
    </Modal>
  </div>
}

function ActivityList({ entries }: { entries: Array<{ id: string; ticketId: string; label: string }> }) {
  return <ol className="mt-4 space-y-4">{entries.map((entry) => <li key={entry.id} className="flex gap-3"><span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-brand" /><div><p className="text-sm text-app-text">{entry.label}</p><p className="mt-1 text-xs text-muted">{entry.ticketId} · demo activity</p></div></li>)}</ol>
}

export default ServiceManagerDashboard
