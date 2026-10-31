import { useMemo, useState } from 'react'
import { Activity, ArrowDownRight, ArrowUpRight, Boxes, BriefcaseBusiness, CalendarDays, ChartNoAxesCombined, CheckCircle2, ClipboardList, FileBarChart, HandCoins, Menu, PackageCheck, ReceiptText, ShieldCheck, Truck, Users, Wrench, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, IconButton, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeToggle } from '../components/ui'

type Section = 'overview' | 'sales' | 'finance' | 'inventory' | 'installations' | 'service' | 'people' | 'reports'
const months = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
const salespeople = ['All salespeople', 'Asha Menon', 'Kiran Shah', 'Meera Iyer', 'Dev Rao']
const sales = [
  { month: 'Jun', revenue: 1480000, enquiries: 94, orders: 19, collections: 1210000, installations: 12, tickets: 14 },
  { month: 'Jul', revenue: 1630000, enquiries: 102, orders: 22, collections: 1380000, installations: 16, tickets: 16 },
  { month: 'Aug', revenue: 1890000, enquiries: 116, orders: 25, collections: 1540000, installations: 19, tickets: 18 },
  { month: 'Sep', revenue: 1710000, enquiries: 108, orders: 23, collections: 1490000, installations: 18, tickets: 15 },
  { month: 'Oct', revenue: 2140000, enquiries: 132, orders: 31, collections: 1820000, installations: 24, tickets: 21 },
  { month: 'Nov', revenue: 980000, enquiries: 71, orders: 14, collections: 760000, installations: 11, tickets: 12 },
]
const people = [
  { name: 'Asha Menon', enquiries: 18, orders: 5, followups: 84, department: 'Sales' },
  { name: 'Kiran Shah', enquiries: 15, orders: 4, followups: 78, department: 'Sales' },
  { name: 'Meera Iyer', enquiries: 20, orders: 6, followups: 91, department: 'Sales' },
  { name: 'Dev Rao', enquiries: 13, orders: 3, followups: 73, department: 'Sales' },
]
const orders = [
  { id: 'DEMO-ORD-1042', customer: 'Sample Customer A', owner: 'Asha Menon', amount: 245000, status: 'Installation scheduled' },
  { id: 'DEMO-ORD-1041', customer: 'Sample Customer B', owner: 'Meera Iyer', amount: 318000, status: 'In progress' },
  { id: 'DEMO-ORD-1040', customer: 'Sample Customer C', owner: 'Kiran Shah', amount: 186500, status: 'Awaiting dispatch' },
  { id: 'DEMO-ORD-1039', customer: 'Sample Customer D', owner: 'Dev Rao', amount: 274000, status: 'Completed' },
  { id: 'DEMO-ORD-1038', customer: 'Sample Customer E', owner: 'Asha Menon', amount: 205000, status: 'Awaiting payment' },
]
const quotations = [
  { status: 'Draft', count: 18 }, { status: 'Submitted', count: 26 }, { status: 'Approved', count: 42 }, { status: 'Rejected', count: 9 },
]
const productStock = [
  { product: 'Solar panels', available: 286, reserved: 74, status: 'Healthy' },
  { product: 'Inverters', available: 42, reserved: 18, status: 'Healthy' },
  { product: 'Batteries', available: 18, reserved: 24, status: 'Low stock' },
  { product: 'Mounting structures', available: 96, reserved: 33, status: 'Healthy' },
  { product: 'Electrical accessories', available: 21, reserved: 14, status: 'Low stock' },
]
const movements = [
  { date: '01 Nov', product: 'Solar panels', movement: 'Stock received', quantity: '+48', location: 'Demo warehouse North' },
  { date: '31 Oct', product: 'Inverters', movement: 'Reserved for order', quantity: '−6', location: 'Demo warehouse Central' },
  { date: '30 Oct', product: 'Batteries', movement: 'Dispatched', quantity: '−4', location: 'Demo warehouse South' },
]
const warehouses = [
  { name: 'Demo warehouse North', products: 28, available: 418, reserved: 96 },
  { name: 'Demo warehouse Central', products: 34, available: 326, reserved: 84 },
  { name: 'Demo warehouse South', products: 21, available: 245, reserved: 65 },
]
const technicians = [
  { name: 'Demo Technician A', assigned: 7, active: 3, completed: 12, workload: 'Balanced' },
  { name: 'Demo Technician B', assigned: 5, active: 2, completed: 9, workload: 'Balanced' },
  { name: 'Demo Technician C', assigned: 8, active: 4, completed: 10, workload: 'Review capacity' },
  { name: 'Demo Technician D', assigned: 4, active: 1, completed: 11, workload: 'Balanced' },
]
const departments = [
  { name: 'Sales', employees: 8, active: 32, workload: 'Enquiry and quotation activity' },
  { name: 'Survey', employees: 5, active: 18, workload: 'Visits and reports in progress' },
  { name: 'Inventory', employees: 4, active: 14, workload: 'Receipts, reservations, dispatches' },
  { name: 'Installation', employees: 12, active: 21, workload: 'Scheduled and active work' },
  { name: 'Service', employees: 6, active: 17, workload: 'Open tickets and follow-ups' },
  { name: 'Finance', employees: 3, active: 11, workload: 'Collections and reconciliation' },
]
const activity = [
  { time: 'Today · 10:40', label: 'A sample installation was marked complete', group: 'Installation' },
  { time: 'Today · 09:25', label: 'A demo payment record was marked received', group: 'Finance' },
  { time: 'Yesterday · 16:10', label: 'A sample quotation moved to submitted', group: 'Sales' },
  { time: 'Yesterday · 14:30', label: 'Illustrative stock was received at North warehouse', group: 'Inventory' },
  { time: '30 Oct · 11:05', label: 'A demo service ticket awaits customer confirmation', group: 'Service' },
]
const reports = [
  { title: 'Monthly business summary', description: 'Revenue, orders, collections, and operating activity.' },
  { title: 'Sales report', description: 'Enquiry, quotation, order, and salesperson summaries.' },
  { title: 'Financial summary', description: 'Payments, outstanding balances, and refund overview.' },
  { title: 'Inventory report', description: 'Stock balances, low-stock items, and movements.' },
  { title: 'Installation report', description: 'Schedule, completion trend, and team workload.' },
  { title: 'Service report', description: 'Tickets, priorities, confirmations, and warranties.' },
]
const nav: Array<{ id: Section; label: string; icon: typeof ChartNoAxesCombined }> = [
  { id: 'overview', label: 'Executive overview', icon: ChartNoAxesCombined },
  { id: 'sales', label: 'Sales performance', icon: BriefcaseBusiness },
  { id: 'finance', label: 'Finance overview', icon: HandCoins },
  { id: 'inventory', label: 'Inventory', icon: Boxes },
  { id: 'installations', label: 'Installations', icon: Truck },
  { id: 'service', label: 'Service & warranties', icon: ShieldCheck },
  { id: 'people', label: 'Departments & people', icon: Users },
  { id: 'reports', label: 'Reports & activity', icon: FileBarChart },
]
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const money = (amount: number) => inr.format(amount)
const quotationColors = ['var(--sv-muted)', 'var(--sv-brand)', 'var(--sv-brand-fresh)', 'var(--sv-danger)']

function Metric({ label, value, comparison, positive = true, icon: Icon }: { label: string; value: string; comparison: string; positive?: boolean; icon: typeof ChartNoAxesCombined }) {
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight
  return <Card className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 truncate text-xl font-bold tabular-nums text-app-text sm:text-2xl">{value}</p></div><span className="grid size-9 shrink-0 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-4" /></span></div><p className={`mt-2 inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-success' : 'text-warning'}`}><TrendIcon aria-hidden="true" className="size-3.5" />{comparison}<span className="font-normal text-muted">vs previous month · demo</span></p></Card>
}

function Panel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return <Card className={`p-4 sm:p-5 ${className}`}><div className="mb-4"><h2 className="font-semibold text-app-text">{title}</h2>{subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}</div>{children}</Card>
}

export function ManagementDashboard() {
  const [section, setSection] = useState<Section>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState('Oct')
  const [selectedSalesperson, setSelectedSalesperson] = useState('All salespeople')
  const [dateFrom, setDateFrom] = useState('2026-06')
  const [dateTo, setDateTo] = useState('2026-11')
  const [reportPreview, setReportPreview] = useState<string | null>(null)
  const current = sales.find((item) => item.month === selectedMonth) ?? sales[4]
  const salesRows = useMemo(() => selectedSalesperson === 'All salespeople' ? people : people.filter((person) => person.name === selectedSalesperson), [selectedSalesperson])
  const salesWindow = sales.filter((item) => {
    const monthNumber = String(months.indexOf(item.month) + 6).padStart(2, '0')
    const value = `2026-${monthNumber}`
    return value >= dateFrom && value <= dateTo
  })
  const conversion = Math.round(current.orders / current.enquiries * 100)

  const overview = () => <>
    <PageHeader eyebrow="Management workspace" title="Executive Overview" description="A consolidated view of illustrative company activity across sales, finance, inventory, installation, and service." actions={<Badge tone="info">Illustrative demo data</Badge>} />
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Metric label="Total revenue" value={money(9830000)} comparison="↑ 12.4%" icon={HandCoins} />
      <Metric label="Monthly revenue" value={money(current.revenue)} comparison="↑ 8.2%" icon={ChartNoAxesCombined} />
      <Metric label="Total orders" value="134" comparison="↑ 6.8%" icon={ReceiptText} />
      <Metric label="Active enquiries" value={String(current.enquiries)} comparison="↑ 4.1%" icon={Activity} />
      <Metric label="Conversion rate" value={`${conversion}%`} comparison="↑ 2.3 pts" icon={CheckCircle2} />
      <Metric label="Pending quotations" value="26" comparison="↓ 3.5%" positive={false} icon={ClipboardList} />
      <Metric label="Outstanding payments" value={money(1840000)} comparison="↓ 5.2%" icon={CalendarDays} />
      <Metric label="Completed installations" value={String(current.installations)} comparison="↑ 9.1%" icon={PackageCheck} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-3">
      <Panel title="Revenue trend" subtitle="Monthly illustrative revenue · INR" className="xl:col-span-2"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={sales} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 100000)}L`} /><Tooltip formatter={(value) => money(Number(value))} /><Line type="monotone" dataKey="revenue" name="Revenue · demo" stroke="var(--sv-brand)" strokeWidth={3} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></div></Panel>
      <Panel title="Department pulse" subtitle="Illustrative active work items"><ul className="space-y-4">{departments.map((department) => <li key={department.name}><div className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-app-text">{department.name}</span><span className="tabular-nums text-muted">{department.active} active</span></div><div className="mt-2 h-1.5 rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, department.active * 4)}%` }} /></div></li>)}</ul><p className="mt-4 text-xs leading-relaxed text-muted">Workload indicators summarize sample activity only; they do not rank employees.</p></Panel>
    </div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><RecentOrders /><ActivityTimeline compact /></div>
  </>

  const salesPage = () => <>
    <PageHeader eyebrow="Management workspace" title="Sales Performance" description="Revenue, conversion, quotation, and order summaries. All figures are illustrative." actions={<div className="grid grid-cols-2 gap-2"><Select label="Reporting month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}>{months.map((month) => <option key={month}>{month}</option>)}</Select><Select label="Salesperson" value={selectedSalesperson} onChange={(event) => setSelectedSalesperson(event.target.value)}>{salespeople.map((name) => <option key={name}>{name}</option>)}</Select><Input label="From month" type="month" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} /><Input label="To month" type="month" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} /></div>} />
    <div className="grid gap-4 sm:grid-cols-3"><Metric label={`${selectedMonth} revenue`} value={money(current.revenue)} comparison="↑ 8.2%" icon={HandCoins} /><Metric label="Enquiry to order" value={`${conversion}%`} comparison="↑ 2.3 pts" icon={CheckCircle2} /><Metric label="Pending quotations" value="26" comparison="↓ 3.5%" positive={false} icon={ClipboardList} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Panel title="Monthly revenue trend" subtitle={`Revenue · INR · ${dateFrom} through ${dateTo} · demo`}><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={salesWindow} margin={{ top: 8, right: 10, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 100000)}L`} /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="revenue" name="Revenue · demo" fill="var(--sv-brand)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel>
      <Panel title="Quotation status" subtitle="Sample quotation counts"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={quotations} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={92} label>{quotations.map((row, index) => <Cell key={row.status} fill={quotationColors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-2">{quotations.map((row, index) => <Badge key={row.status} tone="neutral"><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: quotationColors[index] }} />{row.status}: {row.count}</Badge>)}</div></Panel>
      <SalespersonPanel rows={salesRows} /><RecentOrders /></div>
  </>

  const financePage = () => <>
    <PageHeader eyebrow="Management workspace" title="Finance Overview" description="Reporting summaries only. Payment processing and refunds are not available in this preview." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Payments received" value={money(7280000)} comparison="↑ 10.6%" icon={HandCoins} /><Metric label="Pending collections" value={money(920000)} comparison="↓ 2.1%" positive={false} icon={CalendarDays} /><Metric label="Outstanding balances" value={money(1840000)} comparison="↓ 5.2%" icon={ReceiptText} /><Metric label="Refunds summary" value={money(183000)} comparison="↑ 1.4%" positive={false} icon={Activity} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Panel title="Monthly collections" subtitle="Illustrative collections · INR"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={sales} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 100000)}L`} /><Tooltip formatter={(value) => money(Number(value))} /><Line type="monotone" dataKey="collections" name="Collections · demo" stroke="var(--sv-brand-fresh)" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel><Panel title="Collection summary" subtitle="Demo receivables snapshot"><dl className="space-y-4">{[['Collected this month', money(current.collections)], ['Awaiting customer payment', money(920000)], ['Overdue balance sample', money(540000)], ['Refunds requested / processed', money(183000)]].map(([label, value]) => <div key={label} className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0"><dt className="text-sm text-muted">{label}</dt><dd className="font-semibold tabular-nums text-app-text">{value}</dd></div>)}</dl><p className="mt-2 text-xs text-muted">Illustrative totals only; payment and refund actions are not performed here.</p></Panel></div>
  </>

  const inventoryPage = () => <>
    <PageHeader eyebrow="Management workspace" title="Inventory Overview" description="Sample stock availability, reservations, recent movements, and location summary." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Total products" value="83" comparison="↑ 3.8%" icon={Boxes} /><Metric label="Available stock" value="989 units" comparison="↑ 6.2%" icon={PackageCheck} /><Metric label="Reserved stock" value="245 units" comparison="↑ 2.4%" icon={ClipboardList} /><Metric label="Low-stock items" value="7" comparison="↑ 1 item" positive={false} icon={Activity} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-3"><Panel title="Stock summary" subtitle="Illustrative product category balances" className="xl:col-span-2"><Table><TableHead><tr><TableHeader>Product category</TableHeader><TableHeader>Available</TableHeader><TableHeader>Reserved</TableHeader><TableHeader>Status</TableHeader></tr></TableHead><TableBody>{productStock.map((product) => <TableRow key={product.product}><TableCell className="font-medium">{product.product}</TableCell><TableCell>{product.available}</TableCell><TableCell>{product.reserved}</TableCell><TableCell><Badge tone={product.status === 'Healthy' ? 'success' : 'warning'}>{product.status} · demo</Badge></TableCell></TableRow>)}</TableBody></Table></Panel><Panel title="Warehouse summary" subtitle="Sample locations"><ul className="space-y-4">{warehouses.map((warehouse) => <li key={warehouse.name} className="rounded-md border border-border p-3"><p className="font-medium text-app-text">{warehouse.name}</p><p className="mt-1 text-xs text-muted">{warehouse.products} product types</p><p className="mt-2 text-sm text-app-text">{warehouse.available} available · {warehouse.reserved} reserved</p></li>)}</ul></Panel><Panel title="Recent stock movements" subtitle="Illustrative inventory activity" className="xl:col-span-3"><Table><TableHead><tr><TableHeader>Date</TableHeader><TableHeader>Product</TableHeader><TableHeader>Movement</TableHeader><TableHeader>Quantity</TableHeader><TableHeader>Warehouse</TableHeader></tr></TableHead><TableBody>{movements.map((movement) => <TableRow key={`${movement.date}-${movement.product}`}><TableCell>{movement.date}</TableCell><TableCell>{movement.product}</TableCell><TableCell>{movement.movement}</TableCell><TableCell className="font-semibold">{movement.quantity}</TableCell><TableCell>{movement.location}</TableCell></TableRow>)}</TableBody></Table></Panel></div>
  </>

  const installationsPage = () => <>
    <PageHeader eyebrow="Management workspace" title="Installation Operations" description="Illustrative installation schedule, completions, and balanced technician workload." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Scheduled installations" value="18" comparison="↑ 4.5%" icon={CalendarDays} /><Metric label="In progress" value="9" comparison="↓ 1.2%" positive={false} icon={Wrench} /><Metric label="Completed this month" value={String(current.installations)} comparison="↑ 9.1%" icon={CheckCircle2} /><Metric label="Delayed installations" value="3" comparison="↓ 2 cases" icon={Truck} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Panel title="Installation completion trend" subtitle="Illustrative monthly completions"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={sales} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Bar dataKey="installations" name="Completed · demo" fill="var(--sv-brand)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Panel><Panel title="Technician workload" subtitle="Team-level sample workload; not a ranking"><Table><TableHead><tr><TableHeader>Technician</TableHeader><TableHeader>Assigned</TableHeader><TableHeader>Active</TableHeader><TableHeader>Completed</TableHeader><TableHeader>Workload</TableHeader></tr></TableHead><TableBody>{technicians.map((technician) => <TableRow key={technician.name}><TableCell className="font-medium">{technician.name}</TableCell><TableCell>{technician.assigned}</TableCell><TableCell>{technician.active}</TableCell><TableCell>{technician.completed}</TableCell><TableCell><Badge tone={technician.workload === 'Balanced' ? 'success' : 'warning'}>{technician.workload}</Badge></TableCell></TableRow>)}</TableBody></Table><p className="mt-3 text-xs text-muted">Sample allocation helps illustrate coverage; it is not an employee performance score.</p></Panel></div>
  </>

  const servicePage = () => <>
    <PageHeader eyebrow="Management workspace" title="Service & Warranty Overview" description="Illustrative service demand, customer confirmation, and warranty tracking summaries." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"><Metric label="Open service tickets" value="27" comparison="↓ 3.2%" positive={false} icon={Wrench} /><Metric label="High-priority tickets" value="6" comparison="↓ 1 case" positive={false} icon={Activity} /><Metric label="Awaiting customer confirmation" value="8" comparison="↑ 2 cases" positive={false} icon={CalendarDays} /><Metric label="Active warranties" value="216" comparison="↑ 8.4%" icon={ShieldCheck} /><Metric label="Expiring warranties" value="12" comparison="↑ 3 cases" positive={false} icon={CalendarDays} /><Metric label="Tickets this month" value={String(current.tickets)} comparison="↑ 4.8%" icon={ChartNoAxesCombined} /></div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Panel title="Monthly service ticket trend" subtitle="Illustrative created tickets"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={sales} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis allowDecimals={false} tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><Tooltip /><Line type="monotone" dataKey="tickets" name="Tickets · demo" stroke="var(--sv-brand)" strokeWidth={3} /></LineChart></ResponsiveContainer></div></Panel><Panel title="Service and warranty snapshot" subtitle="Sample oversight indicators"><div className="space-y-4">{[['Awaiting customer confirmation', 8, 'Resolved work remains open until customer confirmation.'], ['Active warranty records', 216, 'Illustrative active warranty count.'], ['Warranty expiry watch', 12, 'Sample records in an illustrative upcoming window.']].map(([label, value, description]) => <div key={String(label)} className="flex gap-3 rounded-md border border-border p-3"><span className="mt-0.5 text-brand"><ShieldCheck aria-hidden="true" className="size-5" /></span><div><p className="font-semibold text-app-text">{value} · {label}</p><p className="mt-1 text-xs text-muted">{description}</p></div></div>)}</div></Panel></div>
  </>

  const peoplePage = () => <>
    <PageHeader eyebrow="Management workspace" title="Departments & People" description="Illustrative team coverage and active work summaries. No individual ranking or real performance measurement is shown." />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{departments.map((department) => <Card key={department.name} className="p-5"><div className="flex items-start justify-between gap-2"><div><h2 className="font-semibold text-app-text">{department.name}</h2><p className="mt-1 text-sm text-muted">{department.employees} sample employees</p></div><Badge tone="brand">Team view</Badge></div><p className="mt-4 text-2xl font-bold tabular-nums text-app-text">{department.active}<span className="ml-2 text-sm font-medium text-muted">active work items</span></p><p className="mt-2 text-xs leading-relaxed text-muted">{department.workload}</p><div className="mt-4 h-2 rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, department.active * 4)}%` }} /></div></Card>)}</div>
    <div className="mt-5 grid gap-5 xl:grid-cols-2"><Panel title="Sales team workload" subtitle="Illustrative activity totals; neutral presentation"><SalespersonPanel rows={people} /></Panel><Panel title="Installation team coverage" subtitle="Sample assigned and active workload"><Table><TableHead><tr><TableHeader>Team member</TableHeader><TableHeader>Assigned</TableHeader><TableHeader>Active</TableHeader><TableHeader>Completed</TableHeader><TableHeader>Coverage</TableHeader></tr></TableHead><TableBody>{technicians.map((person) => <TableRow key={person.name}><TableCell className="font-medium">{person.name}</TableCell><TableCell>{person.assigned}</TableCell><TableCell>{person.active}</TableCell><TableCell>{person.completed}</TableCell><TableCell><Badge tone="info">{person.workload}</Badge></TableCell></TableRow>)}</TableBody></Table></Panel></div>
  </>

  const reportsPage = () => <>
    <PageHeader eyebrow="Management workspace" title="Reports & Business Activity" description="Preview report categories and a recent illustrative activity timeline. Nothing is exported." />
    <div className="grid gap-5 xl:grid-cols-3"><Panel title="Report previews" subtitle="Demo summaries only" className="xl:col-span-2"><div className="grid gap-3 sm:grid-cols-2">{reports.map((report) => <div key={report.title} className="flex flex-col justify-between gap-4 rounded-md border border-border p-4"><div><h3 className="font-semibold text-app-text">{report.title}</h3><p className="mt-1 text-sm text-muted">{report.description}</p></div><Button variant="secondary" className="self-start" icon={<FileBarChart aria-hidden="true" className="size-4" />} onClick={() => setReportPreview(report.title)}>Preview demo report</Button></div>)}</div></Panel><ActivityTimeline /></div>
    <Panel title="Monthly business summary" subtitle={`${selectedMonth} illustrative overview`} className="mt-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Revenue', money(current.revenue)], ['Orders', String(current.orders)], ['Collections', money(current.collections)], ['Installations completed', String(current.installations)]].map(([label, value]) => <div key={label} className="rounded-md bg-surface-raised p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-xl font-bold text-app-text">{value}</p></div>)}</div><p className="mt-4 text-xs text-muted">Summary figures are fictional demo data and are not company records.</p></Panel>
  </>

  const content = () => {
    switch (section) {
      case 'overview': return overview()
      case 'sales': return salesPage()
      case 'finance': return financePage()
      case 'inventory': return inventoryPage()
      case 'installations': return installationsPage()
      case 'service': return servicePage()
      case 'people': return peoplePage()
      case 'reports': return reportsPage()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close management navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="management-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><span className="font-bold">SolarVerse <span className="text-xs font-medium text-muted">Management</span></span><IconButton label="Close management navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Executive preview</p><p className="mt-1 text-sm font-medium text-app-text">Demo management workspace</p></div>
      <nav aria-label="Management navigation" className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMobileNavOpen(false) }} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative demo · local view only</div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open management navigation" aria-expanded={mobileNavOpen} aria-controls="management-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Management workspace</span></div><ThemeToggle /></header>
      <main className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">MANAGEMENT DEMO PREVIEW — NOT AUTHENTICATED</div><div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All figures, employees, customers, orders, inventory, activity, and reports in this preview are illustrative. They do not represent live company information.</div>{content()}</main>
    </div>
    <Modal open={reportPreview !== null} onClose={() => setReportPreview(null)} title={reportPreview ?? 'Report preview'} description="Illustrative report preview · no company data exported"><div className="space-y-4"><div className="rounded-md border border-info/30 bg-info/5 p-4 text-sm leading-relaxed text-app-text">This demonstration summarizes sample information for <strong>{reportPreview}</strong>. It is a preview only; no report file is generated and no live company data is accessed.</div><dl className="grid gap-3 sm:grid-cols-2">{[['Reporting month', selectedMonth], ['Revenue sample', money(current.revenue)], ['Order count sample', String(current.orders)], ['Collection sample', money(current.collections)]].map(([label, value]) => <div key={label} className="rounded-md bg-surface-raised p-3"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-semibold text-app-text">{value}</dd></div>)}</dl><Button variant="secondary" onClick={() => setReportPreview(null)}>Close preview</Button></div></Modal>
  </div>
}

function SalespersonPanel({ rows }: { rows: typeof people }) {
  return <div className="overflow-x-auto"><Table><TableHead><tr><TableHeader>Salesperson</TableHeader><TableHeader>Enquiries</TableHeader><TableHeader>Orders</TableHeader><TableHeader>Follow-ups</TableHeader></tr></TableHead><TableBody>{rows.map((person) => <TableRow key={person.name}><TableCell className="whitespace-nowrap font-medium">{person.name}</TableCell><TableCell>{person.enquiries}</TableCell><TableCell>{person.orders}</TableCell><TableCell><div className="flex min-w-28 items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${person.followups}%` }} /></div><span className="text-xs text-muted">{person.followups}%</span></div></TableCell></TableRow>)}</TableBody></Table><p className="mt-2 text-xs text-muted">Sample workload summaries are shown without comparative ranking.</p></div>
}

function RecentOrders() {
  return <Panel title="Recent orders" subtitle="Illustrative order snapshots"><Table><TableHead><tr><TableHeader>Order</TableHeader><TableHeader>Customer</TableHeader><TableHeader>Sales owner</TableHeader><TableHeader>Amount</TableHeader><TableHeader>Status</TableHeader></tr></TableHead><TableBody>{orders.map((order) => <TableRow key={order.id}><TableCell className="whitespace-nowrap font-medium">{order.id}</TableCell><TableCell className="whitespace-nowrap">{order.customer}</TableCell><TableCell className="whitespace-nowrap">{order.owner}</TableCell><TableCell className="whitespace-nowrap">{money(order.amount)}</TableCell><TableCell><Badge tone={order.status === 'Completed' ? 'success' : 'info'}>{order.status}</Badge></TableCell></TableRow>)}</TableBody></Table></Panel>
}

function ActivityTimeline({ compact = false }: { compact?: boolean }) {
  const rows = compact ? activity.slice(0, 4) : activity
  return <Panel title="Recent business activity" subtitle="Fictional cross-department events"><ol className="space-y-4">{rows.map((item) => <li key={`${item.time}-${item.label}`} className="flex gap-3"><span aria-hidden="true" className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-brand/10 text-brand"><Activity className="size-4" /></span><div className="min-w-0"><p className="text-sm leading-relaxed text-app-text">{item.label}</p><p className="mt-1 text-xs text-muted">{item.time} · {item.group} · demo</p></div></li>)}</ol></Panel>
}

export default ManagementDashboard
