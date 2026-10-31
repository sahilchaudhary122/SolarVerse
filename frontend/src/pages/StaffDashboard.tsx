import { Link } from 'react-router-dom'
import { ArrowRight, ClipboardList, Compass, FileText, Plus, Users } from 'lucide-react'
import { Badge, Card, EmptyState, PageHeader } from '../components/ui'
import type { StaffRole } from '../auth/authService'
import { useStaffRole } from '../layouts/PortalLayout'

type AssignedWorkItem = { id: string; title: string; category: string; scheduleLabel?: string }

const roleWorkAreas: Record<StaffRole, Array<{ label: string; icon: typeof ClipboardList }>> = {
  system_admin: [{ label: 'Staff administration', icon: Users }, { label: 'Role overview', icon: ClipboardList }],
  sales: [{ label: 'Assigned enquiries', icon: ClipboardList }, { label: 'Customer follow-ups', icon: Users }, { label: 'Quotations', icon: FileText }],
  surveyor: [{ label: 'Assigned site surveys', icon: Compass }, { label: 'Survey schedule', icon: ClipboardList }, { label: 'Checklists', icon: FileText }],
  sales_manager: [{ label: 'Sales team', icon: Users }, { label: 'Enquiry and quotation review', icon: FileText }],
  inventory_manager: [{ label: 'Stock and reservations', icon: ClipboardList }, { label: 'Dispatch tasks', icon: FileText }],
  technician: [{ label: 'Assigned installations', icon: Compass }, { label: 'Work orders and schedules', icon: ClipboardList }, { label: 'Checklists', icon: FileText }],
  service_manager: [{ label: 'Service tickets', icon: ClipboardList }, { label: 'Technician assignments', icon: Users }],
  finance: [{ label: 'Payments', icon: FileText }, { label: 'Refunds and financial tasks', icon: ClipboardList }],
  management: [{ label: 'Business overview', icon: Users }, { label: 'Reports', icon: FileText }],
}

// This view model is intentionally empty until the backend can scope work to the authenticated employee.
const assignedWorkPreview: AssignedWorkItem[] = []

export function StaffDashboard() {
  const { role, roleLabel, shortcuts } = useStaffRole()
  const workAreas = roleWorkAreas[role]

  return <div>
    <PageHeader
      eyebrow="Staff workspace"
      title="Operations overview"
      description="Your role-aware workspace for the work assigned to your account. Assigned work will appear after employee identity and assignment integration is confirmed."
      actions={<Link to="/staff/enquiries" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong focus-visible:outline-offset-2 dark:text-gray-950"><Plus aria-hidden="true" className="size-4" />Open enquiries</Link>}
    />

    <div role="note" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-app-text">
      <span><strong>Demo workspace.</strong> No employee tasks are loaded. This dashboard is designed to display only work assigned to the authenticated employee, not the company-wide task queue.</span>
      <Badge tone="warning">Assignment integration pending</Badge>
    </div>

    <section className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Your assigned work</h2><p className="mt-1 text-sm text-muted">Work queue for the signed-in employee</p></div><Badge tone="info">{roleLabel}</Badge></div>
        {assignedWorkPreview.length > 0 ? <ul className="divide-y divide-border">{assignedWorkPreview.map((item) => <li key={item.id} className="py-4"><p className="font-medium text-app-text">{item.title}</p><p className="mt-1 text-sm text-muted">{item.category}{item.scheduleLabel ? ` · ${item.scheduleLabel}` : ''}</p></li>)}</ul> : <EmptyState title="No assigned work loaded" description="The future data adapter must return only records assigned to the authenticated employee. Employee identity and assignment ownership are not defined in the current frontend auth contract." />}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Role workspace</h2><p className="mt-1 text-sm text-muted">Intended work areas for {roleLabel}</p></div><Badge tone="info">Proposed</Badge></div>
        <ul className="mb-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{workAreas.map(({ label, icon: Icon }) => <li key={label} className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-app-text"><Icon aria-hidden="true" className="size-4 shrink-0 text-brand" />{label}</li>)}</ul>
        <h3 className="mb-2 text-sm font-semibold">Module shortcuts</h3>
        {shortcuts.length > 0 ? <ul className="grid gap-3 sm:grid-cols-2">{shortcuts.map(({ to, label, icon: Icon }) => <li key={to}><Link to={to} className="flex min-h-14 items-center justify-between gap-3 rounded-md border border-border bg-surface px-4 py-3 text-sm font-medium text-app-text transition-colors hover:border-brand/40 hover:bg-surface-raised focus-visible:outline-offset-2"><span className="flex items-center gap-3"><Icon aria-hidden="true" className="size-4 text-brand" />{label}</span><ArrowRight aria-hidden="true" className="size-4 text-muted" /></Link></li>)}</ul> : <EmptyState title="No shortcuts available" description="Choose a role preview to show suggested workspace links." />}
      </Card>

    </section>

    <p className="mt-6 text-xs text-muted">Role-specific areas are presentation guidance. Backend authorization and employee-scoped assignment queries must be implemented and verified server-side.</p>
  </div>
}
