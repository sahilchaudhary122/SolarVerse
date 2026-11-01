import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui'
import { apiErrorMessage } from '../lib/apiClient'
import { createCustomer, createSite, getCustomers, getDashboardMetrics, getEnquiries, getEnquiryHistory, getSites, getSurveys, reviewSurvey, updateEnquiryStatus, createSurvey, type Enquiry, type EnquiryHistory, type Survey } from '../lib/api'
import type { EnquiryStatus } from '../types'

const enquiryStatuses: EnquiryStatus[] = ['new', 'contacted', 'survey_pending', 'qualified', 'quoted', 'converted', 'lost', 'cancelled']

function PageState({ loading, error, retry }: { loading: boolean; error: unknown; retry: () => void }) {
  if (loading) return <LoadingState label="Loading records…" />
  if (error) return <ErrorState description={apiErrorMessage(error)} onRetry={retry} />
  return null
}

export function ApiDashboardPage() {
  const query = useQuery({ queryKey: ['dashboard'], queryFn: getDashboardMetrics })
  const labels: Array<[keyof NonNullable<typeof query.data>, string]> = [
    ['customers', 'Customers'], ['sites', 'Sites'], ['enquiries', 'Enquiries'], ['surveys', 'Surveys'],
    ['quotations', 'Quotations'], ['orders', 'Sales orders'], ['inventory_locations', 'Inventory locations'],
    ['dispatches', 'Dispatches'], ['installations', 'Installations'], ['warranties', 'Warranties'],
    ['service_tickets', 'Service tickets'], ['payments', 'Payment records'],
  ]
  return <>
    <PageHeader eyebrow="Live workspace" title="Operations overview" description="Counts returned by the authenticated SolarVerse API." />
    <PageState loading={query.isLoading} error={query.error} retry={() => void query.refetch()} />
    {query.data && <><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{labels.map(([key, label]) => <Card key={key} className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{query.data?.[key]}</p></Card>)}</div><Card className="mt-4 p-5"><p className="text-sm text-muted">Recorded payment amount (ledger records; not settlement confirmation)</p><p className="mt-2 text-2xl font-bold">{query.data.payment_amount_recorded}</p></Card></>}
  </>
}

export function CustomerManagementPage() {
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const query = useQuery({ queryKey: ['customers', search], queryFn: () => getCustomers(search || undefined) })
  const create = useMutation({ mutationFn: createCustomer, onSuccess: () => { void client.invalidateQueries({ queryKey: ['customers'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    create.mutate({ name: String(form.get('name')).trim(), phone_e164: String(form.get('phone_e164')).trim(), email: String(form.get('email')).trim() || null })
    if (event.currentTarget) event.currentTarget.reset()
  }
  return <>
    <PageHeader eyebrow="Customer work" title="Customers" description="Search and add canonical customer records. Email is optional and is not unique in the database." />
    {create.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error)} /></div>}
    <Card className="mb-5 p-5"><h2 className="mb-4 font-semibold">Add customer</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Input label="Name" name="name" required minLength={1} maxLength={160} /><Input label="Phone (E.164)" name="phone_e164" type="tel" required pattern="\+[1-9][0-9]{6,14}" placeholder="+919876543210" /><Input label="Email (optional)" name="email" type="email" maxLength={254} /><div className="flex items-end"><Button type="submit" loading={create.isPending}>Create customer</Button></div></form></Card>
    <Input label="Search customers" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mb-4 max-w-md" />
    <PageState loading={query.isLoading} error={query.error} retry={() => void query.refetch()} />
    {query.data?.length === 0 && <EmptyState title="No customers found" description="Try a different search, or add the first customer above." />}
    {!!query.data?.length && <Card><Table><TableHead><tr><TableHeader>Name</TableHeader><TableHeader>Phone</TableHeader><TableHeader>Email</TableHeader><TableHeader>Created</TableHeader></tr></TableHead><TableBody>{query.data.map((row) => <TableRow key={row.id}><TableCell>{row.name}</TableCell><TableCell>{row.phone_e164}</TableCell><TableCell>{row.email ?? '—'}</TableCell><TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

export function SiteManagementPage() {
  const client = useQueryClient()
  const customers = useQuery({ queryKey: ['customers', 'site-picker'], queryFn: () => getCustomers() })
  const sites = useQuery({ queryKey: ['sites'], queryFn: () => getSites() })
  const create = useMutation({ mutationFn: createSite, onSuccess: () => { void client.invalidateQueries({ queryKey: ['sites'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget)
    create.mutate({ customer_id: String(form.get('customer_id')), label: String(form.get('label')) || null, address_line: String(form.get('address_line')).trim(), city: String(form.get('city')) || null, state: String(form.get('state')) || null, postal_code: String(form.get('postal_code')) || null, country_code: String(form.get('country_code') || 'IN') })
  }
  return <>
    <PageHeader eyebrow="Customer work" title="Sites" description="Sites belong to a customer and are selected by enquiries and surveys." />
    {create.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error)} /></div>}
    <Card className="mb-5 p-5"><h2 className="mb-4 font-semibold">Add site</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Select label="Customer" name="customer_id" required defaultValue=""><option value="" disabled>Select a customer</option>{customers.data?.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.phone_e164}</option>)}</Select><Input label="Label (optional)" name="label" maxLength={120} /><Input label="Address" name="address_line" required /><Input label="City" name="city" /><Input label="State" name="state" /><Input label="Postal code" name="postal_code" /><Input label="Country code" name="country_code" defaultValue="IN" minLength={2} maxLength={2} /><div className="flex items-end"><Button type="submit" loading={create.isPending} disabled={!customers.data?.length}>Create site</Button></div></form></Card>
    <PageState loading={sites.isLoading || customers.isLoading} error={sites.error || customers.error} retry={() => void sites.refetch()} />
    {sites.data?.length === 0 && <EmptyState title="No sites found" description="Create a site after adding its customer record." />}
    {!!sites.data?.length && <Card><Table><TableHead><tr><TableHeader>Label</TableHeader><TableHeader>Address</TableHeader><TableHeader>City / state</TableHeader><TableHeader>Customer ID</TableHeader></tr></TableHead><TableBody>{sites.data.map((site) => <TableRow key={site.id}><TableCell>{site.label ?? '—'}</TableCell><TableCell>{site.address_line}</TableCell><TableCell>{[site.city, site.state].filter(Boolean).join(', ') || '—'}</TableCell><TableCell className="font-mono text-xs">{site.customer_id}</TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}

export function EnquiryManagementPage() {
  const client = useQueryClient()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Enquiry | null>(null)
  const enquiries = useQuery({ queryKey: ['enquiries', search], queryFn: () => getEnquiries({ search: search || undefined }) })
  const history = useQuery({ queryKey: ['enquiry-history', selected?.id], queryFn: () => getEnquiryHistory(selected!.id), enabled: Boolean(selected) })
  const status = useMutation({ mutationFn: ({ id, value }: { id: string; value: EnquiryStatus }) => updateEnquiryStatus(id, value), onSuccess: () => { void client.invalidateQueries({ queryKey: ['enquiries'] }) } })
  return <>
    <PageHeader eyebrow="Customer work" title="Enquiries" description="Live enquiries with the canonical status history and permitted workflow transitions." />
    {status.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(status.error)} /></div>}
    <Input label="Search enquiries" type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mb-4 max-w-md" />
    <PageState loading={enquiries.isLoading} error={enquiries.error} retry={() => void enquiries.refetch()} />
    {enquiries.data?.length === 0 && <EmptyState title="No enquiries yet" description="Submitted public enquiries will appear here." />}
    {!!enquiries.data?.length && <Card><Table><TableHead><tr><TableHeader>Customer</TableHeader><TableHeader>Site</TableHeader><TableHeader>Capacity</TableHeader><TableHeader>Status</TableHeader><TableHeader>Created</TableHeader><TableHeader>History</TableHeader></tr></TableHead><TableBody>{enquiries.data.map((row) => <TableRow key={row.id}><TableCell>{row.customer_name}<span className="block text-xs text-muted">{row.phone}</span></TableCell><TableCell>{[row.address, row.city, row.state].filter(Boolean).join(', ')}</TableCell><TableCell>{row.capacity_kw ? `${row.capacity_kw} kW` : '—'}</TableCell><TableCell><Select label={`Status for ${row.customer_name}`} aria-label={`Status for ${row.customer_name}`} value={row.status} disabled={status.isPending} onChange={(event) => status.mutate({ id: row.id, value: event.target.value as EnquiryStatus })}>{enquiryStatuses.map((value) => <option key={value} value={value}>{value.replaceAll('_', ' ')}</option>)}</Select></TableCell><TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</TableCell><TableCell><Button variant="secondary" onClick={() => setSelected(row)}>View</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
    {selected && <Card className="mt-5 p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Status history · {selected.customer_name}</h2><Button variant="tertiary" onClick={() => setSelected(null)}>Close</Button></div><PageState loading={history.isLoading} error={history.error} retry={() => void history.refetch()} />{history.data?.length === 0 && <p className="mt-3 text-sm text-muted">No status changes recorded.</p>}<ol className="mt-3 space-y-2">{history.data?.map((entry: EnquiryHistory) => <li key={entry.id} className="rounded-md border border-border p-3 text-sm"><strong>{entry.from_status ?? 'Created'} → {entry.to_status}</strong><span className="ml-2 text-muted">{new Date(entry.changed_at).toLocaleString()}</span>{entry.reason && <p className="mt-1 text-muted">{entry.reason}</p>}</li>)}</ol></Card>}
  </>
}

export function SurveyManagementPage() {
  const client = useQueryClient()
  const enquiries = useQuery({ queryKey: ['enquiries', 'survey-picker'], queryFn: () => getEnquiries() })
  const surveys = useQuery({ queryKey: ['surveys'], queryFn: () => getSurveys() })
  const [message, setMessage] = useState('')
  const create = useMutation({ mutationFn: createSurvey, onSuccess: () => { setMessage('Survey saved.'); void client.invalidateQueries({ queryKey: ['surveys'] }) } })
  const review = useMutation({ mutationFn: ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => reviewSurvey(id, { status, rejection_reason: status === 'rejected' ? 'Rejected by reviewer' : undefined }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['surveys'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setMessage(''); const form = new FormData(event.currentTarget); const enquiryId = String(form.get('enquiry_id')); const enquiry = enquiries.data?.find((item) => item.id === enquiryId)
    if (!enquiry) return
    const optionalNumber = (key: string) => String(form.get(key) || '') ? Number(form.get(key)) : undefined
    create.mutate({ enquiry_id: enquiry.id, site_id: enquiry.site_id, roof_area_sqm: optionalNumber('roof_area_sqm'), roof_direction: String(form.get('roof_direction')) || undefined, roof_tilt_degrees: optionalNumber('roof_tilt_degrees'), shadow_free_area_sqm: optionalNumber('shadow_free_area_sqm'), cable_distance_m: optionalNumber('cable_distance_m'), grid_suitability: form.get('grid_suitability') === 'true' ? true : form.get('grid_suitability') === 'false' ? false : undefined })
  }
  return <>
    <PageHeader eyebrow="Customer work" title="Site surveys" description="Create surveys from an existing enquiry and its site. Measurements use square metres as defined by the API." />
    {message && <p role="status" className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm">{message}</p>}
    {(create.isError || review.isError) && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error || review.error)} /></div>}
    <Card className="mb-5 p-5"><h2 className="mb-4 font-semibold">Create survey</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Select label="Enquiry and site" name="enquiry_id" required defaultValue=""><option value="" disabled>Select an enquiry</option>{enquiries.data?.map((row) => <option key={row.id} value={row.id}>{row.customer_name} · {row.address}</option>)}</Select><Input label="Roof area (m²)" name="roof_area_sqm" type="number" min="0" step="0.01" /><Input label="Roof direction" name="roof_direction" maxLength={30} /><Input label="Tilt (degrees)" name="roof_tilt_degrees" type="number" min="0" max="90" step="0.01" /><Input label="Shadow-free area (m²)" name="shadow_free_area_sqm" type="number" min="0" step="0.01" /><Input label="Cable distance (m)" name="cable_distance_m" type="number" min="0" step="0.01" /><Select label="Grid suitability" name="grid_suitability" defaultValue=""><option value="">Not assessed</option><option value="true">Suitable</option><option value="false">Not suitable</option></Select><div className="flex items-end"><Button type="submit" loading={create.isPending} disabled={!enquiries.data?.length}>Create survey</Button></div></form><p className="mt-3 text-xs text-muted">Photo upload is unavailable: the backend stores file metadata only and has no upload service.</p></Card>
    <PageState loading={surveys.isLoading || enquiries.isLoading} error={surveys.error || enquiries.error} retry={() => void surveys.refetch()} />
    {surveys.data?.length === 0 && <EmptyState title="No surveys yet" description="Create a survey from an existing enquiry." />}
    {!!surveys.data?.length && <Card><Table><TableHead><tr><TableHeader>Survey</TableHeader><TableHeader>Enquiry</TableHeader><TableHeader>Roof area</TableHeader><TableHeader>Status</TableHeader><TableHeader>Review</TableHeader></tr></TableHead><TableBody>{surveys.data.map((row: Survey) => <TableRow key={row.id}><TableCell className="font-mono text-xs">{row.id.slice(0, 8)}</TableCell><TableCell className="font-mono text-xs">{row.enquiry_id.slice(0, 8)}</TableCell><TableCell>{row.roof_area_sqm ? `${row.roof_area_sqm} m²` : '—'}</TableCell><TableCell><Badge tone={row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'neutral'}>{row.status}{row.is_current ? ' · current' : ''}</Badge></TableCell><TableCell className="flex gap-2">{row.status !== 'approved' && <Button className="px-2" onClick={() => review.mutate({ id: row.id, status: 'approved' })}>Approve</Button>}<Button className="px-2" variant="secondary" disabled={row.status === 'rejected'} onClick={() => review.mutate({ id: row.id, status: 'rejected' })}>Reject</Button></TableCell></TableRow>)}</TableBody></Table></Card>}
  </>
}
