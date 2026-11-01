import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ArrowRight, CheckCircle2, Sun } from 'lucide-react'
import { Button, Card, Input, Select } from '../../components/ui'
import { submitEnquiry } from '../../lib/api'
import type { EnquiryCreate, EnquirySubmission } from '../../lib/api'
import { apiErrorMessage } from '../../lib/apiClient'

const enquirySchema = z.object({
  customer_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().trim().regex(/^\+[1-9]\d{6,14}$/, 'Use an international number such as +919876543210'),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]).optional(),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  city: z.string().min(2, 'City must be at least 2 characters'),
  state: z.string().min(2, 'State or region must be at least 2 characters'),
  postal_code: z.string().min(3, 'Postal code must be at least 3 characters'),
  capacity_kw: z.number().positive('Enter a positive capacity'),
  system_type: z.enum(['on-grid', 'off-grid']),
})

type EnquiryFormData = z.infer<typeof enquirySchema>

export function EnquiryForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: { customer_name: '', phone: '', email: '', address: '', city: '', state: '', postal_code: '', capacity_kw: 5, system_type: 'on-grid' },
  })

  const mutation = useMutation<EnquirySubmission, Error, EnquiryCreate>({
    mutationFn: submitEnquiry,
    onSuccess: (data) => { setSuccessMessage(data.message); reset() },
  })

  const onSubmit = (data: EnquiryFormData) => {
    setSuccessMessage(null)
    mutation.reset()
    mutation.mutate({ ...data, email: data.email?.trim() || undefined })
  }

  return <div id="enquiry-form" className="bg-app-bg px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
    <div className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-14">
      <div className="lg:sticky lg:top-28">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-accent">Start a conversation</p>
        <h2 className="text-3xl font-bold tracking-tight text-app-text sm:text-4xl">Tell us a little about your solar plans.</h2>
        <p className="mt-4 leading-relaxed text-muted">Share your contact and site details with our team.</p>
        <div className="mt-6 rounded-lg border border-border bg-surface-raised p-4 text-sm leading-relaxed text-muted">
          <p className="font-semibold text-app-text">Secure enquiry submission</p>
          <p className="mt-1">Your enquiry is sent to SolarVerse so our team can follow up.</p>
        </div>
        <div className="mt-6 flex items-start gap-3 text-sm text-muted"><Sun aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-brand" /><p>System requirements and capacity can be discussed after reviewing the property and project needs.</p></div>
      </div>

      <Card className="p-5 sm:p-8">
        <div className="mb-6"><h3 className="text-xl font-semibold tracking-tight text-app-text">Enquiry details</h3><p className="mt-1 text-sm text-muted">Complete the fields below to submit your enquiry.</p></div>

        {successMessage && <div role="status" className="mb-5 flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-sm text-app-text"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-success" /><p>{successMessage}</p></div>}
        {mutation.isError && <div role="alert" className="mb-5 rounded-md border border-danger/30 bg-danger/5 p-4 text-sm text-danger">{apiErrorMessage(mutation.error)}</div>}

        <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-5 sm:grid-cols-2">
          <Input label="Full name" autoComplete="name" error={errors.customer_name?.message} {...register('customer_name')} />
          <Input label="Phone number" type="tel" autoComplete="tel" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (optional)" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
          <Input label="Street address" autoComplete="street-address" className="sm:col-span-2" error={errors.address?.message} {...register('address')} />
          <Input label="City" autoComplete="address-level2" error={errors.city?.message} {...register('city')} />
          <Input label="State or region" autoComplete="address-level1" error={errors.state?.message} {...register('state')} />
          <Input label="Postal code" autoComplete="postal-code" error={errors.postal_code?.message} {...register('postal_code')} />
          <Input label="Estimated system capacity (kW)" type="number" min="0.1" step="0.1" hint="An initial estimate is fine." error={errors.capacity_kw?.message} {...register('capacity_kw', { valueAsNumber: true })} />
          <Select label="System type" className="sm:col-span-2" error={errors.system_type?.message} {...register('system_type')}>
            <option value="on-grid">On-grid</option><option value="off-grid">Off-grid</option>
          </Select>
          <Button type="submit" loading={mutation.isPending} disabled={mutation.isPending} className="w-full sm:col-span-2">{mutation.isPending ? 'Submitting…' : 'Submit enquiry'} <ArrowRight aria-hidden="true" className="size-4" /></Button>
        </form>
      </Card>
    </div>
  </div>
}
