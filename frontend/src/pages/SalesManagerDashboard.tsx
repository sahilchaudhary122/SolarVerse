import { useState, type ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, BadgeCheck, ClipboardList, FileText, Menu, TrendingUp, Users, X } from 'lucide-react'
import { Badge, Button, Card, IconButton, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeToggle } from '../components/ui'
import { Pagination, type PageSize } from '../components/ui/Pagination'

type ManagerSection = 'overview' | 'team' | 'assignments' | 'quotations' | 'performance' | 'reports'
type SalesEmployee = { id: string; name: string; email: string; followUpsCompleted: number; quotationsGenerated: number; ordersConverted: number; monthlyTarget: number; actualSales: number; active: boolean }
type Enquiry = { id: string; customer: string; location: string; requirement: string; status: string; salespersonId: string | null }
type QuotationStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected'
type Quotation = { id: string; customer: string; salespersonId: string; amount: number; submittedOn: string; status: QuotationStatus }
type Column<T> = { id: string; label: string; render: (record: T) => ReactNode }

const staff: SalesEmployee[] = Array.from({ length: 12 }, (_, index) => ({
  id: `DEMO-SALES-${String(index + 1).padStart(3, '0')}`,
  name: `Demo Salesperson ${String(index + 1).padStart(2, '0')}`,
  email: `sales${String(index + 1).padStart(2, '0')}@example.test`,
  followUpsCompleted: 7 + (index * 3) % 18,
  quotationsGenerated: 2 + (index * 2) % 11,
  ordersConverted: 1 + index % 6,
  monthlyTarget: 800000 + (index % 5) * 180000,
  actualSales: 520000 + (index * 137000) % 1100000,
  active: index % 5 !== 4,
}))

const enquiryStatuses = ['New', 'Contacted', 'Qualified', 'Survey requested', 'Quotation in progress']
const enquiries: Enquiry[] = Array.from({ length: 18 }, (_, index) => ({
  id: `DEMO-ENQ-${String(501 + index).padStart(3, '0')}`,
  customer: `Sample Customer ${String(index + 1).padStart(2, '0')}`,
  location: [`Demo City · Example District`, `Sample Town · North Ward`, `Illustration City · Solar Lane`][index % 3],
  requirement: [`Residential rooftop · sample 3 kW`, `Residential · sample off-grid enquiry`, `Small business rooftop · sample 8 kW`][index % 3],
  status: enquiryStatuses[index % enquiryStatuses.length],
  salespersonId: index % 5 === 0 ? null : staff[(index * 3) % staff.length].id,
}))

const quotationStatuses: QuotationStatus[] = ['Draft', 'Submitted', 'Approved', 'Rejected']
const quotations: Quotation[] = Array.from({ length: 16 }, (_, index) => ({
  id: `DEMO-QUO-${String(601 + index).padStart(3, '0')}`,
  customer: `Sample Customer ${String(index + 1).padStart(2, '0')}`,
  salespersonId: staff[(index * 2) % staff.length].id,
  amount: 145000 + index * 37500,
  submittedOn: `${String(10 + index % 19).padStart(2, '0')} Oct 2026`,
  status: quotationStatuses[index % quotationStatuses.length],
}))

const monthlySales = [
  { month: 'Jun', target: 7200000, actual: 6840000 },
  { month: 'Jul', target: 7600000, actual: 7350000 },
  { month: 'Aug', target: 8000000, actual: 7480000 },
  { month: 'Sep', target: 8200000, actual: 8560000 },
  { month: 'Oct', target: 8500000, actual: 7930000 },
  { month: 'Nov', target: 8800000, actual: 6210000 },
]

const sectionLinks: Array<{ id: ManagerSection; label: string; icon: typeof Users }> = [
  { id: 'overview', label: 'Manager Overview', icon: Activity },
  { id: 'team', label: 'Sales Team', icon: Users },
  { id: 'assignments', label: 'Enquiry Assignment', icon: ClipboardList },
  { id: 'quotations', label: 'Quotation Approval', icon: FileText },
  { id: 'performance', label: 'Sales Performance', icon: TrendingUp },
  { id: 'reports', label: 'Reports', icon: BadgeCheck },
]

const currency = (amount: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)

function DemoNotice() {
  return <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">DEMO DATA: all employee, customer, enquiry, quotation, sales and performance values are illustrative. Reassignments and quotation decisions change local page state only; nothing is sent to an API or saved to PostgreSQL. Approval actions shown here do not define final backend approval rules.</div>
}

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: typeof Users }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-app-text sm:text-3xl">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">{detail}</p></Card>
}

function PerformanceBadge({ active, actual, target }: { active: boolean; actual: number; target: number }) {
  if (!active) return <Badge tone="neutral">Inactive · demo</Badge>
  return <Badge tone={actual >= target ? 'success' : actual >= target * 0.75 ? 'warning' : 'info'}>{actual >= target ? 'On target · demo' : 'In progress · demo'}</Badge>
}

function PaginatedTable<T extends { id: string }>({ records, columns, searchText, placeholder, filterLabel, filters, filterValue, label, emptyMessage }: {
  records: T[]
  columns: Column<T>[]
  searchText: (record: T) => string
  placeholder: string
  filterLabel: string
  filters: Array<{ value: string; label: string }>
  filterValue: (record: T) => string
  label: string
  emptyMessage: string
}) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const filteredRecords = records.filter((record) => searchText(record).toLowerCase().includes(query.toLowerCase()) && (filter === 'all' || filterValue(record) === filter))
  const pageCount = Math.max(1, Math.ceil(filteredRecords.length / pageSize))
  const safePage = Math.min(page, pageCount)
  const visibleRecords = filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize)

  return <Card className="overflow-hidden">
    <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto]">
      <Input label={`Search ${label.toLowerCase()}`} type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1) }} placeholder={placeholder} />
      <Select label={filterLabel} value={filter} onChange={(event) => { setFilter(event.target.value); setPage(1) }}><option value="all">All</option>{filters.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</Select>
    </div>
    {visibleRecords.length > 0 ? <Table><TableHead><tr>{columns.map((column) => <TableHeader key={column.id}>{column.label}</TableHeader>)}</tr></TableHead><TableBody>{visibleRecords.map((record) => <TableRow key={record.id}>{columns.map((column) => <TableCell key={column.id}>{column.render(record)}</TableCell>)}</TableRow>)}</TableBody></Table> : <p className="p-8 text-center text-sm text-muted">{emptyMessage}</p>}
    <Pagination currentPage={page} pageSize={pageSize} totalCount={filteredRecords.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); setPage(1) }} label={`${label} pages`} />
  </Card>
}

export function SalesManagerDashboard() {
  const [section, setSection] = useState<ManagerSection>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const team = staff
  const [enquiryRecords, setEnquiryRecords] = useState(enquiries)
  const [quotationRecords, setQuotationRecords] = useState(quotations)
  const [notice, setNotice] = useState('')
  const [details, setDetails] = useState<{ title: string; description: string; fields: Array<[string, string]> } | null>(null)
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null)

  const teamRows = team.map((employee) => ({ ...employee, assignedEnquiries: enquiryRecords.filter((enquiry) => enquiry.salespersonId === employee.id).length }))
  const activeTeam = team.filter((employee) => employee.active).length
  const unassignedCount = enquiryRecords.filter((enquiry) => enquiry.salespersonId === null).length
  const pendingApprovalCount = quotationRecords.filter((quotation) => quotation.status === 'Submitted').length
  const totalOrders = team.reduce((sum, employee) => sum + employee.ordersConverted, 0)
  const totalTarget = team.reduce((sum, employee) => sum + employee.monthlyTarget, 0)
  const totalActual = team.reduce((sum, employee) => sum + employee.actualSales, 0)
  const followupsCompleted = team.reduce((sum, employee) => sum + employee.followUpsCompleted, 0)
  const quotationsGenerated = team.reduce((sum, employee) => sum + employee.quotationsGenerated, 0)
  const enquiryStatusData = enquiryStatuses.map((status) => ({ status, total: enquiryRecords.filter((enquiry) => enquiry.status === status).length }))
  const quotationStatusData = quotationStatuses.map((status) => ({ status, total: quotationRecords.filter((quotation) => quotation.status === status).length }))
  const staffPerformanceData = teamRows.slice(0, 8).map((employee) => ({ name: employee.name.replace('Demo Salesperson ', 'Sales '), target: employee.monthlyTarget, actual: employee.actualSales }))
  const conversionRate = enquiryRecords.length ? Math.round(totalOrders / enquiryRecords.length * 100) : 0
  const quotationConversion = quotationsGenerated ? Math.round(totalOrders / quotationsGenerated * 100) : 0
  const followupCompletion = team.reduce((sum, employee) => sum + employee.followUpsCompleted, 0) ? 78 : 0

  const handleReassign = (enquiryId: string, salespersonId: string) => {
    setEnquiryRecords((current) => current.map((enquiry) => enquiry.id === enquiryId ? { ...enquiry, salespersonId: salespersonId || null } : enquiry))
    const employeeName = team.find((employee) => employee.id === salespersonId)?.name ?? 'Unassigned'
    setNotice(`${enquiryId} reassigned to ${employeeName} in this browser preview only. No employee or enquiry record was changed on the server.`)
  }

  const handleQuotationDecision = (quotation: Quotation, status: 'Approved' | 'Rejected') => {
    setQuotationRecords((current) => current.map((record) => record.id === quotation.id ? { ...record, status } : record))
    setSelectedQuotation((current) => current?.id === quotation.id ? { ...current, status } : current)
    setNotice(`${quotation.id} marked ${status.toLowerCase()} in local demo state only. No approval rule was applied and no backend record was changed.`)
  }

  const teamColumns: Column<typeof teamRows[number]>[] = [
    { id: 'employee', label: 'Employee ID / name', render: (employee) => <><span className="font-semibold">{employee.id}</span><span className="mt-1 block">{employee.name}</span></> },
    { id: 'email', label: 'Email', render: (employee) => employee.email },
    { id: 'assigned', label: 'Assigned enquiries', render: (employee) => employee.assignedEnquiries },
    { id: 'followups', label: 'Follow-ups completed', render: (employee) => employee.followUpsCompleted },
    { id: 'quotes', label: 'Quotations generated', render: (employee) => employee.quotationsGenerated },
    { id: 'orders', label: 'Orders converted', render: (employee) => employee.ordersConverted },
    { id: 'status', label: 'Performance status', render: (employee) => <PerformanceBadge active={employee.active} actual={employee.actualSales} target={employee.monthlyTarget} /> },
    { id: 'details', label: 'Details', render: (employee) => <Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetails({ title: employee.name, description: 'Illustrative salesperson performance details.', fields: [['Employee ID', employee.id], ['Email', employee.email], ['Account status', employee.active ? 'Active · demo' : 'Inactive · demo'], ['Assigned enquiries', String(employee.assignedEnquiries)], ['Follow-ups completed', String(employee.followUpsCompleted)], ['Quotations generated', String(employee.quotationsGenerated)], ['Orders converted', String(employee.ordersConverted)], ['Monthly target · illustrative', currency(employee.monthlyTarget)], ['Actual sales · illustrative', currency(employee.actualSales)]] })}>Preview</Button> },
  ]

  const assignmentColumns: Column<Enquiry>[] = [
    { id: 'id', label: 'Enquiry ID', render: (enquiry) => <span className="font-semibold">{enquiry.id}</span> },
    { id: 'customer', label: 'Customer', render: (enquiry) => enquiry.customer },
    { id: 'location', label: 'Location', render: (enquiry) => enquiry.location },
    { id: 'requirement', label: 'Solar requirement', render: (enquiry) => enquiry.requirement },
    { id: 'status', label: 'Enquiry status', render: (enquiry) => <Badge tone={enquiry.status === 'New' ? 'brand' : enquiry.status === 'Qualified' ? 'success' : 'info'}>{enquiry.status}</Badge> },
    { id: 'assigned', label: 'Currently assigned salesperson', render: (enquiry) => team.find((employee) => employee.id === enquiry.salespersonId)?.name ?? 'Unassigned' },
    { id: 'action', label: 'Assignment action', render: (enquiry) => <select aria-label={`Assign ${enquiry.id} to a salesperson`} value={enquiry.salespersonId ?? ''} onChange={(event) => handleReassign(enquiry.id, event.target.value)} className="min-h-10 min-w-48 rounded-md border border-border bg-surface px-3 text-sm text-app-text focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/20"><option value="">Unassigned</option>{team.filter((employee) => employee.active).map((employee) => <option key={employee.id} value={employee.id}>{employee.name}</option>)}</select> },
  ]

  const quotationColumns: Column<Quotation>[] = [
    { id: 'id', label: 'Quotation ID', render: (quotation) => <span className="font-semibold">{quotation.id}</span> },
    { id: 'customer', label: 'Customer', render: (quotation) => quotation.customer },
    { id: 'salesperson', label: 'Salesperson', render: (quotation) => team.find((employee) => employee.id === quotation.salespersonId)?.name ?? 'Demo salesperson' },
    { id: 'amount', label: 'Illustrative amount', render: (quotation) => currency(quotation.amount) },
    { id: 'date', label: 'Submission date', render: (quotation) => quotation.submittedOn },
    { id: 'status', label: 'Approval status', render: (quotation) => <Badge tone={quotation.status === 'Approved' ? 'success' : quotation.status === 'Rejected' ? 'danger' : quotation.status === 'Submitted' ? 'warning' : 'neutral'}>{quotation.status} · demo</Badge> },
    { id: 'actions', label: 'Actions', render: (quotation) => <div className="flex flex-wrap gap-2"><Button variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => setSelectedQuotation(quotation)}>Details</Button>{quotation.status === 'Submitted' && <><Button variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => handleQuotationDecision(quotation, 'Approved')}>Preview approve</Button><Button variant="tertiary" className="min-h-8 px-2 py-1 text-xs" onClick={() => handleQuotationDecision(quotation, 'Rejected')}>Preview reject</Button></>}</div> },
  ]

  const overview = () => <>
    <PageHeader eyebrow="Sales manager workspace" title="Manager Overview" description="Illustrative team, enquiry, quotation, and monthly sales summary." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total sales employees" value={team.length} detail="Demo employee records" icon={Users} />
      <Metric label="Active sales employees" value={activeTeam} detail="Demo account statuses" icon={Users} />
      <Metric label="Total enquiries" value={enquiryRecords.length} detail="Illustrative enquiry records" icon={ClipboardList} />
      <Metric label="Unassigned enquiries" value={unassignedCount} detail="Local assignment preview" icon={ClipboardList} />
      <Metric label="Quotations awaiting approval" value={pendingApprovalCount} detail="Illustrative submitted quotes" icon={FileText} />
      <Metric label="Orders converted" value={totalOrders} detail="Illustrative team total" icon={BadgeCheck} />
      <Metric label="Monthly sales target" value={currency(totalTarget)} detail="Illustrative team target" icon={TrendingUp} />
      <Metric label="Actual sales performance" value={currency(totalActual)} detail={`${totalTarget ? Math.round(totalActual / totalTarget * 100) : 0}% of illustrative target`} icon={Activity} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Monthly target versus actual</h2><p className="mt-1 text-sm text-muted">Illustrative sales values · INR</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlySales} margin={{ top: 8, right: 10, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 12 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} tickFormatter={(value: number) => `${Math.round(value / 100000) / 10}M`} /><Tooltip formatter={(value) => currency(Number(value))} /><Legend /><Bar dataKey="target" name="Target · demo" fill="var(--sv-brand-strong)" radius={[4, 4, 0, 0]} /><Bar dataKey="actual" name="Actual · demo" fill="var(--sv-brand-fresh)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Enquiry status distribution</h2><p className="mt-1 text-sm text-muted">Illustrative counts by sample status</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={enquiryStatusData} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 12 }} /><YAxis type="category" dataKey="status" width={130} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Bar dataKey="total" name="Enquiries · demo" fill="var(--sv-brand)" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></Card>
    </div>
  </>

  const teamPage = () => <><PageHeader eyebrow="Sales manager workspace" title="Sales Team Management" description="Search and review illustrative sales employee activity." /><PaginatedTable records={teamRows} columns={teamColumns} searchText={(employee) => `${employee.id} ${employee.name} ${employee.email}`} placeholder="Employee ID, name or email" filterLabel="Filter account status" filters={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} filterValue={(employee) => employee.active ? 'active' : 'inactive'} label="Sales employees" emptyMessage="No demo employees match these filters." /></>

  const assignmentPage = () => <><PageHeader eyebrow="Sales manager workspace" title="Enquiry Assignment" description="Reassign sample enquiries between active demo sales employees." /><PaginatedTable records={enquiryRecords} columns={assignmentColumns} searchText={(enquiry) => `${enquiry.id} ${enquiry.customer} ${enquiry.location} ${enquiry.requirement} ${enquiry.status} ${team.find((employee) => employee.id === enquiry.salespersonId)?.name ?? 'Unassigned'}`} placeholder="Enquiry, customer, location or salesperson" filterLabel="Filter assignment" filters={[{ value: 'assigned', label: 'Assigned' }, { value: 'unassigned', label: 'Unassigned' }]} filterValue={(enquiry) => enquiry.salespersonId ? 'assigned' : 'unassigned'} label="Enquiry assignments" emptyMessage="No demo enquiries match these filters." /></>

  const quotationPage = () => <><PageHeader eyebrow="Sales manager workspace" title="Quotation Monitoring" description="Review illustrative quotation records and preview local approval decisions." /><PaginatedTable records={quotationRecords} columns={quotationColumns} searchText={(quotation) => `${quotation.id} ${quotation.customer} ${team.find((employee) => employee.id === quotation.salespersonId)?.name ?? ''} ${quotation.status}`} placeholder="Quotation, customer, salesperson or status" filterLabel="Filter approval status" filters={quotationStatuses.map((status) => ({ value: status, label: status }))} filterValue={(quotation) => quotation.status} label="Quotation records" emptyMessage="No demo quotations match these filters." /></>

  const performancePage = () => <>
    <PageHeader eyebrow="Sales manager workspace" title="Sales Performance" description="Illustrative individual employee performance and conversion summaries." />
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Enquiry conversion rate" value={`${conversionRate}%`} detail="Demo orders converted ÷ sample enquiries" icon={TrendingUp} /><Metric label="Follow-up completion" value={`${followupCompletion}%`} detail={`${followupsCompleted} sample follow-ups completed`} icon={ClipboardList} /><Metric label="Quotation conversion" value={`${quotationConversion}%`} detail="Demo orders converted ÷ quotes generated" icon={FileText} /><Metric label="Team attainment" value={`${Math.round(totalActual / totalTarget * 100)}%`} detail="Illustrative sales actual ÷ target" icon={Activity} /></div>
    <Card className="mb-5 p-5"><h2 className="font-semibold text-app-text">Individual target versus actual</h2><p className="mt-1 text-sm text-muted">Top demo rows · INR values are illustrative</p><div className="mt-4 h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={staffPerformanceData} margin={{ top: 8, right: 10, left: 4, bottom: 32 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="name" angle={-25} textAnchor="end" interval={0} tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} tickFormatter={(value: number) => `${Math.round(value / 100000) / 10}M`} /><Tooltip formatter={(value) => currency(Number(value))} /><Legend /><Bar dataKey="target" name="Monthly target · demo" fill="var(--sv-brand-strong)" radius={[3, 3, 0, 0]} /><Bar dataKey="actual" name="Actual sales · demo" fill="var(--sv-brand-fresh)" radius={[3, 3, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    <PaginatedTable records={teamRows} columns={teamColumns} searchText={(employee) => `${employee.id} ${employee.name} ${employee.email}`} placeholder="Employee ID, name or email" filterLabel="Filter account status" filters={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} filterValue={(employee) => employee.active ? 'active' : 'inactive'} label="Performance employee records" emptyMessage="No demo employees match these filters." />
  </>

  const reportsPage = () => <>
    <PageHeader eyebrow="Sales manager workspace" title="Reports" description="Illustrative monthly sales, salesperson, enquiry, and quotation summaries." />
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Monthly sales summary</h2><p className="mt-1 text-sm text-muted">Target and actual · demo values</p><Table className="mt-4"><TableHead><tr><TableHeader>Month</TableHeader><TableHeader>Target · demo</TableHeader><TableHeader>Actual · demo</TableHeader><TableHeader>Attainment</TableHeader></tr></TableHead><TableBody>{monthlySales.map((month) => <TableRow key={month.month}><TableCell className="font-semibold">{month.month} 2026</TableCell><TableCell>{currency(month.target)}</TableCell><TableCell>{currency(month.actual)}</TableCell><TableCell>{Math.round(month.actual / month.target * 100)}%</TableCell></TableRow>)}</TableBody></Table></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Salesperson performance</h2><p className="mt-1 text-sm text-muted">Demo conversions by sample employee</p><Table className="mt-4"><TableHead><tr><TableHeader>Salesperson</TableHeader><TableHeader>Enquiries</TableHeader><TableHeader>Follow-ups</TableHeader><TableHeader>Quotes</TableHeader><TableHeader>Orders</TableHeader></tr></TableHead><TableBody>{teamRows.slice(0, 8).map((employee) => <TableRow key={employee.id}><TableCell>{employee.name}</TableCell><TableCell>{employee.assignedEnquiries}</TableCell><TableCell>{employee.followUpsCompleted}</TableCell><TableCell>{employee.quotationsGenerated}</TableCell><TableCell>{employee.ordersConverted}</TableCell></TableRow>)}</TableBody></Table></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Enquiry status distribution</h2><p className="mt-1 text-sm text-muted">Sample counts by illustrative status</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={enquiryStatusData} margin={{ top: 8, right: 12, left: 4, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="status" interval={0} tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Bar dataKey="total" name="Enquiries · demo" fill="var(--sv-brand)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Quotation approval summary</h2><p className="mt-1 text-sm text-muted">Illustrative quotation counts</p><div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"><div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={quotationStatusData} dataKey="total" nameKey="status" cx="50%" cy="50%" outerRadius={85} label>{quotationStatusData.map((entry, index) => <Cell key={entry.status} fill={['var(--sv-brand)', 'var(--sv-brand-fresh)', '#B58B2A', '#B4232F'][index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><ul className="space-y-2 text-sm">{quotationStatusData.map((entry) => <li key={entry.status} className="flex justify-between gap-4"><span className="text-muted">{entry.status}</span><span className="font-semibold text-app-text">{entry.total} · demo</span></li>)}</ul></div></Card>
    </div>
  </>

  const content = () => {
    switch (section) {
      case 'overview': return overview()
      case 'team': return teamPage()
      case 'assignments': return assignmentPage()
      case 'quotations': return quotationPage()
      case 'performance': return performancePage()
      case 'reports': return reportsPage()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close sales manager navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="sales-manager-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><span className="font-bold">SolarVerse <span className="text-xs font-medium text-muted">Sales Manager</span></span><IconButton label="Close sales manager navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Manager preview</p><p className="mt-1 text-sm font-medium text-app-text">Demo sales manager</p></div>
      <nav aria-label="Sales manager dashboard navigation" className="flex-1 space-y-1 overflow-y-auto p-3">{sectionLinks.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMobileNavOpen(false); setNotice('') }} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative data · local state only</div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open sales manager navigation" aria-expanded={mobileNavOpen} aria-controls="sales-manager-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Sales manager workspace</span></div><ThemeToggle /></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">SALES MANAGER DEMO PREVIEW — NOT AUTHENTICATED</div><DemoNotice />{notice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{notice}</div>}{content()}</main>
    </div>
    <Modal open={details !== null} onClose={() => setDetails(null)} title={details?.title ?? 'Sales employee details'} description={details?.description}>{details && <dl className="grid gap-4 text-sm sm:grid-cols-2">{details.fields.map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 break-words text-app-text">{value}</dd></div>)}</dl>}</Modal>
    <Modal open={selectedQuotation !== null} onClose={() => setSelectedQuotation(null)} title={selectedQuotation?.id ?? 'Quotation preview'} description="Illustrative quotation details; approval actions in this preview are local only.">{selectedQuotation && <div className="grid gap-4 text-sm"><p><span className="text-muted">Customer:</span> <span className="font-medium text-app-text">{selectedQuotation.customer}</span></p><p><span className="text-muted">Salesperson:</span> <span className="text-app-text">{team.find((employee) => employee.id === selectedQuotation.salespersonId)?.name}</span></p><p><span className="text-muted">Illustrative amount:</span> <span className="font-semibold text-app-text">{currency(selectedQuotation.amount)}</span></p><p><span className="text-muted">Submitted:</span> <span className="text-app-text">{selectedQuotation.submittedOn}</span></p><p><span className="text-muted">Demo approval status:</span> <Badge tone={selectedQuotation.status === 'Approved' ? 'success' : selectedQuotation.status === 'Rejected' ? 'danger' : 'info'}>{selectedQuotation.status}</Badge></p><p className="text-muted">This preview does not calculate totals or apply final approval rules.</p>{selectedQuotation.status === 'Submitted' && <div className="flex flex-wrap gap-2"><Button onClick={() => handleQuotationDecision(selectedQuotation, 'Approved')}>Preview approve</Button><Button variant="secondary" onClick={() => handleQuotationDecision(selectedQuotation, 'Rejected')}>Preview reject</Button></div>}</div>}</Modal>
  </div>
}

export default SalesManagerDashboard
