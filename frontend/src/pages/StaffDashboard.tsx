import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, ClipboardList, Compass, type LucideIcon } from 'lucide-react'
import { Badge, Card, EmptyState, ErrorState, LoadingState, PageHeader } from '../components/ui'
import { useStaffRole } from '../auth/staffRoleContext'
import { getDashboardMetrics, getSurveys } from '../lib/api'
import { apiErrorMessage } from '../lib/apiClient'

const dashboardModules = [
  ['customers', 'Customers'], ['sites', 'Sites'], ['enquiries', 'Enquiries'], ['surveys', 'Surveys'],
  ['quotations', 'Quotations'], ['orders', 'Sales orders'], ['inventory_locations', 'Inventory locations'],
  ['stock_movements', 'Stock movements'], ['dispatches', 'Dispatches'], ['equipment_units', 'Equipment units'],
  ['installations', 'Installations'], ['warranties', 'Warranties'], ['service_tickets', 'Service tickets'], ['payments', 'Payment records'],
] as const

function surveyorDashboard() {
  return <SurveyorSummary />
}

function SurveyorSummary() {
  const query = useQuery({ queryKey: ['surveys'], queryFn: () => getSurveys() })
  return <>
    <PageHeader eyebrow="Staff workspace" title="Survey overview" description="Survey totals from the canonical survey API." actions={<Link to="/staff/surveys" className="inline-flex min-h-10 items-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white dark:text-gray-950">Open surveys <Compass aria-hidden="true" className="size-4" /></Link>} />
    {query.isLoading ? <LoadingState /> : query.isError ? <ErrorState description={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <div className="grid gap-4 sm:grid-cols-3">{['draft', 'approved', 'rejected'].map((status) => <Card key={status} className="p-5"><p className="text-sm capitalize text-muted">{status} surveys</p><p className="mt-2 text-3xl font-bold">{query.data?.filter((survey) => survey.status === status).length ?? 0}</p></Card>)}</div>}
    <div className="mt-5"><EmptyState title="Employee schedule is not available" description="The API has no surveyor assignment or employee-specific schedule endpoint. This page shows only the surveys available to your authorized role." /></div>
  </>
}

export function StaffDashboard() {
  const { role, roleLabel, shortcuts } = useStaffRole()
  if (role === 'surveyor') return surveyorDashboard()
  return <OperationsSummary roleLabel={roleLabel} shortcuts={shortcuts} />
}

function OperationsSummary({ roleLabel, shortcuts }: { roleLabel: string; shortcuts: Array<{ to: string; label: string; icon: LucideIcon }> }) {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardMetrics })
  return <>
    <PageHeader eyebrow="Staff workspace" title="Operations overview" description="Live canonical counts returned by the authenticated backend." />
    {query.isLoading ? <LoadingState label="Loading operations data…" /> : query.isError ? <ErrorState description={apiErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dashboardModules.map(([key, label]) => <Card key={key} className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{query.data?.[key]}</p></Card>)}</div>
      <Card className="mt-4 p-5"><p className="text-sm text-muted">Recorded payments sum (not settlement-confirmed revenue)</p><p className="mt-2 text-2xl font-bold">{query.data?.payment_amount_recorded}</p></Card>
    </>}
    <section className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><Card className="p-5"><div className="flex items-center gap-2"><ClipboardList aria-hidden="true" className="size-5 text-brand" /><h2 className="font-semibold">Assigned work</h2></div><div className="mt-4"><EmptyState title="Employee-specific queue is unavailable" description="Current canonical assignment records are not linked to app_user. No employee-level work is inferred from company-wide totals." /></div></Card><Card className="p-5"><div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">Shortcuts for {roleLabel}</h2><Badge tone="info">API backed</Badge></div><ul className="space-y-2">{shortcuts.map(({ to, label, icon: Icon }) => <li key={to}><Link to={to} className="flex min-h-11 items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-sm hover:bg-surface-raised"><span className="flex items-center gap-2"><Icon aria-hidden="true" className="size-4 text-brand" />{label}</span><ArrowRight aria-hidden="true" className="size-4" /></Link></li>)}</ul></Card></section>
  </>
}
