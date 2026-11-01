import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { CalendarDays, Check, ClipboardCheck, ClipboardList, FileText, MapPin, Users } from 'lucide-react'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea, ThemeToggle } from '../components/ui'
import { Pagination, type PageSize } from '../components/ui/Pagination'

type SurveyStatus = 'Assigned' | 'Scheduled' | 'In Progress' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected'
type Survey = {
  id: string
  customer: string
  contact: string
  address: string
  date: string
  time: string
  capacity: string
  status: SurveyStatus
  roofType: string
  roofArea: string
  consumption: string
  electricalSetup: string
  requirements: string
  notes: string
}
type LocalPhoto = { name: string; url: string }

const statusValues: SurveyStatus[] = ['Assigned', 'Scheduled', 'In Progress', 'Submitted', 'Under Review', 'Approved', 'Rejected']
const surveyDates = ['1 Nov 2026', '2 Nov 2026', '3 Nov 2026', '4 Nov 2026', '6 Nov 2026', '9 Nov 2026', '12 Nov 2026']
const surveyTimes = ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM']
const roofTypes = ['Concrete terrace', 'Metal sheet', 'Tiled roof', 'Mixed roof']
const surveyStatuses: SurveyStatus[] = ['Scheduled', 'In Progress', 'Submitted', 'Under Review', 'Assigned', 'Approved', 'Rejected']

// All records below are deliberately synthetic and use DEMO identifiers and fictional contact details.
const sampleSurveys: Survey[] = Array.from({ length: 23 }, (_, index) => {
  const sequence = index + 1
  return {
    id: `DEMO-SUR-${String(sequence).padStart(3, '0')}`,
    customer: `Sample Customer ${String.fromCharCode(65 + index)}`,
    contact: `+00 000 000 ${String(401 + sequence).slice(-3)}`,
    address: `Plot DEMO-${String(20 + sequence)}, Sample Solar Estate, Demo City`,
    date: surveyDates[index % surveyDates.length],
    time: surveyTimes[index % surveyTimes.length],
    capacity: `${[3, 5, 6, 8][index % 4]} kW · sample requirement`,
    status: surveyStatuses[index % surveyStatuses.length],
    roofType: roofTypes[index % roofTypes.length],
    roofArea: `${90 + index * 4} m² · illustrative`,
    consumption: `${260 + index * 15} kWh/month · illustrative`,
    electricalSetup: index % 2 === 0 ? 'Single-phase supply · sample' : 'Three-phase supply · sample',
    requirements: index % 2 === 0 ? 'Reduce grid usage; consider future expansion.' : 'Review a sample rooftop system and battery options.',
    notes: `Demo note for ${`DEMO-SUR-${String(sequence).padStart(3, '0}')}`}: measurements require an on-site review.`,
  }
})

const workflow = ['Assigned', 'Scheduled', 'In Progress', 'Submitted', 'Under Review', 'Approved / Rejected']
const today = '1 Nov 2026'

function StatusBadge({ status }: { status: SurveyStatus }) {
  const tone = status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : status === 'Submitted' || status === 'Under Review' ? 'info' : status === 'In Progress' ? 'warning' : 'brand'
  return <Badge tone={tone}>{status}</Badge>
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Users }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums text-app-text">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">Illustrative demo count</p></Card>
}

export function SurveyorDashboard() {
  const [section, setSection] = useState<'overview' | 'surveys' | 'schedule' | 'report' | 'workflow'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null)
  const [selectedReportSurvey, setSelectedReportSurvey] = useState(sampleSurveys[0].id)
  const [photos, setPhotos] = useState<LocalPhoto[]>([])
  const [reportNotice, setReportNotice] = useState('')
  const [reportFields, setReportFields] = useState({ measurements: '', orientation: '', shading: '', structural: '', electrical: '', capacity: '', notes: '' })

  useEffect(() => () => photos.forEach((photo) => URL.revokeObjectURL(photo.url)), [photos])

  const filteredSurveys = useMemo(() => sampleSurveys.filter((survey) => {
    const searchable = `${survey.id} ${survey.customer} ${survey.contact} ${survey.address} ${survey.capacity} ${survey.status}`.toLowerCase()
    return searchable.includes(search.toLowerCase()) && (statusFilter === 'all' || survey.status === statusFilter)
  }), [search, statusFilter])
  const pageCount = Math.max(1, Math.ceil(filteredSurveys.length / pageSize))
  const safePage = Math.min(currentPage, pageCount)
  const pageSurveys = filteredSurveys.slice((safePage - 1) * pageSize, safePage * pageSize)
  const todaySurveys = sampleSurveys.filter((survey) => survey.date === today)
  const pendingReports = sampleSurveys.filter((survey) => survey.status === 'In Progress').length
  const submittedSurveys = sampleSurveys.filter((survey) => survey.status === 'Submitted').length
  const approvedSurveys = sampleSurveys.filter((survey) => survey.status === 'Approved').length

  const updateSearch = (value: string) => { setSearch(value); setCurrentPage(1) }
  const updateStatus = (value: string) => { setStatusFilter(value); setCurrentPage(1) }
  const handlePhotos = (files: FileList | null) => setPhotos(Array.from(files ?? []).map((file) => ({ name: file.name, url: URL.createObjectURL(file) })))
  const handleReportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setReportNotice('Survey report preview prepared in this browser only. No photos or survey data were sent or saved.')
  }

  const navItems = [
    { id: 'overview', label: 'My Overview' },
    { id: 'surveys', label: 'My Assigned Surveys' },
    { id: 'schedule', label: 'Site Visit Schedule' },
    { id: 'report', label: 'Survey Report' },
    { id: 'workflow', label: 'Survey Workflow' },
  ] as const

  const overview = () => <>
    <PageHeader eyebrow="Surveyor workspace" title="My Overview" description="Sample survey workload for the fictional surveyor Ananya Demo." actions={<Badge tone="info">Demo surveyor</Badge>} />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <Metric label="Assigned site surveys" value={sampleSurveys.length} icon={ClipboardList} />
      <Metric label="Today's scheduled visits" value={todaySurveys.length} icon={CalendarDays} />
      <Metric label="Pending survey reports" value={pendingReports} icon={FileText} />
      <Metric label="Submitted surveys" value={submittedSurveys} icon={ClipboardCheck} />
      <Metric label="Approved surveys" value={approvedSurveys} icon={Check} />
    </div>
    <Card className="mt-6 p-5 sm:p-6"><h2 className="text-lg font-semibold text-app-text">Next sample site visits</h2><div className="mt-4 grid gap-3 md:grid-cols-2">{todaySurveys.slice(0, 2).map((survey) => <button key={survey.id} type="button" onClick={() => setSelectedSurvey(survey)} className="rounded-md border border-border bg-surface p-4 text-left transition-colors hover:border-brand/40 hover:bg-surface-raised focus-visible:outline-offset-2"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-app-text">{survey.customer}</span><StatusBadge status={survey.status} /></div><p className="mt-2 flex gap-2 text-sm text-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{survey.address}</p><p className="mt-2 text-xs text-muted">{survey.date} · {survey.time} · {survey.id}</p></button>)}</div></Card>
  </>

  const assignedSurveys = () => <>
    <PageHeader eyebrow="Surveyor workspace" title="My Assigned Surveys" description="Search and filter the complete illustrative assignment list before paging through results." />
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto]"><Input label="Search surveys" type="search" value={search} onChange={(event) => updateSearch(event.target.value)} placeholder="ID, customer, contact, address or capacity" /><Select label="Filter by status" value={statusFilter} onChange={(event) => updateStatus(event.target.value)}><option value="all">All statuses</option>{statusValues.map((status) => <option key={status} value={status}>{status}</option>)}</Select></div>
      {pageSurveys.length > 0 ? <Table><TableHead><tr><TableHeader>Survey ID</TableHeader><TableHeader>Customer / contact</TableHeader><TableHeader>Site address</TableHeader><TableHeader>Survey date and time</TableHeader><TableHeader>Solar capacity</TableHeader><TableHeader>Status</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{pageSurveys.map((survey) => <TableRow key={survey.id}><TableCell className="whitespace-nowrap font-semibold">{survey.id}</TableCell><TableCell><div className="font-medium">{survey.customer}</div><div className="mt-1 text-xs text-muted">{survey.contact}</div></TableCell><TableCell>{survey.address}</TableCell><TableCell className="whitespace-nowrap">{survey.date}<div className="mt-1 text-xs text-muted">{survey.time}</div></TableCell><TableCell>{survey.capacity}</TableCell><TableCell><StatusBadge status={survey.status} /></TableCell><TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setSelectedSurvey(survey)}>Open survey</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">No sample surveys match the current search and filter.</div>}
      <Pagination currentPage={currentPage} pageSize={pageSize} totalCount={filteredSurveys.length} onPageChange={setCurrentPage} onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1) }} label="Assigned surveys pages" />
    </Card>
  </>

  const schedule = () => <>
    <PageHeader eyebrow="Surveyor workspace" title="Site Visit Schedule" description="Today's and upcoming appointments for the demo profile." />
    <div className="grid gap-5 xl:grid-cols-2">{[today, '2 Nov 2026', '3 Nov 2026', '4 Nov 2026', '6 Nov 2026'].map((date) => {
      const appointments = sampleSurveys.filter((survey) => survey.date === date)
      if (appointments.length === 0) return null
      return <Card key={date} className="p-5"><h2 className="font-semibold text-app-text">{date}{date === today ? ' · Today' : ''}</h2><ul className="mt-3 divide-y divide-border">{appointments.slice(0, 4).map((survey) => <li key={survey.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-medium text-app-text">{survey.time} · {survey.customer}</p><p className="mt-1 flex gap-2 text-sm text-muted"><MapPin aria-hidden="true" className="size-4 shrink-0" />{survey.address}</p><p className="mt-1 text-xs text-muted">{survey.id}</p></div><StatusBadge status={survey.status} /></li>)}</ul></Card>
    })}</div>
  </>

  const report = () => <>
    <PageHeader eyebrow="Surveyor workspace" title="Survey Report" description="Create a local demonstration report for a selected sample survey." />
    {reportNotice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{reportNotice}</div>}
    <Card className="p-5 sm:p-6"><form noValidate onSubmit={handleReportSubmit} className="grid gap-4 md:grid-cols-2">
      <Select label="Sample survey assignment" value={selectedReportSurvey} onChange={(event) => setSelectedReportSurvey(event.target.value)}>{sampleSurveys.slice(0, 10).map((survey) => <option key={survey.id} value={survey.id}>{survey.id} · {survey.customer}</option>)}</Select>
      <Input label="Roof measurements" value={reportFields.measurements} onChange={(event) => setReportFields((current) => ({ ...current, measurements: event.target.value }))} placeholder="e.g. sample dimensions and area" />
      <Select label="Roof orientation" value={reportFields.orientation} onChange={(event) => setReportFields((current) => ({ ...current, orientation: event.target.value }))}><option value="">Choose sample orientation</option><option>North</option><option>South</option><option>East</option><option>West</option><option>Mixed</option></Select>
      <Textarea label="Shading observations" value={reportFields.shading} onChange={(event) => setReportFields((current) => ({ ...current, shading: event.target.value }))} placeholder="Record illustrative shading observations" />
      <Select label="Structural condition" value={reportFields.structural} onChange={(event) => setReportFields((current) => ({ ...current, structural: event.target.value }))}><option value="">Choose a sample observation</option><option>Appears suitable · sample only</option><option>Requires further review · sample only</option><option>Further assessment needed · sample only</option></Select>
      <Textarea label="Electrical observations" value={reportFields.electrical} onChange={(event) => setReportFields((current) => ({ ...current, electrical: event.target.value }))} placeholder="Record illustrative electrical observations" />
      <Input label="Recommended solar capacity" value={reportFields.capacity} onChange={(event) => setReportFields((current) => ({ ...current, capacity: event.target.value }))} placeholder="Enter a sample recommendation" />
      <Textarea label="Additional survey notes" className="md:col-span-2" value={reportFields.notes} onChange={(event) => setReportFields((current) => ({ ...current, notes: event.target.value }))} placeholder="Add illustrative site notes" />
      <div className="md:col-span-2"><label htmlFor="survey-demo-photos" className="block text-sm font-medium text-app-text">Survey photos preview</label><p id="survey-demo-photos-hint" className="mt-1 text-xs text-muted">Choose local images to preview. The files are not uploaded or saved.</p><input id="survey-demo-photos" aria-describedby="survey-demo-photos-hint" type="file" accept="image/*" multiple onChange={(event) => handlePhotos(event.target.files)} className="mt-2 block w-full rounded-md border border-border bg-surface p-3 text-sm text-app-text file:mr-4 file:rounded-md file:border-0 file:bg-brand/10 file:px-3 file:py-2 file:font-semibold file:text-brand" />{photos.length > 0 && <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{photos.map((photo) => <li key={`${photo.name}-${photo.url}`} className="overflow-hidden rounded-md border border-border bg-surface"><img src={photo.url} alt={`Local survey photo preview: ${photo.name}`} className="h-36 w-full object-cover" /><p className="truncate px-3 py-2 text-xs text-muted">{photo.name}</p></li>)}</ul>}</div>
      <div className="md:col-span-2"><Button type="submit">Preview survey report</Button><p className="mt-2 text-xs text-muted">This action only displays a demo confirmation. It does not submit a report to a server.</p></div>
    </form></Card>
  </>

  const workflowPage = () => <>
    <PageHeader eyebrow="Surveyor workspace" title="Survey Workflow" description="Illustrative survey journey; the final backend status contract is not confirmed." />
    <Card className="p-5 sm:p-6"><ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{workflow.map((stage, index) => <li key={stage} className="flex items-center gap-3 rounded-md border border-border bg-surface-raised/50 p-4"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-sm font-bold text-brand">{index + 1}</span><span className="font-medium text-app-text">{stage}</span></li>)}</ol><p className="mt-4 text-sm leading-relaxed text-muted">Assigned → Scheduled → In Progress → Submitted → Under Review → Approved / Rejected. This sequence is a visual example only; it does not define allowed backend transitions or business rules.</p></Card>
  </>

  const sectionContent = () => {
    switch (section) {
      case 'overview': return overview()
      case 'surveys': return assignedSurveys()
      case 'schedule': return schedule()
      case 'report': return report()
      case 'workflow': return workflowPage()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    <header className="border-b border-border bg-surface"><div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8"><div><p className="text-sm font-bold tracking-tight">SolarVerse <span className="font-medium text-muted">· Surveyor demo preview</span></p><p className="mt-0.5 text-xs text-muted">Ananya Demo · fictional surveyor profile</p></div><ThemeToggle /></div></header>
    <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">SURVEYOR DEMO PREVIEW — NOT AUTHENTICATED</div>
      <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All employees, customer contacts, locations, measurements, statuses, schedules, and reports are fictional examples. Form edits and photo previews remain in this browser only; nothing is sent or saved to PostgreSQL.</div>
      <nav aria-label="Surveyor dashboard sections" className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">{navItems.map(({ id, label }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => setSection(id)} className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}>{label}</button>)}</nav>
      {sectionContent()}
    </main>
    <Modal open={selectedSurvey !== null} onClose={() => setSelectedSurvey(null)} title={selectedSurvey ? `Survey ${selectedSurvey.id}` : 'Survey details'} description="Illustrative survey record for the demo preview.">
      {selectedSurvey && <dl className="grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</dt><dd className="mt-1 font-medium text-app-text">{selectedSurvey.customer}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Fictional contact</dt><dd className="mt-1 text-app-text">{selectedSurvey.contact}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Site address</dt><dd className="mt-1 text-app-text">{selectedSurvey.address}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Roof type</dt><dd className="mt-1 text-app-text">{selectedSurvey.roofType}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Available roof area</dt><dd className="mt-1 text-app-text">{selectedSurvey.roofArea}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Electricity consumption</dt><dd className="mt-1 text-app-text">{selectedSurvey.consumption}</dd></div><div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Existing electrical setup</dt><dd className="mt-1 text-app-text">{selectedSurvey.electricalSetup}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Customer requirements</dt><dd className="mt-1 text-app-text">{selectedSurvey.requirements}</dd></div><div className="sm:col-span-2"><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Survey notes</dt><dd className="mt-1 text-app-text">{selectedSurvey.notes}</dd></div></dl>}
    </Modal>
  </div>
}

export default SurveyorDashboard
