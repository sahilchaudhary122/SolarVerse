import { useState } from 'react'
import { Activity, CalendarDays, Check, ClipboardCheck, ClipboardList, Clock3, Images, LayoutDashboard, MapPin, Menu, PackageCheck, Sun, X, type LucideIcon } from 'lucide-react'
import { Badge, Button, Card, Checkbox, IconButton, PageHeader, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, ThemeToggle } from '../components/ui'
import { Avatar } from '../components/ui'

type PreviewSection = 'overview' | 'installations' | 'schedule' | 'orders' | 'checklist' | 'equipment' | 'photos' | 'history'
type SectionLink = { id: PreviewSection; label: string; icon: LucideIcon }

const sectionLinks: SectionLink[] = [
  { id: 'overview', label: 'My Overview', icon: LayoutDashboard },
  { id: 'installations', label: 'My Assigned Installations', icon: Sun },
  { id: 'schedule', label: "Today's Schedule", icon: CalendarDays },
  { id: 'orders', label: 'Work Orders', icon: ClipboardList },
  { id: 'checklist', label: 'Installation Checklist', icon: ClipboardCheck },
  { id: 'equipment', label: 'Equipment and Serial Numbers', icon: PackageCheck },
  { id: 'photos', label: 'Site Photos', icon: Images },
  { id: 'history', label: 'Work History', icon: Activity },
]

const installations = [
  {
    id: 'DEMO-INST-101', customer: 'Sample Customer A', address: 'Plot DEMO-104, Solar Test Estate, Demo City',
    phone: '+00 000 000 111', date: '4 Nov 2026', capacity: '5 kW', status: 'In Progress',
    work: ['Verify roof mounting points', 'Install sample panel array', 'Check inverter connections'],
  },
  {
    id: 'DEMO-INST-102', customer: 'Sample Customer B', address: 'Unit DEMO-22, Example Avenue, Demo City',
    phone: '+00 000 000 222', date: '6 Nov 2026', capacity: '3 kW', status: 'Assigned',
    work: ['Confirm site access', 'Review sample installation plan'],
  },
]

const workflowStages = ['Assigned', 'Accepted', 'In Progress', 'Quality Check', 'Completed']
const scheduleItems = [
  { time: '09:00 AM', title: 'Morning site briefing', location: 'Demo operations hub' },
  { time: '10:30 AM', title: 'Installation work · DEMO-INST-101', location: 'Solar Test Estate, Demo City' },
  { time: '01:30 PM', title: 'Inverter connection check · DEMO-INST-101', location: 'Solar Test Estate, Demo City' },
  { time: '03:30 PM', title: 'Complete sample site notes', location: 'Solar Test Estate, Demo City' },
]
const workOrders = [
  { id: 'DEMO-WO-501', installation: 'DEMO-INST-101', task: 'Install sample panel array', status: 'In Progress', due: '4 Nov 2026' },
  { id: 'DEMO-WO-502', installation: 'DEMO-INST-101', task: 'Verify inverter connections', status: 'Assigned', due: '4 Nov 2026' },
  { id: 'DEMO-WO-503', installation: 'DEMO-INST-102', task: 'Confirm site access', status: 'Assigned', due: '6 Nov 2026' },
]
const checklistTasks = [
  'Verify mounting structure.',
  'Install solar panels.',
  'Check inverter connections.',
  'Verify electrical wiring.',
  'Test system operation.',
  'Upload installation photos.',
  'Record completion notes.',
]
const equipmentItems = [
  { type: 'PV module', model: 'Illustrative Module · 450 W', serial: 'DEMO-PV-001', installation: 'DEMO-INST-101' },
  { type: 'Inverter', model: 'Illustrative Inverter · 5 kW', serial: 'DEMO-INV-001', installation: 'DEMO-INST-101' },
  { type: 'Mounting kit', model: 'Illustrative Roof Kit', serial: 'DEMO-MNT-001', installation: 'DEMO-INST-101' },
]
const historyItems = [
  { date: '28 Oct 2026', item: 'Sample installation DEMO-INST-098', result: 'Completed · demo record' },
  { date: '24 Oct 2026', item: 'Sample installation DEMO-INST-095', result: 'Quality check · demo record' },
  { date: '20 Oct 2026', item: 'Sample installation DEMO-INST-091', result: 'Completed · demo record' },
]

function StatusBadge({ status }: { status: string }) {
  const tone = status === 'Completed' ? 'success' : status === 'In Progress' ? 'info' : 'warning'
  return <Badge tone={tone}>{status}</Badge>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: LucideIcon }) {
  return <Card className="p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-app-text">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">Illustrative demo count</p></Card>
}

export function TechnicianDashboard() {
  const [activeSection, setActiveSection] = useState<PreviewSection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [checkedTasks, setCheckedTasks] = useState<string[]>(['Verify mounting structure.', 'Install solar panels.'])
  const [completionNotes, setCompletionNotes] = useState('')
  const [localNotice, setLocalNotice] = useState('')
  const [selectedPhotoNames, setSelectedPhotoNames] = useState<string[]>([])
  const pendingChecklist = checklistTasks.length - checkedTasks.length

  const toggleTask = (task: string, checked: boolean) => {
    setCheckedTasks((current) => checked ? [...current, task] : current.filter((item) => item !== task))
    setLocalNotice('Checklist preview changed in this browser only. No data was sent or saved.')
  }

  const selectSection = (section: PreviewSection) => {
    setActiveSection(section)
    setMobileNavOpen(false)
    setLocalNotice('')
  }

  const renderOverview = () => <>
    <PageHeader eyebrow="Technician workspace" title="My Overview" description="A personal work area for installations and tasks assigned to Rahul Kumar." actions={<Badge tone="info">Technician demo profile</Badge>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Assigned installations" value={installations.length} icon={Sun} />
      <Metric label="Today's tasks" value={scheduleItems.length} icon={CalendarDays} />
      <Metric label="Pending checklists" value={pendingChecklist > 0 ? 1 : 0} icon={ClipboardCheck} />
      <Metric label="Completed installations" value={12} icon={Check} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-semibold text-app-text">Next assigned installation</h2><p className="mt-1 text-sm text-muted">{installations[0].id} · {installations[0].date}</p></div><StatusBadge status={installations[0].status} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer site · illustrative</p><p className="mt-1 font-medium text-app-text">{installations[0].customer}</p><p className="mt-1 flex gap-2 text-sm text-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{installations[0].address}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Sample system</p><p className="mt-1 font-medium text-app-text">{installations[0].capacity} solar installation</p><p className="mt-1 text-sm text-muted">Fictional contact: {installations[0].phone}</p></div></div>
        <div className="mt-5"><Button variant="secondary" onClick={() => selectSection('installations')}>View my installations</Button></div>
      </Card>
      <Card className="p-5 sm:p-6"><div className="mb-4 flex items-center gap-2"><Clock3 aria-hidden="true" className="size-5 text-brand" /><h2 className="text-lg font-semibold text-app-text">Today's schedule</h2></div><ul className="space-y-4">{scheduleItems.slice(0, 3).map((item) => <li key={item.time} className="flex gap-3"><span className="w-20 shrink-0 text-xs font-semibold text-brand">{item.time}</span><div><p className="text-sm font-medium text-app-text">{item.title}</p><p className="mt-1 text-xs text-muted">{item.location}</p></div></li>)}</ul><Button variant="tertiary" className="mt-4 px-0" onClick={() => selectSection('schedule')}>Open full schedule</Button></Card>
    </div>
    <Card className="mt-5 p-5 sm:p-6"><div className="mb-4"><h2 className="text-lg font-semibold text-app-text">Sample installation workflow</h2><p className="mt-1 text-sm text-muted">Illustrative sequence only; these are not finalized backend status transitions.</p></div><ol className="grid gap-3 sm:grid-cols-5">{workflowStages.map((stage, index) => <li key={stage} className="flex items-center gap-2 rounded-md border border-border bg-surface-raised/50 p-3 sm:flex-col sm:items-start"><span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${index < 3 ? 'bg-brand text-white dark:text-gray-950' : 'bg-surface text-muted'}`}>{index < 2 ? <Check aria-hidden="true" className="size-4" /> : index + 1}</span><span className="text-sm font-medium text-app-text">{stage}</span></li>)}</ol></Card>
  </>

  const renderInstallations = () => <>
    <PageHeader eyebrow="Technician workspace" title="My Assigned Installations" description="Illustrative assignments shown for the Rahul Kumar demo profile." />
    <div className="grid gap-4 xl:grid-cols-2">{installations.map((installation) => <Card key={installation.id} className="p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{installation.id}</p><h2 className="mt-1 text-lg font-semibold text-app-text">{installation.customer}</h2></div><StatusBadge status={installation.status} /></div><p className="mt-3 flex gap-2 text-sm text-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{installation.address}</p><dl className="mt-4 grid grid-cols-2 gap-4 text-sm"><div><dt className="text-muted">Installation date</dt><dd className="mt-1 font-medium text-app-text">{installation.date}</dd></div><div><dt className="text-muted">Sample capacity</dt><dd className="mt-1 font-medium text-app-text">{installation.capacity}</dd></div><div><dt className="text-muted">Fictional customer contact</dt><dd className="mt-1 font-medium text-app-text">{installation.phone}</dd></div></dl><div className="mt-4 border-t border-border pt-4"><h3 className="text-sm font-semibold text-app-text">Assigned work · sample</h3><ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted">{installation.work.map((item) => <li key={item}>{item}</li>)}</ul></div></Card>)}</div>
  </>

  const renderSchedule = () => <>
    <PageHeader eyebrow="Technician workspace" title="Today's Schedule" description="Sample schedule for Sunday, 1 November 2026. These are not live assignments." />
    <Card className="divide-y divide-border px-5 sm:px-6">{scheduleItems.map((item) => <div key={item.time} className="flex flex-col gap-2 py-5 sm:flex-row sm:items-start sm:gap-6"><span className="inline-flex items-center gap-2 text-sm font-semibold text-brand sm:w-28"><Clock3 aria-hidden="true" className="size-4" />{item.time}</span><div><h2 className="font-semibold text-app-text">{item.title}</h2><p className="mt-1 flex gap-2 text-sm text-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{item.location}</p></div></div>)}</Card>
  </>

  const renderOrders = () => <>
    <PageHeader eyebrow="Technician workspace" title="Work Orders" description="Illustrative work orders linked to sample installations." />
    <Card><Table><TableHead><tr><TableHeader>Work order</TableHeader><TableHeader>Installation</TableHeader><TableHeader>Assigned task</TableHeader><TableHeader>Due date</TableHeader><TableHeader>Status</TableHeader></tr></TableHead><TableBody>{workOrders.map((order) => <TableRow key={order.id}><TableCell className="whitespace-nowrap font-semibold">{order.id}</TableCell><TableCell>{order.installation}</TableCell><TableCell>{order.task}</TableCell><TableCell className="whitespace-nowrap">{order.due}</TableCell><TableCell><StatusBadge status={order.status} /></TableCell></TableRow>)}</TableBody></Table></Card>
  </>

  const renderChecklist = () => <>
    <PageHeader eyebrow="Technician workspace" title="Installation Checklist" description="Local interactive checklist preview for DEMO-INST-101." actions={<Badge tone={pendingChecklist ? 'warning' : 'success'}>{pendingChecklist} pending</Badge>} />
    <Card className="p-5 sm:p-6"><div className="mb-5"><h2 className="font-semibold text-app-text">Sample installation tasks</h2><p className="mt-1 text-sm text-muted">Check items to preview local progress. This does not submit or save a work record.</p></div><div className="grid gap-2">{checklistTasks.map((task) => <Checkbox key={task} label={task} checked={checkedTasks.includes(task)} onChange={(event) => toggleTask(task, event.target.checked)} />)}</div><div className="mt-5 max-w-2xl"><Textarea label="Completion notes · local preview" value={completionNotes} onChange={(event) => { setCompletionNotes(event.target.value); setLocalNotice('Notes are kept only in this open page and are not saved.') }} placeholder="Add illustrative completion notes" /><Button className="mt-4" onClick={() => setLocalNotice('Checklist and notes previewed locally only. Nothing was sent to SolarVerse or saved to PostgreSQL.')}>Preview checklist update</Button></div></Card>
  </>

  const renderEquipment = () => <>
    <PageHeader eyebrow="Technician workspace" title="Equipment and Serial Numbers" description="Illustrative equipment records associated with sample installation DEMO-INST-101." />
    <Card><Table><TableHead><tr><TableHeader>Equipment type</TableHeader><TableHeader>Sample model</TableHeader><TableHeader>Demo serial number</TableHeader><TableHeader>Installation</TableHeader></tr></TableHead><TableBody>{equipmentItems.map((item) => <TableRow key={item.serial}><TableCell className="font-medium">{item.type}</TableCell><TableCell>{item.model}</TableCell><TableCell className="font-mono font-semibold">{item.serial}</TableCell><TableCell>{item.installation}</TableCell></TableRow>)}</TableBody></Table></Card>
    <p className="mt-3 text-xs text-muted">Serials use the DEMO prefix and do not represent or create inventory records.</p>
  </>

  const renderPhotos = () => <>
    <PageHeader eyebrow="Technician workspace" title="Site Photos" description="Choose local sample image filenames to preview the photo section." />
    <Card className="p-5 sm:p-6"><label htmlFor="technician-demo-photos" className="block text-sm font-semibold text-app-text">Select sample site photos</label><p id="photo-upload-hint" className="mt-1 text-sm text-muted">Files are not uploaded. Only selected filenames are shown in this page preview.</p><input id="technician-demo-photos" aria-describedby="photo-upload-hint" className="mt-4 block w-full rounded-md border border-border bg-surface p-3 text-sm text-app-text file:mr-4 file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:font-semibold file:text-brand" type="file" accept="image/*" multiple onChange={(event) => { setSelectedPhotoNames(Array.from(event.target.files ?? []).map((file) => file.name)); setLocalNotice('Selected filenames are visible in this browser only. No photo files were uploaded.') }} />{selectedPhotoNames.length > 0 && <ul className="mt-4 list-inside list-disc text-sm text-app-text">{selectedPhotoNames.map((name) => <li key={name}>{name}</li>)}</ul>}</Card>
  </>

  const renderHistory = () => <>
    <PageHeader eyebrow="Technician workspace" title="Work History" description="Illustrative previous-work entries for the demo profile." />
    <Card><Table><TableHead><tr><TableHeader>Date</TableHeader><TableHeader>Installation</TableHeader><TableHeader>Sample outcome</TableHeader></tr></TableHead><TableBody>{historyItems.map((item) => <TableRow key={item.item}><TableCell className="whitespace-nowrap">{item.date}</TableCell><TableCell className="font-medium">{item.item}</TableCell><TableCell><Badge tone={item.result.startsWith('Completed') ? 'success' : 'info'}>{item.result}</Badge></TableCell></TableRow>)}</TableBody></Table></Card>
  </>

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return renderOverview()
      case 'installations': return renderInstallations()
      case 'schedule': return renderSchedule()
      case 'orders': return renderOrders()
      case 'checklist': return renderChecklist()
      case 'equipment': return renderEquipment()
      case 'photos': return renderPhotos()
      case 'history': return renderHistory()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close technician navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="technician-preview-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><div className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-4" /></span>SolarVerse</div><IconButton label="Close technician navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Technician demo</p><div className="mt-3 flex items-center gap-2"><Avatar name="Rahul Kumar" size="sm" /><div><p className="text-sm font-semibold text-app-text">Rahul Kumar</p><p className="text-xs text-muted">Sample technician profile</p></div></div></div>
      <nav aria-label="Technician preview sections" className="flex-1 space-y-1 overflow-y-auto p-3">{sectionLinks.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeSection === id ? 'page' : undefined} onClick={() => selectSection(id)} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${activeSection === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative preview · local state only</div>
    </aside>

    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open technician navigation" aria-expanded={mobileNavOpen} aria-controls="technician-preview-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Technician workspace preview</span></div><div className="flex items-center gap-2"><span className="hidden text-sm font-medium text-app-text sm:inline">Rahul Kumar</span><ThemeToggle /></div></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">TECHNICIAN DEMO PREVIEW — NOT AUTHENTICATED</div>
        <div role="note" className="mb-6 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All employee, customer, site, schedule, work-order, equipment, serial, and history details are illustrative. Checklist and photo interactions stay in this open page only; nothing is sent to an API or saved to PostgreSQL. The sample workflow labels do not define final backend transitions.</div>
        {localNotice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{localNotice}</div>}
        {renderSection()}
      </main>
    </div>
  </div>
}

export default TechnicianDashboard
