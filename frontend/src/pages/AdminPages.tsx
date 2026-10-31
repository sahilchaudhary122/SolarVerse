import { useMemo, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Activity, Plus, Users, UserRoundCheck, UserRoundCog } from 'lucide-react'
import { z } from 'zod'
import { Badge, Button, Card, Input, Modal, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui'
import { STAFF_ROLES, type StaffRole } from '../auth/authService'

type WorkStatus = 'Not assigned' | 'Assigned' | 'In progress'
type StaffRecord = { employeeId: string; name: string; email: string; mobile: string; role: StaffRole; active: boolean; workStatus: WorkStatus }
type CustomerRecord = { customerId: string; name: string; email: string; mobile: string; registeredOn: string; active: boolean }

// Static, synthetic content for layout previews only. No records are fetched or persisted.
const initialStaff: StaffRecord[] = [
  { employeeId: 'DEMO-EMP-001', name: 'Demo Employee 01', email: 'employee01@example.test', mobile: '+00 000 000 101', role: 'sales', active: true, workStatus: 'Assigned' },
  { employeeId: 'DEMO-EMP-002', name: 'Demo Employee 02', email: 'employee02@example.test', mobile: '+00 000 000 102', role: 'surveyor', active: true, workStatus: 'In progress' },
  { employeeId: 'DEMO-EMP-003', name: 'Demo Employee 03', email: 'employee03@example.test', mobile: '+00 000 000 103', role: 'inventory_manager', active: false, workStatus: 'Not assigned' },
  { employeeId: 'DEMO-EMP-004', name: 'Demo Employee 04', email: 'employee04@example.test', mobile: '+00 000 000 104', role: 'system_admin', active: true, workStatus: 'Not assigned' },
  { employeeId: 'DEMO-EMP-005', name: 'Demo Employee 05', email: 'employee05@example.test', mobile: '+00 000 000 105', role: 'technician', active: true, workStatus: 'Assigned' },
  { employeeId: 'DEMO-EMP-006', name: 'Demo Employee 06', email: 'employee06@example.test', mobile: '+00 000 000 106', role: 'finance', active: true, workStatus: 'Not assigned' },
]
const demoCustomers: CustomerRecord[] = [
  { customerId: 'DEMO-CUS-001', name: 'Demo Customer 01', email: 'customer01@example.test', mobile: '+00 000 000 201', registeredOn: '2026-09-12', active: true },
  { customerId: 'DEMO-CUS-002', name: 'Demo Customer 02', email: 'customer02@example.test', mobile: '+00 000 000 202', registeredOn: '2026-09-25', active: true },
  { customerId: 'DEMO-CUS-003', name: 'Demo Customer 03', email: 'customer03@example.test', mobile: '+00 000 000 203', registeredOn: '2026-10-03', active: false },
  { customerId: 'DEMO-CUS-004', name: 'Demo Customer 04', email: 'customer04@example.test', mobile: '+00 000 000 204', registeredOn: '2026-10-19', active: true },
]

const roleLabels: Record<StaffRole, string> = {
  system_admin: 'System admin', sales: 'Sales', surveyor: 'Surveyor', sales_manager: 'Sales manager',
  inventory_manager: 'Inventory manager', technician: 'Technician', service_manager: 'Service manager', finance: 'Finance', management: 'Management',
}
const roleDescriptions: Record<StaffRole, string> = {
  system_admin: 'Administration of the staff workspace and account setup.',
  sales: 'Customer enquiries, sales conversations and quotation preparation.',
  surveyor: 'Site survey visits and the recording of site assessments.',
  sales_manager: 'Sales team coordination and review of sales work.',
  inventory_manager: 'Product catalogue and inventory operations.',
  technician: 'Installation and field service work.',
  service_manager: 'Coordination of service and after-sales work.',
  finance: 'Payment and refund operations.',
  management: 'Business oversight and reporting.',
}
const roleWorkspaceAreas: Record<StaffRole, string[]> = {
  system_admin: ['Administration overview', 'Staff management', 'Roles', 'Customers', 'Settings'],
  sales: ['Assigned enquiries', 'Customer follow-ups', 'Quotations'],
  surveyor: ['Assigned site surveys', 'Survey schedules', 'Survey checklists'],
  sales_manager: ['Sales team overview', 'Enquiry and quotation review'],
  inventory_manager: ['Stock', 'Reservations', 'Dispatch tasks'],
  technician: ['Assigned installations', 'Work orders', 'Schedules', 'Checklists'],
  service_manager: ['Service tickets', 'Technician assignments', 'Service activity'],
  finance: ['Payments', 'Refunds', 'Financial tasks'],
  management: ['Business overview', 'Reports'],
}

function DemoNotice({ children = 'Illustrative demo data only. No live SolarVerse records are being displayed or changed.' }: { children?: string }) {
  return <div role="note" className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm leading-relaxed text-app-text">{children}</div>
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Users }) {
  return <Card className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-muted">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-app-text">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div><span className="grid size-10 place-items-center rounded-md bg-brand/10 text-brand"><Icon aria-hidden="true" className="size-5" /></span></div></Card>
}

export function AdminOverviewPage() {
  const activeStaff = initialStaff.filter((record) => record.active).length
  const roleCounts = STAFF_ROLES.map((role) => ({ role, count: initialStaff.filter((person) => person.role === role).length }))
  const activities = ['Demo staff profile created', 'Demo role assignment reviewed', 'Demo customer account status changed']
  return <>
    <PageHeader eyebrow="Administration" title="Overview" description="A high-level view of staff and customer administration." />
    <DemoNotice />
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Total staff" value={initialStaff.length} detail="Synthetic preview records" icon={Users} />
      <MetricCard label="Active staff" value={activeStaff} detail="Synthetic preview records" icon={UserRoundCheck} />
      <MetricCard label="Total customers" value={demoCustomers.length} detail="Synthetic preview records" icon={Users} />
      <MetricCard label="Proposed roles" value={STAFF_ROLES.length} detail="Role names from the frontend proposal" icon={UserRoundCog} />
    </div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Card className="p-5"><h2 className="font-semibold text-app-text">Staff role distribution</h2><p className="mt-1 text-sm text-muted">Illustrative count by proposed role</p><div className="mt-5 space-y-4">{roleCounts.map(({ role, count }) => <div key={role} className="grid grid-cols-[minmax(7rem,1fr)_3fr_auto] items-center gap-3 text-sm"><span className="text-muted">{roleLabels[role]}</span><span className="h-2 overflow-hidden rounded-full bg-surface-raised"><span className="block h-full rounded-full bg-brand" style={{ width: `${initialStaff.length ? count / initialStaff.length * 100 : 0}%` }} /></span><span className="font-medium tabular-nums text-app-text">{count}</span></div>)}</div></Card>
      <Card className="p-5"><div className="flex items-center gap-2"><Activity aria-hidden="true" className="size-5 text-brand" /><h2 className="font-semibold text-app-text">Recent administrative activity</h2></div><p className="mt-1 text-sm text-muted">Illustrative activity entries; no activity log is connected.</p><ol className="mt-5 space-y-4">{activities.map((item, index) => <li key={item} className="flex gap-3"><span className="mt-1 size-2 shrink-0 rounded-full bg-brand" /><div><p className="text-sm font-medium text-app-text">{item}</p><p className="mt-0.5 text-xs text-muted">Demo entry · {index + 1} day{index ? 's' : ''} ago</p></div></li>)}</ol></Card>
    </div>
  </>
}

const staffSchema = z.object({
  employeeName: z.string().trim().min(1, 'Enter the employee name'),
  employeeId: z.string().trim().min(1, 'Enter an employee ID'),
  email: z.string().trim().email('Enter a valid email address'),
  mobile: z.string().trim().min(7, 'Enter a valid mobile number'),
  role: z.enum(STAFF_ROLES),
  accountStatus: z.enum(['active', 'inactive']),
})
type StaffFormValues = z.infer<typeof staffSchema>

function StaffEditor({ record, existingEmployeeIds, onCancel, onSubmit }: { record: StaffRecord | null; existingEmployeeIds: string[]; onCancel: () => void; onSubmit: (values: StaffFormValues) => void }) {
  const editorSchema = staffSchema.refine((values) => values.employeeId.toLowerCase() === record?.employeeId.toLowerCase() || !existingEmployeeIds.includes(values.employeeId.toLowerCase()), { path: ['employeeId'], message: 'This employee ID already exists in the demo list' })
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StaffFormValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: record ? { employeeName: record.name, employeeId: record.employeeId, email: record.email, mobile: record.mobile, role: record.role, accountStatus: record.active ? 'active' : 'inactive' } : { employeeName: '', employeeId: '', email: '', mobile: '', role: 'sales', accountStatus: 'active' },
  })
  const submit: SubmitHandler<StaffFormValues> = (values) => onSubmit(values)
  return <form noValidate onSubmit={handleSubmit(submit)} className="grid gap-4">
    <DemoNotice>Staff account preview only. No credentials are created, and nothing is sent or saved. Employee work assignment is a separate workflow and is not part of account creation.</DemoNotice>
    <Input label="Employee name" autoComplete="name" error={errors.employeeName?.message} {...register('employeeName')} />
    <Input label="Employee ID" hint="Use a demo identifier in this preview; production IDs will be issued by FastAPI." error={errors.employeeId?.message} {...register('employeeId')} />
    <Input label="Email / login ID" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
    <Input label="Mobile number" type="tel" autoComplete="tel" error={errors.mobile?.message} {...register('mobile')} />
    <Select label="Assigned role" error={errors.role?.message} {...register('role')}>
      {STAFF_ROLES.map((role) => <option key={role} value={role}>{roleLabels[role]} ({role})</option>)}
    </Select>
    <Select label="Account activation status" error={errors.accountStatus?.message} {...register('accountStatus')}><option value="active">Active</option><option value="inactive">Inactive</option></Select>
    <div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button><Button type="submit" loading={isSubmitting}>{record ? 'Preview update' : 'Preview account creation'}</Button></div>
  </form>
}

export function AdminStaffPage() {
  const [staff, setStaff] = useState(initialStaff)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<StaffRecord | null>(null)
  const [feedback, setFeedback] = useState('')
  const visibleStaff = useMemo(() => staff.filter((person) => {
    const matchesQuery = `${person.employeeId} ${person.name} ${person.email} ${person.mobile}`.toLowerCase().includes(query.toLowerCase())
    const matchesRole = roleFilter === 'all' || person.role === roleFilter
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? person.active : !person.active)
    return matchesQuery && matchesRole && matchesStatus
  }), [query, roleFilter, staff, statusFilter])

  const openCreate = () => { setEditingRecord(null); setEditorOpen(true); setFeedback('') }
  const openEdit = (record: StaffRecord) => { setEditingRecord(record); setEditorOpen(true); setFeedback('') }
  const handleSave = (values: StaffFormValues) => {
    const previewRecord: StaffRecord = { employeeId: values.employeeId, name: values.employeeName, email: values.email, mobile: values.mobile, role: values.role, active: values.accountStatus === 'active', workStatus: editingRecord?.workStatus ?? 'Not assigned' }
    if (editingRecord) setStaff((current) => current.map((person) => person.employeeId === editingRecord.employeeId ? previewRecord : person))
    else setStaff((current) => [...current, previewRecord])
    setEditorOpen(false)
    setFeedback(`Demo ${editingRecord ? 'account update' : 'account creation'} previewed for ${previewRecord.name} (${previewRecord.employeeId}) with role ${roleLabels[previewRecord.role]}. No account or credentials were created on a server. Work status remains ${previewRecord.workStatus.toLowerCase()}.`)
  }
  const toggleActive = (person: StaffRecord) => {
    setStaff((current) => current.map((record) => record.employeeId === person.employeeId ? { ...record, active: !record.active } : record))
    setFeedback('The demo status changed in this browser only. No account status was changed on a server.')
  }

  return <>
    <PageHeader eyebrow="Administration" title="Staff management" description="Review illustrative staff records and preview account form interactions." actions={<Button onClick={openCreate} icon={<Plus aria-hidden="true" className="size-4" />}>Create staff account</Button>} />
    <DemoNotice>All employee names, demo IDs, contact details and work statuses below are illustrative. This is not a live SolarVerse employee directory.</DemoNotice>
    {feedback && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-sm text-app-text">{feedback}</div>}
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto_auto]">
        <Input label="Search staff" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Employee ID, name, email or mobile" />
        <Select label="Filter by role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option>{STAFF_ROLES.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</Select>
        <Select label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select>
      </div>
      <Table>
        <TableHead><tr><TableHeader>Employee ID</TableHeader><TableHeader>Employee / login ID</TableHeader><TableHeader>Mobile</TableHeader><TableHeader>Assigned role</TableHeader><TableHeader>Account status</TableHeader><TableHeader>Assigned work status</TableHeader><TableHeader><span className="sr-only">Actions</span></TableHeader></tr></TableHead>
        <TableBody>{visibleStaff.map((person) => <TableRow key={person.employeeId}><TableCell className="whitespace-nowrap font-semibold">{person.employeeId}</TableCell><TableCell><div className="font-semibold">{person.name}</div><div className="mt-1 text-xs text-muted">{person.email}</div></TableCell><TableCell className="whitespace-nowrap">{person.mobile}</TableCell><TableCell><Badge tone="brand">{person.role}</Badge></TableCell><TableCell><Badge tone={person.active ? 'success' : 'neutral'}>{person.active ? 'Active' : 'Inactive'}</Badge></TableCell><TableCell><Badge tone={person.workStatus === 'Not assigned' ? 'neutral' : 'info'}>{person.workStatus}</Badge></TableCell><TableCell><div className="flex flex-wrap gap-2"><Button variant="tertiary" className="min-h-8 px-2 py-1 text-xs" onClick={() => openEdit(person)}>Edit</Button><Button variant="secondary" className="min-h-8 px-2 py-1 text-xs" onClick={() => toggleActive(person)}>{person.active ? 'Deactivate' : 'Activate'}</Button></div></TableCell></TableRow>)}</TableBody>
      </Table>
      {visibleStaff.length === 0 && <p className="p-8 text-center text-sm text-muted">No demo staff records match these filters.</p>}
    </Card>
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editingRecord ? 'Edit staff account preview' : 'Create staff account preview'} description="This frontend preview does not create credentials or call an account service."><StaffEditor key={editingRecord?.employeeId ?? 'new'} record={editingRecord} existingEmployeeIds={staff.map((person) => person.employeeId.toLowerCase())} onCancel={() => setEditorOpen(false)} onSubmit={handleSave} /></Modal>
  </>
}

export function AdminRolesPage() {
  return <>
    <PageHeader eyebrow="Administration" title="Proposed staff roles" description="Role names and high-level intended work areas for the SolarVerse staff experience." />
    <DemoNotice>These are proposed role descriptions for frontend orientation only. No permission matrix is defined here, and this UI does not enforce backend authorization.</DemoNotice>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{STAFF_ROLES.map((role) => <Card key={role} className="p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-semibold text-app-text">{roleLabels[role]}</h2><Badge tone="brand">Proposed</Badge></div><p className="mt-2 text-xs font-medium text-muted">{role}</p><p className="mt-4 text-sm leading-relaxed text-muted">{roleDescriptions[role]}</p><h3 className="mt-5 text-xs font-bold uppercase tracking-wide text-muted">Intended workspace areas</h3><ul className="mt-2 space-y-1.5">{roleWorkspaceAreas[role].map((area) => <li key={area} className="flex gap-2 text-sm text-app-text"><span aria-hidden="true" className="text-brand">•</span>{area}</li>)}</ul></Card>)}</div>
  </>
}

export function AdminCustomersPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const customers = demoCustomers.filter((customer) => `${customer.customerId} ${customer.name} ${customer.email} ${customer.mobile}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || (status === 'active' ? customer.active : !customer.active)))
  return <>
    <PageHeader eyebrow="Administration" title="Customers" description="Illustrative directory of customer accounts created through the customer registration experience." />
    <DemoNotice>Customer records below are synthetic examples, not registered SolarVerse customers. Customers create their own accounts at /register; the staff creation form is only for employee account previews. Admin viewing or management must be authorized by the backend.</DemoNotice>
    <Card className="overflow-hidden">
      <div className="grid gap-3 border-b border-border p-4 md:grid-cols-[minmax(14rem,1fr)_auto]"><Input label="Search customers" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Customer ID, name, email or mobile" /><Select label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></Select></div>
      <Table><TableHead><tr><TableHeader>Customer ID</TableHeader><TableHeader>Customer</TableHeader><TableHeader>Mobile number</TableHeader><TableHeader>Registration date</TableHeader><TableHeader>Account status</TableHeader></tr></TableHead><TableBody>{customers.map((customer) => <TableRow key={customer.customerId}><TableCell className="whitespace-nowrap font-semibold">{customer.customerId}</TableCell><TableCell><div className="font-semibold">{customer.name}</div><div className="mt-1 text-xs text-muted">{customer.email}</div></TableCell><TableCell className="whitespace-nowrap">{customer.mobile}</TableCell><TableCell className="whitespace-nowrap">{customer.registeredOn}</TableCell><TableCell><Badge tone={customer.active ? 'success' : 'neutral'}>{customer.active ? 'Active' : 'Inactive'}</Badge></TableCell></TableRow>)}</TableBody></Table>
      {customers.length === 0 && <p className="p-8 text-center text-sm text-muted">No demo customers match these filters.</p>}
    </Card>
  </>
}

export function AdminSettingsPage() {
  return <>
    <PageHeader eyebrow="Administration" title="System settings" description="A visual preview of possible workspace settings." />
    <DemoNotice>Settings are presentation-only. These controls are disabled and do not change SolarVerse configuration.</DemoNotice>
    <div className="grid gap-5 xl:grid-cols-2">
      <Card className="space-y-4 p-5"><div><h2 className="font-semibold text-app-text">Organization profile</h2><p className="mt-1 text-sm text-muted">Example fields for a future settings workflow.</p></div><Input label="Organization name" defaultValue="SolarVerse" disabled /><Input label="Support email" defaultValue="Not configured" disabled /><Button disabled variant="secondary">Save organization details</Button></Card>
      <Card className="space-y-4 p-5"><div><h2 className="font-semibold text-app-text">Workspace preferences</h2><p className="mt-1 text-sm text-muted">No live preference service is connected.</p></div><label className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" disabled className="size-4 accent-brand" />Enable administrative activity summaries</label><label className="flex items-center gap-3 text-sm text-muted"><input type="checkbox" disabled className="size-4 accent-brand" />Require additional sign-in verification</label><Button disabled variant="secondary">Apply preferences</Button></Card>
    </div>
  </>
}
