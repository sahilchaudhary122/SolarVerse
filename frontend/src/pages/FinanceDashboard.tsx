import { useMemo, useState } from 'react'
import { Activity, Banknote, CalendarDays, ChartNoAxesCombined, CircleDollarSign, Clock3, CreditCard, FileText, HandCoins, Menu, ReceiptText, RotateCcw, X } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge, Button, Card, IconButton, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ThemeToggle } from '../components/ui'
import { Pagination, type PageSize } from '../components/ui/Pagination'

type PaymentStatus = 'Paid' | 'Pending' | 'Overdue' | 'Failed'
type RefundStatus = 'Requested' | 'Under review' | 'Approved' | 'Rejected' | 'Processed'
type PaymentMethod = 'Bank transfer' | 'UPI' | 'Card' | 'Cash'
type Payment = { id: string; customer: string; orderId: string; date: string; amount: number; method: PaymentMethod; status: PaymentStatus; reference: string; note: string }
type Outstanding = { id: string; customer: string; orderId: string; total: number; paid: number; dueDate: string; followUp: 'Not contacted' | 'Reminder sent' | 'Customer contacted' }
type Refund = { id: string; paymentId: string; customer: string; amount: number; reason: string; requestDate: string; status: RefundStatus; note: string }
type Section = 'overview' | 'payments' | 'outstanding' | 'refunds' | 'reports'
type Detail = { kind: 'payment'; item: Payment } | { kind: 'outstanding'; item: Outstanding } | { kind: 'refund'; item: Refund } | null

const paymentStatuses: PaymentStatus[] = ['Paid', 'Pending', 'Overdue', 'Failed']
const paymentMethods: PaymentMethod[] = ['Bank transfer', 'UPI', 'Card', 'Cash']
const refundStatuses: RefundStatus[] = ['Requested', 'Under review', 'Approved', 'Rejected', 'Processed']
const nav: Array<{ id: Section; label: string; icon: typeof CircleDollarSign }> = [
  { id: 'overview', label: 'Finance Overview', icon: ChartNoAxesCombined },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'outstanding', label: 'Outstanding', icon: Clock3 },
  { id: 'refunds', label: 'Refunds', icon: RotateCcw },
  { id: 'reports', label: 'Financial Reports', icon: FileText },
]

const customers = ['Aarav Mehta', 'Isha Nair', 'Kabir Shah', 'Mira Patel', 'Dev Khanna', 'Anaya Rao', 'Rohan Das', 'Tara Menon', 'Arjun Iyer', 'Nila Bose', 'Vivaan Jain', 'Diya Kapoor']
const demoPayments: Payment[] = Array.from({ length: 28 }, (_, i) => ({
  id: `DEMO-PAY-${String(301 + i).padStart(4, '0')}`,
  customer: customers[i % customers.length],
  orderId: `DEMO-ORD-${String(801 + (i % 23)).padStart(4, '0')}`,
  date: `2026-${String(10 + Math.floor(i / 20)).padStart(2, '0')}-${String((i * 3) % 27 + 1).padStart(2, '0')}`,
  amount: [18500, 42000, 67500, 98000, 126000, 24500, 73500][i % 7],
  method: paymentMethods[i % paymentMethods.length],
  status: paymentStatuses[(i * 3 + 1) % paymentStatuses.length],
  reference: `DEMO-REF-${String(5101 + i)}`,
  note: 'Illustrative payment record. No payment gateway or bank transaction is connected.',
}))
const demoOutstanding: Outstanding[] = Array.from({ length: 18 }, (_, i) => ({
  id: `DEMO-BAL-${String(101 + i).padStart(4, '0')}`,
  customer: customers[(i + 2) % customers.length],
  orderId: `DEMO-ORD-${String(901 + i).padStart(4, '0')}`,
  total: [145000, 228000, 310000, 184500, 267000, 199000][i % 6],
  paid: [45000, 78000, 110000, 64500, 97000, 99000][i % 6],
  dueDate: `2026-10-${String(8 + (i * 2) % 22).padStart(2, '0')}`,
  followUp: (['Not contacted', 'Reminder sent', 'Customer contacted'] as const)[i % 3],
}))
const demoRefunds: Refund[] = Array.from({ length: 16 }, (_, i) => ({
  id: `DEMO-RFD-${String(201 + i).padStart(4, '0')}`,
  paymentId: `DEMO-PAY-${String(302 + i).padStart(4, '0')}`,
  customer: customers[(i + 4) % customers.length],
  amount: [8500, 12500, 22000, 17500, 31000, 9600][i % 6],
  reason: ['Order scope changed', 'Duplicate demo payment', 'Order cancelled in sample data', 'Billing adjustment'][i % 4],
  requestDate: `2026-10-${String(3 + (i * 2) % 25).padStart(2, '0')}`,
  status: refundStatuses[(i * 2) % refundStatuses.length],
  note: 'Illustrative refund request only. No funds are moved or returned.',
}))

const monthlyFinance = [
  { month: 'Jun', revenue: 1480000, collections: 1210000, refunds: 68000 },
  { month: 'Jul', revenue: 1630000, collections: 1380000, refunds: 72000 },
  { month: 'Aug', revenue: 1890000, collections: 1540000, refunds: 91000 },
  { month: 'Sep', revenue: 1710000, collections: 1490000, refunds: 84000 },
  { month: 'Oct', revenue: 2140000, collections: 1820000, refunds: 103000 },
  { month: 'Nov', revenue: 980000, collections: 760000, refunds: 39000 },
]
const chartColors = ['var(--sv-brand-strong)', 'var(--sv-brand)', 'var(--sv-brand-fresh)', 'var(--sv-warning)']
const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const formatAmount = (amount: number) => inr.format(amount)
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
function daysOverdue(dueDate: string) { return Math.max(0, Math.floor((new Date('2026-11-01T00:00:00').getTime() - new Date(`${dueDate}T00:00:00`).getTime()) / 86400000)) }
function paymentTone(status: PaymentStatus) { return status === 'Paid' ? 'success' as const : status === 'Overdue' || status === 'Failed' ? 'danger' as const : 'warning' as const }
function refundTone(status: RefundStatus) { return status === 'Processed' || status === 'Approved' ? 'success' as const : status === 'Rejected' ? 'danger' as const : status === 'Under review' ? 'info' as const : 'warning' as const }

function Metric({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof CircleDollarSign }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-2xl font-bold tabular-nums text-app-text sm:text-3xl">{value}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div><p className="mt-2 text-xs text-muted">{detail}</p></Card>
}

export function FinanceDashboard() {
  const [section, setSection] = useState<Section>('overview')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [payments, setPayments] = useState(demoPayments)
  const [outstanding, setOutstanding] = useState(demoOutstanding)
  const [refunds, setRefunds] = useState(demoRefunds)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [methodFilter, setMethodFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState<PageSize>(10)
  const [detail, setDetail] = useState<Detail>(null)
  const [notice, setNotice] = useState('')

  const paidTotal = payments.filter((payment) => payment.status === 'Paid').reduce((sum, payment) => sum + payment.amount, 0)
  const pendingTotal = payments.filter((payment) => payment.status === 'Pending').reduce((sum, payment) => sum + payment.amount, 0)
  const overdueTotal = payments.filter((payment) => payment.status === 'Overdue').reduce((sum, payment) => sum + payment.amount, 0)
  const refundTotal = refunds.filter((refund) => refund.status === 'Processed').reduce((sum, refund) => sum + refund.amount, 0)
  const outstandingTotal = outstanding.reduce((sum, item) => sum + Math.max(0, item.total - item.paid), 0)
  const dateFilteredPayments = useMemo(() => payments.filter((payment) => {
    return payment.date >= dateFrom && (!dateTo || payment.date <= dateTo)
  }), [payments, dateFrom, dateTo])
  const filteredPayments = dateFilteredPayments.filter((payment) => {
    const text = `${payment.id} ${payment.customer} ${payment.orderId} ${payment.reference} ${payment.method} ${payment.status}`.toLowerCase()
    return text.includes(search.toLowerCase()) && (statusFilter === 'all' || payment.status === statusFilter) && (methodFilter === 'all' || payment.method === methodFilter)
  })
  const filteredOutstanding = outstanding.filter((item) => `${item.id} ${item.customer} ${item.orderId} ${item.followUp}`.toLowerCase().includes(search.toLowerCase()))
  const filteredRefunds = refunds.filter((refund) => `${refund.id} ${refund.paymentId} ${refund.customer} ${refund.reason} ${refund.status}`.toLowerCase().includes(search.toLowerCase()))
  const activeRecords = section === 'payments' ? filteredPayments : section === 'outstanding' ? filteredOutstanding : section === 'refunds' ? filteredRefunds : []
  const pages = Math.max(1, Math.ceil(activeRecords.length / pageSize))
  const currentPage = Math.min(page, pages)
  const pageRecords = activeRecords.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const resetPage = () => setPage(1)
  const notify = (message: string) => setNotice(`${message} This is a local demo change only; no payment, refund, or database record was updated.`)

  const changePaymentStatus = (payment: Payment, status: PaymentStatus) => {
    setPayments((rows) => rows.map((row) => row.id === payment.id ? { ...row, status } : row))
    setDetail({ kind: 'payment', item: { ...payment, status } })
    notify(`${payment.id} preview status changed to ${status}.`)
  }
  const changeFollowUp = (item: Outstanding, followUp: Outstanding['followUp']) => {
    setOutstanding((rows) => rows.map((row) => row.id === item.id ? { ...row, followUp } : row))
    setDetail({ kind: 'outstanding', item: { ...item, followUp } })
    notify(`${item.id} follow-up preview updated.`)
  }
  const changeRefundStatus = (refund: Refund, status: RefundStatus) => {
    setRefunds((rows) => rows.map((row) => row.id === refund.id ? { ...row, status } : row))
    setDetail({ kind: 'refund', item: { ...refund, status } })
    notify(`${refund.id} preview status changed to ${status}.`)
  }

  const metrics = () => <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
    <Metric label="Total revenue" value={formatAmount(monthlyFinance.reduce((sum, item) => sum + item.revenue, 0))} detail="Illustrative order value across sample months" icon={CircleDollarSign} />
    <Metric label="Payments received" value={formatAmount(paidTotal)} detail="Sample records marked paid" icon={Banknote} />
    <Metric label="Pending payments" value={formatAmount(pendingTotal)} detail="Sample records awaiting payment" icon={Clock3} />
    <Metric label="Overdue payments" value={formatAmount(overdueTotal)} detail="Illustrative overdue sample records" icon={CalendarDays} />
    <Metric label="Total refunds" value={formatAmount(refundTotal)} detail="Sample refunds marked processed" icon={RotateCcw} />
    <Metric label="Monthly collections" value={formatAmount(monthlyFinance[4].collections)} detail="Illustrative October collection total" icon={HandCoins} />
  </div>

  const overview = () => <>
    <PageHeader eyebrow="Finance workspace" title="Finance Overview" description="Illustrative payment, collection, refund, and outstanding balance summary." />
    {metrics()}
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Revenue and collections</h2><p className="mt-1 text-sm text-muted">Monthly sample amounts · INR</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyFinance} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 100000)}L`} /><Tooltip formatter={(value) => formatAmount(Number(value))} /><Bar dataKey="revenue" name="Revenue · demo" fill="var(--sv-brand-strong)" radius={[4, 4, 0, 0]} /><Bar dataKey="collections" name="Collections · demo" fill="var(--sv-brand-fresh)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Payment methods</h2><p className="mt-1 text-sm text-muted">Illustrative payment count by method</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={paymentMethods.map((method) => ({ method, count: payments.filter((payment) => payment.method === method).length }))} dataKey="count" nameKey="method" cx="50%" cy="50%" outerRadius={92} label>{paymentMethods.map((method, index) => <Cell key={method} fill={chartColors[index]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-2">{paymentMethods.map((method, index) => <Badge key={method} tone="neutral"><span className="mr-1 inline-block size-2 rounded-full" style={{ backgroundColor: chartColors[index] }} />{method}</Badge>)}</div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Paid versus pending</h2><p className="mt-1 text-sm text-muted">Payment status value across illustrative records</p><div className="mt-4 space-y-4">{paymentStatuses.map((status) => { const total = payments.filter((payment) => payment.status === status).reduce((sum, payment) => sum + payment.amount, 0); const width = Math.max(2, total / Math.max(1, paidTotal + pendingTotal + overdueTotal) * 100); return <div key={status}><div className="mb-1 flex items-center justify-between gap-2 text-sm"><span className="text-app-text">{status}</span><span className="font-semibold tabular-nums text-app-text">{formatAmount(total)}</span></div><div className="h-2 overflow-hidden rounded-full bg-surface-raised"><div className="h-full rounded-full bg-brand" style={{ width: `${width}%`, opacity: status === 'Paid' ? 1 : status === 'Pending' ? .7 : .45 }} /></div></div> })}</div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Outstanding balances</h2><p className="mt-1 text-sm text-muted">Remaining amounts on sample orders</p><p className="mt-5 text-3xl font-bold text-app-text">{formatAmount(outstandingTotal)}</p><p className="mt-1 text-sm text-muted">Across {outstanding.length} illustrative orders</p><Button className="mt-5" variant="secondary" onClick={() => { setSection('outstanding'); setSearch(''); resetPage() }}>Review outstanding payments</Button></Card>
    </div>
  </>

  const paymentsPage = () => <>
    <PageHeader eyebrow="Finance workspace" title="Payment Management" description="Illustrative payment records. Status changes are local previews and do not process money." />
    <Card className="overflow-hidden"><div className="grid gap-3 border-b border-border p-4 sm:grid-cols-2 xl:grid-cols-5">
      <div className="sm:col-span-2 xl:col-span-1"><Input label="Search payments" type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Payment, customer, order" /></div>
      <Select label="Payment status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); resetPage() }}><option value="all">All statuses</option>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</Select>
      <Select label="Payment method" value={methodFilter} onChange={(event) => { setMethodFilter(event.target.value); resetPage() }}><option value="all">All methods</option>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</Select>
      <Input label="From date" type="date" value={dateFrom} onChange={(event) => { setDateFrom(event.target.value); resetPage() }} />
      <Input label="To date" type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => { setDateTo(event.target.value); resetPage() }} />
    </div>{pageRecords.length ? <Table><TableHead><tr><TableHeader>Payment ID</TableHeader><TableHeader>Customer / order</TableHeader><TableHeader>Payment date</TableHeader><TableHeader>Amount</TableHeader><TableHeader>Method</TableHeader><TableHeader>Status</TableHeader><TableHeader>Reference</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{(pageRecords as Payment[]).map((payment) => <TableRow key={payment.id}><TableCell className="whitespace-nowrap font-semibold">{payment.id}</TableCell><TableCell><div className="font-medium">{payment.customer}</div><div className="mt-1 text-xs text-muted">{payment.orderId}</div></TableCell><TableCell className="whitespace-nowrap">{formatDate(payment.date)}</TableCell><TableCell className="whitespace-nowrap font-medium">{formatAmount(payment.amount)}</TableCell><TableCell>{payment.method}</TableCell><TableCell><Badge tone={paymentTone(payment.status)}>{payment.status}</Badge></TableCell><TableCell className="whitespace-nowrap text-xs">{payment.reference}</TableCell><TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetail({ kind: 'payment', item: payment })}>Details</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">No illustrative payments match these search and filter values.</div>}
      <Pagination currentPage={page} pageSize={pageSize} totalCount={filteredPayments.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); resetPage() }} label="Payment table pages" />
    </Card>
  </>

  const outstandingPage = () => <>
    <PageHeader eyebrow="Finance workspace" title="Outstanding Payments" description="Illustrative order balances and local follow-up tracking. No reminders are sent." />
    <Card className="overflow-hidden"><div className="border-b border-border p-4"><Input label="Search outstanding payments" type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Customer, order or balance ID" /></div>{pageRecords.length ? <Table><TableHead><tr><TableHeader>Customer</TableHeader><TableHeader>Order ID</TableHeader><TableHeader>Total order</TableHeader><TableHeader>Amount paid</TableHeader><TableHeader>Remaining</TableHeader><TableHeader>Due date</TableHeader><TableHeader>Days overdue</TableHeader><TableHeader>Follow-up</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{(pageRecords as Outstanding[]).map((item) => <TableRow key={item.id}><TableCell><div className="font-medium">{item.customer}</div><div className="mt-1 text-xs text-muted">{item.id}</div></TableCell><TableCell>{item.orderId}</TableCell><TableCell>{formatAmount(item.total)}</TableCell><TableCell>{formatAmount(item.paid)}</TableCell><TableCell className="font-semibold">{formatAmount(Math.max(0, item.total - item.paid))}</TableCell><TableCell className="whitespace-nowrap">{formatDate(item.dueDate)}</TableCell><TableCell><Badge tone={daysOverdue(item.dueDate) > 0 ? 'warning' : 'success'}>{daysOverdue(item.dueDate)}</Badge></TableCell><TableCell>{item.followUp}</TableCell><TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetail({ kind: 'outstanding', item })}>Details</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">No illustrative outstanding orders match this search.</div>}<Pagination currentPage={page} pageSize={pageSize} totalCount={filteredOutstanding.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); resetPage() }} label="Outstanding payments pages" /></Card>
  </>

  const refundsPage = () => <>
    <PageHeader eyebrow="Finance workspace" title="Refund Management" description="Illustrative refund requests. Status changes do not issue or return funds." />
    <Card className="overflow-hidden"><div className="border-b border-border p-4"><Input label="Search refunds" type="search" value={search} onChange={(event) => { setSearch(event.target.value); resetPage() }} placeholder="Refund, payment, customer or reason" /></div>{pageRecords.length ? <Table><TableHead><tr><TableHeader>Refund ID</TableHeader><TableHeader>Original payment</TableHeader><TableHeader>Customer</TableHeader><TableHeader>Refund amount</TableHeader><TableHeader>Reason</TableHeader><TableHeader>Request date</TableHeader><TableHeader>Status</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead><TableBody>{(pageRecords as Refund[]).map((refund) => <TableRow key={refund.id}><TableCell className="whitespace-nowrap font-semibold">{refund.id}</TableCell><TableCell>{refund.paymentId}</TableCell><TableCell>{refund.customer}</TableCell><TableCell className="whitespace-nowrap">{formatAmount(refund.amount)}</TableCell><TableCell>{refund.reason}</TableCell><TableCell className="whitespace-nowrap">{formatDate(refund.requestDate)}</TableCell><TableCell><Badge tone={refundTone(refund.status)}>{refund.status}</Badge></TableCell><TableCell><Button variant="secondary" className="min-h-8 whitespace-nowrap px-3 py-1 text-xs" onClick={() => setDetail({ kind: 'refund', item: refund })}>Details</Button></TableCell></TableRow>)}</TableBody></Table> : <div className="p-8 text-center text-sm text-muted">No illustrative refunds match this search.</div>}<Pagination currentPage={page} pageSize={pageSize} totalCount={filteredRefunds.length} onPageChange={setPage} onPageSizeChange={(size) => { setPageSize(size); resetPage() }} label="Refund table pages" /></Card>
  </>

  const reports = () => <>
    <PageHeader eyebrow="Finance workspace" title="Financial Reports" description="Illustrative summaries for revenue, collections, payment methods, refunds, and balances." />
    <div className="mb-5 grid gap-4 sm:grid-cols-2"><Metric label="Paid sample amount" value={formatAmount(paidTotal)} detail="Payments marked paid in this demo" icon={ReceiptText} /><Metric label="Pending + overdue balances" value={formatAmount(pendingTotal + overdueTotal + outstandingTotal)} detail="Separate sample payment and order balance totals" icon={Activity} /></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Monthly revenue and collections</h2><p className="mt-1 text-sm text-muted">Illustrative INR values</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><LineChart data={monthlyFinance} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 100000)}L`} /><Tooltip formatter={(value) => formatAmount(Number(value))} /><Line type="monotone" dataKey="revenue" name="Revenue · demo" stroke="var(--sv-brand-strong)" strokeWidth={2} /><Line type="monotone" dataKey="collections" name="Collections · demo" stroke="var(--sv-brand-fresh)" strokeWidth={2} /></LineChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Refund trends</h2><p className="mt-1 text-sm text-muted">Illustrative monthly request count and amount</p><div className="mt-4 h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthlyFinance} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="month" tick={{ fill: 'var(--sv-muted)', fontSize: 11 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatAmount(Number(value))} /><Bar dataKey="refunds" name="Refunds · demo" fill="var(--sv-warning)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div><p className="text-xs text-muted">Request volume: {refunds.length} sample refunds · Processed value: {formatAmount(refundTotal)}</p></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Paid vs pending amounts</h2><p className="mt-1 text-sm text-muted">Payment ledger status totals · demo</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={paymentStatuses.map((status) => ({ status, amount: payments.filter((payment) => payment.status === status).reduce((sum, payment) => sum + payment.amount, 0) }))} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="status" tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatAmount(Number(value))} /><Bar dataKey="amount" name="Amount · demo" fill="var(--sv-brand)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card className="p-5"><h2 className="font-semibold text-app-text">Outstanding balances</h2><p className="mt-1 text-sm text-muted">Balance remaining by sample order</p><div className="mt-4 h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={outstanding.slice(0, 8).map((item) => ({ order: item.orderId.slice(-4), balance: item.total - item.paid }))} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--sv-border)" /><XAxis dataKey="order" tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} /><YAxis tick={{ fill: 'var(--sv-muted)', fontSize: 10 }} tickFormatter={(value: number) => `${Math.round(value / 1000)}k`} /><Tooltip formatter={(value) => formatAmount(Number(value))} /><Bar dataKey="balance" name="Balance · demo" fill="var(--sv-brand-fresh)" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
    </div>
  </>

  const content = () => {
    switch (section) {
      case 'overview': return overview()
      case 'payments': return paymentsPage()
      case 'outstanding': return outstandingPage()
      case 'refunds': return refundsPage()
      case 'reports': return reports()
    }
  }

  return <div className="min-h-screen bg-app-bg text-app-text">
    {mobileNavOpen && <button type="button" aria-label="Close finance navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileNavOpen(false)} />}
    <aside id="finance-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileNavOpen ? 'visible translate-x-0' : 'invisible -translate-x-full lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><span className="font-bold">SolarVerse <span className="text-xs font-medium text-muted">Finance</span></span><IconButton label="Close finance navigation" className="lg:hidden" onClick={() => setMobileNavOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="border-b border-border px-5 py-4"><p className="text-xs font-bold uppercase tracking-wide text-muted">Finance preview</p><p className="mt-1 text-sm font-medium text-app-text">Demo finance workspace</p></div>
      <nav aria-label="Finance navigation" className="flex-1 space-y-1 overflow-y-auto p-3">{nav.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={section === id ? 'page' : undefined} onClick={() => { setSection(id); setMobileNavOpen(false); setSearch(''); setNotice(''); resetPage() }} className={`flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-medium transition-colors focus-visible:outline-offset-2 ${section === id ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</button>)}</nav>
      <div className="border-t border-border px-5 py-3 text-xs text-muted">Illustrative records · local state only</div>
    </aside>
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6"><div className="flex items-center gap-2"><IconButton label="Open finance navigation" aria-expanded={mobileNavOpen} aria-controls="finance-navigation" className="lg:hidden" onClick={() => setMobileNavOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">Finance workspace</span></div><ThemeToggle /></header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 sm:py-7 lg:px-8"><div role="alert" className="mb-5 rounded-md border border-warning/50 bg-warning/10 px-4 py-3 text-center text-sm font-bold tracking-wide text-app-text">FINANCE DEMO PREVIEW — NOT AUTHENTICATED</div><div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">All payment, order, customer, refund, date, and amount records are illustrative. No funds are processed, reminders sent, or records saved to a server or database.</div>{notice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{notice}</div>}{content()}</main>
    </div>
    <Modal open={detail !== null} onClose={() => setDetail(null)} title={detail?.item.id ?? 'Finance record'} description="Illustrative finance record. Changes remain local to this demo.">
      {detail?.kind === 'payment' && <div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2">{[['Customer', detail.item.customer], ['Order ID', detail.item.orderId], ['Payment date', formatDate(detail.item.date)], ['Amount', formatAmount(detail.item.amount)], ['Payment method', detail.item.method], ['Reference number', detail.item.reference]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-app-text">{value}</dd></div>)}</dl><div className="max-w-sm"><Select label="Demo payment status" value={detail.item.status} onChange={(event) => changePaymentStatus(detail.item, event.target.value as PaymentStatus)}>{paymentStatuses.map((status) => <option key={status}>{status}</option>)}</Select></div><p className="text-sm text-muted">{detail.item.note}</p></div>}
      {detail?.kind === 'outstanding' && <div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2">{[['Customer', detail.item.customer], ['Order ID', detail.item.orderId], ['Order total', formatAmount(detail.item.total)], ['Amount paid', formatAmount(detail.item.paid)], ['Remaining balance', formatAmount(detail.item.total - detail.item.paid)], ['Due date', formatDate(detail.item.dueDate)], ['Days overdue', String(daysOverdue(detail.item.dueDate))]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-app-text">{value}</dd></div>)}</dl><div className="max-w-sm"><Select label="Local demo follow-up status" value={detail.item.followUp} onChange={(event) => changeFollowUp(detail.item, event.target.value as Outstanding['followUp'])}><option>Not contacted</option><option>Reminder sent</option><option>Customer contacted</option></Select></div><p className="text-sm text-muted">Changing this preview does not send a customer communication.</p></div>}
      {detail?.kind === 'refund' && <div className="space-y-5"><dl className="grid gap-4 sm:grid-cols-2">{[['Original payment', detail.item.paymentId], ['Customer', detail.item.customer], ['Refund amount', formatAmount(detail.item.amount)], ['Reason', detail.item.reason], ['Request date', formatDate(detail.item.requestDate)]].map(([label, value]) => <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-app-text">{value}</dd></div>)}</dl><div className="max-w-sm"><Select label="Demo refund status" value={detail.item.status} onChange={(event) => changeRefundStatus(detail.item, event.target.value as RefundStatus)}>{refundStatuses.map((status) => <option key={status}>{status}</option>)}</Select></div><p className="text-sm text-muted">{detail.item.note}</p></div>}
    </Modal>
  </div>
}

export default FinanceDashboard
