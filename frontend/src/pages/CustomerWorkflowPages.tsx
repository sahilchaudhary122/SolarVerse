import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, EmptyState, ErrorState, Input, LoadingState, PageHeader, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea } from '../components/ui'
import { apiErrorMessage } from '../lib/apiClient'
import { addTicketActivity, createEnquiry, createSite, createTicket, getCustomerPortalMetrics, getEnquiries, getMyCustomer, getSites, getTicket, getTickets, updateCustomer, type Enquiry } from '../lib/api'

export function CustomerOverviewPage() {
  const customer = useQuery({ queryKey: ['my-customer'], queryFn: getMyCustomer })
  const sites = useQuery({ queryKey: ['my-sites'], queryFn: () => getSites() })
  const enquiries = useQuery({ queryKey: ['my-enquiries'], queryFn: () => getEnquiries() })
  const metrics = useQuery({ queryKey: ['customer-portal', 'dashboard'], queryFn: getCustomerPortalMetrics })
  return <>
    <PageHeader eyebrow="Customer portal" title="Your SolarVerse account" description="Live account and project counts returned for your signed-in customer identity." />
    {customer.isLoading || sites.isLoading || enquiries.isLoading || metrics.isLoading ? <LoadingState label="Loading your account…" /> : customer.isError || sites.isError || enquiries.isError || metrics.isError ? <ErrorState description={apiErrorMessage(customer.error || sites.error || enquiries.error || metrics.error)} onRetry={() => { void customer.refetch(); void sites.refetch(); void enquiries.refetch(); void metrics.refetch() }} /> : <>
      <Card className="p-5"><h2 className="text-lg font-semibold">Welcome, {customer.data?.name}</h2><p className="mt-1 text-sm text-muted">{customer.data?.email || 'No email on the customer record'} · {customer.data?.phone_e164}</p></Card>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[['Sites', sites.data?.length ?? 0], ['Active enquiries', metrics.data?.active_enquiries ?? 0], ['Quotations', metrics.data?.quotations ?? 0], ['Sales orders', metrics.data?.orders ?? 0], ['Installations', metrics.data?.installations ?? 0], ['Equipment units', metrics.data?.equipment ?? 0], ['Warranties', metrics.data?.warranties ?? 0], ['Service tickets', metrics.data?.service_tickets ?? 0]].map(([label, count]) => <Card key={label} className="p-5"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold">{count}</p></Card>)}</div>
      <Card className="mt-5 p-5"><h2 className="mb-3 font-semibold">Recent enquiries</h2>{enquiries.data?.length ? <Table><TableHead><tr><TableHeader>Site</TableHeader><TableHeader>Capacity</TableHeader><TableHeader>Status</TableHeader><TableHeader>Created</TableHeader></tr></TableHead><TableBody>{enquiries.data.slice(0, 5).map((row: Enquiry) => <TableRow key={row.id}><TableCell>{row.address}{row.city ? ` · ${row.city}` : ''}</TableCell><TableCell>{row.capacity_kw ? `${row.capacity_kw} kW` : '—'}</TableCell><TableCell><Badge>{row.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}</TableCell></TableRow>)}</TableBody></Table> : <EmptyState title="No enquiries yet" description="Start an enquiry when you are ready to discuss a solar project." />}</Card>
    </>}
  </>
}

export function CustomerProfilePage() {
  const client = useQueryClient()
  const profile = useQuery({ queryKey: ['my-customer'], queryFn: getMyCustomer })
  const update = useMutation({ mutationFn: ({ id, data }: { id: string; data: { name?: string; phone_e164?: string } }) => updateCustomer(id, data), onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-customer'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!profile.data) return; const form = new FormData(event.currentTarget); update.mutate({ id: profile.data.id, data: { name: String(form.get('name')).trim(), phone_e164: String(form.get('phone_e164')).trim() } }) }
  return <>
    <PageHeader eyebrow="Customer portal" title="Profile" description="Update contact name and phone. Account email cannot be changed through the current API because it is the temporary account ownership key." />
    {profile.isLoading ? <LoadingState /> : profile.isError ? <ErrorState description={apiErrorMessage(profile.error)} onRetry={() => void profile.refetch()} /> : <Card className="max-w-2xl p-5"><form onSubmit={submit} className="grid gap-4"><Input label="Name" name="name" defaultValue={profile.data?.name} required maxLength={160} /><Input label="Phone (E.164)" name="phone_e164" type="tel" defaultValue={profile.data?.phone_e164} required pattern="\+[1-9][0-9]{6,14}" /><Input label="Email" value={profile.data?.email ?? ''} disabled />{update.isError && <ErrorState description={apiErrorMessage(update.error)} />}{update.isSuccess && <p role="status" className="text-sm text-success">Profile updated.</p>}<Button type="submit" loading={update.isPending}>Save profile</Button></form></Card>}
  </>
}

export function CustomerSitesPage() {
  const client = useQueryClient()
  const customer = useQuery({ queryKey: ['my-customer'], queryFn: getMyCustomer })
  const sites = useQuery({ queryKey: ['my-sites'], queryFn: () => getSites() })
  const create = useMutation({ mutationFn: createSite, onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-sites'] }); void client.invalidateQueries({ queryKey: ['sites'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); create.mutate({ label: String(form.get('label')) || null, address_line: String(form.get('address_line')).trim(), city: String(form.get('city')) || null, state: String(form.get('state')) || null, postal_code: String(form.get('postal_code')) || null, country_code: String(form.get('country_code') || 'IN') }) }
  return <>
    <PageHeader eyebrow="Customer portal" title="My sites" description="Sites saved to your customer record. New sites are associated by the backend to your signed-in email." />
    {create.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error)} /></div>}
    <Card className="mb-5 max-w-4xl p-5"><h2 className="mb-3 font-semibold">Add a site</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Input label="Label" name="label" maxLength={120} /><Input label="Address" name="address_line" required /><Input label="City" name="city" /><Input label="State" name="state" /><Input label="Postal code" name="postal_code" /><Input label="Country code" name="country_code" defaultValue="IN" minLength={2} maxLength={2} /><Button type="submit" loading={create.isPending} disabled={!customer.data}>Save site</Button></form></Card>
    {sites.isLoading ? <LoadingState /> : sites.isError ? <ErrorState description={apiErrorMessage(sites.error)} onRetry={() => void sites.refetch()} /> : sites.data?.length ? <Card><Table><TableHead><tr><TableHeader>Site</TableHeader><TableHeader>Address</TableHeader><TableHeader>City</TableHeader><TableHeader>Postal code</TableHeader></tr></TableHead><TableBody>{sites.data.map((x) => <TableRow key={x.id}><TableCell>{x.label || 'Site'}</TableCell><TableCell>{x.address_line}</TableCell><TableCell>{[x.city, x.state].filter(Boolean).join(', ') || '—'}</TableCell><TableCell>{x.postal_code || '—'}</TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyState title="No sites yet" description="Add your first solar site above." />}
  </>
}

export function CustomerEnquiriesPage() {
  const client = useQueryClient()
  const customer = useQuery({ queryKey: ['my-customer'], queryFn: getMyCustomer })
  const sites = useQuery({ queryKey: ['my-sites'], queryFn: () => getSites() })
  const enquiries = useQuery({ queryKey: ['my-enquiries'], queryFn: () => getEnquiries() })
  const [message, setMessage] = useState('')
  const create = useMutation({ mutationFn: createEnquiry, onSuccess: (result) => { setMessage(result.message); void client.invalidateQueries({ queryKey: ['my-enquiries'] }) } })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(''); const form = new FormData(event.currentTarget); const siteId = String(form.get('site_id')); const site = sites.data?.find((item) => item.id === siteId); if (!site || !customer.data) return
    const capacity = String(form.get('capacity_kw'))
    create.mutate({ customer_name: customer.data.name, phone: customer.data.phone_e164, email: customer.data.email || undefined, address: site.address_line, city: site.city, state: site.state, postal_code: site.postal_code, capacity_kw: capacity ? Number(capacity) : undefined, system_type: String(form.get('system_type')) as 'on-grid' | 'off-grid', requirements: String(form.get('requirements')) || undefined })
  }
  return <>
    <PageHeader eyebrow="Customer portal" title="My enquiries" description="Create an enquiry for one of your saved sites and review its current status." />
    {message && <p role="status" className="mb-4 rounded-md border border-success/30 bg-success/10 p-3 text-sm">{message}</p>}
    {create.isError && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error)} /></div>}
    <Card className="mb-5 max-w-4xl p-5"><h2 className="mb-3 font-semibold">Start a site enquiry</h2><form onSubmit={submit} className="grid gap-3 sm:grid-cols-2"><Select label="Your site" name="site_id" required defaultValue=""><option value="" disabled>Select site</option>{sites.data?.map((x) => <option key={x.id} value={x.id}>{x.label || x.address_line}</option>)}</Select><Input label="Estimated capacity (kW)" name="capacity_kw" type="number" min="0.001" step="0.001" /><Select label="System type" name="system_type"><option value="on-grid">On-grid</option><option value="off-grid">Off-grid</option></Select><Textarea label="Requirements" name="requirements" className="sm:col-span-2" /><Button type="submit" loading={create.isPending} disabled={!customer.data || !sites.data?.length}>Submit enquiry</Button></form></Card>
    {enquiries.isLoading ? <LoadingState /> : enquiries.isError ? <ErrorState description={apiErrorMessage(enquiries.error)} onRetry={() => void enquiries.refetch()} /> : enquiries.data?.length ? <Card><Table><TableHead><tr><TableHeader>Site</TableHeader><TableHeader>Capacity</TableHeader><TableHeader>System</TableHeader><TableHeader>Status</TableHeader><TableHeader>Created</TableHeader></tr></TableHead><TableBody>{enquiries.data.map((x) => <TableRow key={x.id}><TableCell>{x.address}{x.city ? ` · ${x.city}` : ''}</TableCell><TableCell>{x.capacity_kw ? `${x.capacity_kw} kW` : '—'}</TableCell><TableCell>{x.system_type || '—'}</TableCell><TableCell><Badge>{x.status.replaceAll('_', ' ')}</Badge></TableCell><TableCell>{x.created_at ? new Date(x.created_at).toLocaleDateString() : '—'}</TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyState title="No enquiries yet" description="Choose one of your sites to start an enquiry." />}
  </>
}

export function CustomerServicePage() {
  const client = useQueryClient()
  const customer = useQuery({ queryKey: ['my-customer'], queryFn: getMyCustomer })
  const tickets = useQuery({ queryKey: ['my-tickets'], queryFn: getTickets })
  const [selectedTicket, setSelectedTicket] = useState('')
  const detail = useQuery({ queryKey: ['my-ticket', selectedTicket], queryFn: () => getTicket(selectedTicket), enabled: Boolean(selectedTicket) })
  const create = useMutation({ mutationFn: createTicket, onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-tickets'] }) } })
  const addUpdate = useMutation({ mutationFn: ({ id, notes }: { id: string; notes: string }) => addTicketActivity(id, { activity_type: 'customer_update', notes }), onSuccess: () => { void client.invalidateQueries({ queryKey: ['my-ticket', selectedTicket] }) } })
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); create.mutate({ notes: String(form.get('notes')).trim() }) }
  return <>
    <PageHeader eyebrow="Customer portal" title="Service requests" description="Request service and review ticket status. The current service-ticket schema stores activity notes but has no subject, priority, or customer confirmation field." />
    {(create.isError || addUpdate.isError) && <div className="mb-4"><ErrorState description={apiErrorMessage(create.error || addUpdate.error)} /></div>}
    <Card className="mb-5 max-w-2xl p-5"><h2 className="mb-3 font-semibold">Open a request</h2><form onSubmit={submit} className="grid gap-3"><Textarea label="Describe the issue" name="notes" required minLength={3} /><Button type="submit" loading={create.isPending} disabled={!customer.data}>Create service request</Button></form></Card>
    {tickets.isLoading ? <LoadingState /> : tickets.isError ? <ErrorState description={apiErrorMessage(tickets.error)} onRetry={() => void tickets.refetch()} /> : tickets.data?.length ? <Card><Table><TableHead><tr><TableHeader>Request</TableHeader><TableHeader>Status</TableHeader><TableHeader>Opened</TableHeader><TableHeader>Activity</TableHeader></tr></TableHead><TableBody>{tickets.data.map((x) => <TableRow key={x.id}><TableCell className="font-mono text-xs">{x.id.slice(0, 8)}</TableCell><TableCell><Badge>{x.status}</Badge></TableCell><TableCell>{new Date(x.opened_at).toLocaleDateString()}</TableCell><TableCell><Button variant="tertiary" onClick={() => setSelectedTicket(x.id)}>View / update</Button></TableCell></TableRow>)}</TableBody></Table></Card> : <EmptyState title="No service requests" description="Your service requests will appear here." />}
    {selectedTicket && <Card className="mt-5 max-w-3xl p-5"><div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Request activity</h2><Button variant="tertiary" onClick={() => setSelectedTicket('')}>Close</Button></div>{detail.isLoading ? <LoadingState /> : detail.isError ? <ErrorState description={apiErrorMessage(detail.error)} onRetry={() => void detail.refetch()} /> : <><ol className="my-4 space-y-3">{detail.data?.activities?.length ? detail.data.activities.map((item) => <li key={item.id} className="rounded-md border border-border p-3"><p className="text-xs text-muted">{item.activity_type.replaceAll('_', ' ')} · {new Date(item.occurred_at).toLocaleString()}</p>{item.notes && <p className="mt-1 text-sm">{item.notes}</p>}</li>) : <li className="text-sm text-muted">No customer-visible updates yet.</li>}</ol><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const notes = String(form.get('notes')).trim(); if (notes) { addUpdate.mutate({ id: selectedTicket, notes }); event.currentTarget.reset() } }} className="grid gap-3"><Textarea label="Add an update" name="notes" required minLength={3} maxLength={4000} /><Button type="submit" loading={addUpdate.isPending}>Send update</Button></form></>}</Card>}
  </>
}
