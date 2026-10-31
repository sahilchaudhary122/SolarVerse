import { useMemo, useState } from 'react'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '../components/ui'
import { Activity, ClipboardList, FileText, MessageCircle, Search, Users } from 'lucide-react'

type SalesSection = 'overview' | 'enquiries' | 'followups' | 'quotations' | 'performance'
type Enquiry = {
  id: string
  customer: string
  mobile: string
  location: string
  requirement: string
  status: string
  nextFollowUp: string
}
type FollowUp = { id: string; enquiryId: string; customer: string; mobile: string; time: string; note: string }
type Quotation = { id: string; enquiryId: string; customer: string; status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected'; scope: string }

const sampleEnquiries: Enquiry[] = [
  { id: 'DEMO-ENQ-201', customer: 'Sample Customer A', mobile: '+00 000 000 301', location: 'Example District, Demo City', requirement: 'Residential rooftop · sample 5 kW on-grid', status: 'New', nextFollowUp: '1 Nov 2026' },
  { id: 'DEMO-ENQ-202', customer: 'Sample Customer B', mobile: '+00 000 000 302', location: 'Sample Ward, Demo City', requirement: 'Residential · sample off-grid consultation', status: 'Follow-up due', nextFollowUp: '1 Nov 2026' },
  { id: 'DEMO-ENQ-203', customer: 'Sample Customer C', mobile: '+00 000 000 303', location: 'Illustration Park, Demo Town', requirement: 'Small business rooftop · site discussion', status: 'Survey requested', nextFollowUp: '3 Nov 2026' },
  { id: 'DEMO-ENQ-204', customer: 'Sample Customer D', mobile: '+00 000 000 304', location: 'Example District, Demo City', requirement: 'Residential · solar consultation', status: 'Quotation sent', nextFollowUp: '2 Nov 2026' },
  { id: 'DEMO-ENQ-205', customer: 'Sample Customer E', mobile: '+00 000 000 305', location: 'Demo Avenue, Sample Town', requirement: 'Commercial rooftop · initial enquiry', status: 'New', nextFollowUp: '5 Nov 2026' },
]

const sampleFollowUps: FollowUp[] = [
  { id: 'DEMO-FU-01', enquiryId: 'DEMO-ENQ-201', customer: 'Sample Customer A', mobile: '+00 000 000 301', time: '09:30 AM', note: 'Confirm preferred time for a site discussion.' },
  { id: 'DEMO-FU-02', enquiryId: 'DEMO-ENQ-202', customer: 'Sample Customer B', mobile: '+00 000 000 302', time: '11:00 AM', note: 'Ask whether the customer has questions about the consultation.' },
  { id: 'DEMO-FU-03', enquiryId: 'DEMO-ENQ-204', customer: 'Sample Customer D', mobile: '+00 000 000 304', time: '02:00 PM', note: 'Check if the customer has reviewed the sample quotation.' },
]

const sampleQuotations: Quotation[] = [
  { id: 'DEMO-QUO-401', enquiryId: 'DEMO-ENQ-201', customer: 'Sample Customer A', status: 'Draft', scope: 'Illustrative residential solar proposal. No priced line items are shown.' },
  { id: 'DEMO-QUO-402', enquiryId: 'DEMO-ENQ-204', customer: 'Sample Customer D', status: 'Submitted', scope: 'Illustrative proposal awaiting a customer response. No priced line items are shown.' },
  { id: 'DEMO-QUO-403', enquiryId: 'DEMO-ENQ-203', customer: 'Sample Customer C', status: 'Approved', scope: 'Illustrative proposal status only. No order or installation was created.' },
  { id: 'DEMO-QUO-404', enquiryId: 'DEMO-ENQ-205', customer: 'Sample Customer E', status: 'Rejected', scope: 'Illustrative proposal status only.' },
]

const sections: Array<{ id: SalesSection; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'enquiries', label: 'My Enquiries' },
  { id: 'followups', label: 'Customer Follow-ups' },
  { id: 'quotations', label: 'Quotations' },
  { id: 'performance', label: 'My Performance' },
]

function DemoNotice() {
  return <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">DEMO PREVIEW: all names, contact details, enquiry records, quotation statuses, and metrics are illustrative. Local edits are temporary and are not sent to an API or saved to PostgreSQL.</div>
}

function Metric({ title, value, detail, icon: Icon }: { title: string; value: number; detail: string; icon: typeof Users }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{title}</p><p className="mt-2 text-3xl font-bold tabular-nums text-app-text">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">{detail}</p></Card>
}

function enquiryTone(status: string) {
  if (status === 'New') return 'brand' as const
  if (status === 'Follow-up due') return 'warning' as const
  if (status === 'Quotation sent') return 'info' as const
  return 'neutral' as const
}

function quotationTone(status: Quotation['status']) {
  if (status === 'Approved') return 'success' as const
  if (status === 'Rejected') return 'danger' as const
  if (status === 'Submitted') return 'info' as const
  return 'neutral' as const
}

export function SalesDashboard() {
  const [section, setSection] = useState<SalesSection>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [followUps, setFollowUps] = useState(sampleFollowUps)
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)
  const [notice, setNotice] = useState('')

  const filteredEnquiries = useMemo(() => sampleEnquiries.filter((enquiry) => {
    const matchesSearch = `${enquiry.id} ${enquiry.customer} ${enquiry.mobile} ${enquiry.location} ${enquiry.requirement}`.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || enquiry.status === statusFilter
    return matchesSearch && matchesStatus
  }), [search, statusFilter])

  const updateFollowUp = (id: string, note: string) => {
    setFollowUps((current) => current.map((followUp) => followUp.id === id ? { ...followUp, note } : followUp))
    setNotice('Follow-up note updated in this page preview only. It was not sent or saved.')
  }

  const renderEnquiryTable = (showActions: boolean) => <Card className="overflow-hidden">
    <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto]">
      <Input label="Search enquiries" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ID, customer, mobile, location or requirement" />
      <Select label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{[...new Set(sampleEnquiries.map((enquiry) => enquiry.status))].map((status) => <option key={status} value={status}>{status}</option>)}</Select>
    </div>
    <Table><TableHead><tr><TableHeader>Enquiry ID</TableHeader><TableHeader>Customer / mobile</TableHeader><TableHeader>Location</TableHeader><TableHeader>Solar requirement</TableHeader><TableHeader>Status</TableHeader><TableHeader>Next follow-up</TableHeader>{showActions && <TableHeader><span className="sr-only">Actions</span></TableHeader>}</tr></TableHead>
      <TableBody>{filteredEnquiries.map((enquiry) => <TableRow key={enquiry.id}><TableCell className="whitespace-nowrap font-semibold">{enquiry.id}</TableCell><TableCell><div className="font-medium">{enquiry.customer}</div><div className="mt-1 text-xs text-muted">{enquiry.mobile}</div></TableCell><TableCell>{enquiry.location}</TableCell><TableCell>{enquiry.requirement}</TableCell><TableCell><Badge tone={enquiryTone(enquiry.status)}>{enquiry.status}</Badge></TableCell><TableCell className="whitespace-nowrap">{enquiry.nextFollowUp}</TableCell>{showActions && <TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setSelectedEnquiry(enquiry)}>Open details</Button></TableCell>}</TableRow>)}</TableBody>
    </Table>
    {filteredEnquiries.length === 0 && <p className="p-8 text-center text-sm text-muted">No sample enquiries match the current search and filter.</p>}
  </Card>

  const renderOverview = () => <>
    <PageHeader eyebrow="Sales workspace" title="Overview" description="A sample view of enquiries, follow-ups, and quotation activity." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Total assigned enquiries" value={sampleEnquiries.length} detail="Illustrative assigned records" icon={Users} />
      <Metric title="New enquiries" value={sampleEnquiries.filter((enquiry) => enquiry.status === 'New').length} detail="Sample status count" icon={Search} />
      <Metric title="Follow-ups due today" value={sampleFollowUps.length} detail="Sample schedule · 1 Nov 2026" icon={MessageCircle} />
      <Metric title="Quotations awaiting response" value={sampleQuotations.filter((quotation) => quotation.status === 'Submitted').length} detail="Illustrative submitted quotations" icon={FileText} />
    </div>
    <div className="mt-6"><div className="mb-3 flex items-center gap-2"><ClipboardList aria-hidden="true" className="size-5 text-brand" /><h2 className="text-lg font-semibold text-app-text">Recent sample enquiries</h2></div>{renderEnquiryTable(true)}</div>
  </>

  const renderEnquiries = () => <>
    <PageHeader eyebrow="Sales workspace" title="My Enquiries" description="Search and filter illustrative enquiry records assigned to this demo profile." />
    {renderEnquiryTable(true)}
  </>

  const renderFollowUps = () => <>
    <PageHeader eyebrow="Sales workspace" title="Customer Follow-ups" description="Sample follow-up schedule for Sunday, 1 November 2026." />
    <div className="grid gap-4">{followUps.map((followUp) => <Card key={followUp.id} className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand">{followUp.time} · {followUp.id}</p><h2 className="mt-1 text-lg font-semibold text-app-text">{followUp.customer}</h2><p className="mt-1 text-sm text-muted">{followUp.enquiryId} · {followUp.mobile}</p></div><Badge tone="warning">Due today · demo</Badge></div><div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><Textarea label="Follow-up notes · local demo" value={followUp.note} onChange={(event) => updateFollowUp(followUp.id, event.target.value)} /><Button variant="secondary" onClick={() => setNotice(`Follow-up note previewed for ${followUp.customer}; no data was saved.`)}>Preview note</Button></div></Card>)}</div>
  </>

  const renderQuotations = () => <>
    <PageHeader eyebrow="Sales workspace" title="Quotations" description="Illustrative quotation records and statuses; no prices or live customer decisions are shown." />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{(['Draft', 'Submitted', 'Approved', 'Rejected'] as const).map((status) => <Card key={status} className="p-4"><p className="text-sm text-muted">{status} quotations</p><p className="mt-1 text-2xl font-bold text-app-text">{sampleQuotations.filter((quotation) => quotation.status === status).length}</p></Card>)}</div>
    <Card><Table><TableHead><tr><TableHeader>Quotation ID</TableHeader><TableHeader>Enquiry</TableHeader><TableHeader>Customer</TableHeader><TableHeader>Status</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{sampleQuotations.map((quotation) => <TableRow key={quotation.id}><TableCell className="whitespace-nowrap font-semibold">{quotation.id}</TableCell><TableCell>{quotation.enquiryId}</TableCell><TableCell>{quotation.customer}</TableCell><TableCell><Badge tone={quotationTone(quotation.status)}>{quotation.status}</Badge></TableCell><TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setSelectedQuotation(quotation)}>Preview details</Button></TableCell></TableRow>)}</TableBody></Table></Card>
  </>

  const renderPerformance = () => <>
    <PageHeader eyebrow="Sales workspace" title="My Performance" description="Illustrative summary values only; these are not measured SolarVerse results." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric title="Enquiries handled" value={18} detail="Sample demo value" icon={Users} />
      <Metric title="Follow-ups completed" value={12} detail="Sample demo value" icon={MessageCircle} />
      <Metric title="Quotations generated" value={4} detail="Sample demo value" icon={FileText} />
      <Metric title="Orders converted" value={2} detail="Sample demo value" icon={Activity} />
    </div>
  </>

  const content = () => {
    switch (section) {
      case 'overview': return renderOverview()
      case 'enquiries': return renderEnquiries()
      case 'followups': return renderFollowUps()
      case 'quotations': return renderQuotations()
      case 'performance': return renderPerformance()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex min-h-16 max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8"><div><p className="text-sm font-bold tracking-tight">SolarVerse <span className="font-medium text-muted">· Sales demo preview</span></p></div><div className="flex items-center gap-2"><Badge tone="brand">Demo profile</Badge></div></div>
    </header>
    <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
      <div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">SALES DEMO PREVIEW — NOT AUTHENTICATED</div>
      <DemoNotice />
      {notice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{notice}</div>}
      <nav aria-label="Sales dashboard sections" className="mb-6 flex gap-2 overflow-x-auto border-b border-border pb-2">{sections.map(({ id, label }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setNotice('') }} className={`min-h-10 shrink-0 rounded-md px-3 text-sm font-semibold transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}>{label}</button>)}</nav>
      {content()}
    </main>
    <Modal open={selectedEnquiry !== null} onClose={() => setSelectedEnquiry(null)} title={selectedEnquiry ? `Enquiry ${selectedEnquiry.id}` : 'Enquiry details'} description="Illustrative customer enquiry details only.">
      {selectedEnquiry && <div className="grid gap-4 text-sm sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer</p><p className="mt-1 font-medium text-app-text">{selectedEnquiry.customer}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Fictional mobile</p><p className="mt-1 font-medium text-app-text">{selectedEnquiry.mobile}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Location</p><p className="mt-1 text-app-text">{selectedEnquiry.location}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Requirement</p><p className="mt-1 text-app-text">{selectedEnquiry.requirement}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Status · illustrative</p><p className="mt-1"><Badge tone={enquiryTone(selectedEnquiry.status)}>{selectedEnquiry.status}</Badge></p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Next follow-up</p><p className="mt-1 text-app-text">{selectedEnquiry.nextFollowUp}</p></div></div>}
    </Modal>
    <Modal open={selectedQuotation !== null} onClose={() => setSelectedQuotation(null)} title={selectedQuotation ? `Quotation ${selectedQuotation.id}` : 'Quotation details'} description="Quotation preview only; totals are not calculated or persisted.">
      {selectedQuotation && <div className="grid gap-4 text-sm"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer and enquiry</p><p className="mt-1 font-medium text-app-text">{selectedQuotation.customer} · {selectedQuotation.enquiryId}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Sample status</p><p className="mt-1"><Badge tone={quotationTone(selectedQuotation.status)}>{selectedQuotation.status}</Badge></p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">Sample scope</p><p className="mt-1 leading-relaxed text-app-text">{selectedQuotation.scope}</p></div></div>}
    </Modal>
  </div>
}

export default SalesDashboard
