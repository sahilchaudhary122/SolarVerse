import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { ShieldCheck, Clock, Zap, CheckCircle2, Send } from 'lucide-react'

const enquirySchema = z.object({
  customer_name: z.string().min(2, 'Customer name must be at least 2 characters'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  address: z.string().min(5, 'Please enter a valid address'),
  capacity_kw: z.number().positive('Capacity must be a positive number'),
  system_type: z.enum(['on-grid', 'off-grid']),
})

type EnquiryFormData = z.infer<typeof enquirySchema>

interface EnquiryResponse {
  success: boolean;
  message: string;
  data: EnquiryFormData;
}

export function EnquiryForm() {
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EnquiryFormData>({
    resolver: zodResolver(enquirySchema),
    defaultValues: {
      customer_name: '',
      phone: '',
      address: '',
      capacity_kw: 5,
      system_type: 'on-grid',
    },
  })

  const mutation = useMutation<EnquiryResponse, Error, EnquiryFormData>({
    mutationFn: async (formData: EnquiryFormData) => {
      return new Promise<EnquiryResponse>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() < 0.03) {
            reject(new Error('Failed to submit enquiry. Please try again.'))
          } else {
            resolve({
              success: true,
              message: 'Enquiry submitted successfully! Our solar expert will contact you within 24 hours.',
              data: formData,
            })
          }
        }, 1200)
      })
    },
    onSuccess: (data) => {
      setSuccessMessage(data.message)
      reset()
    },
  })

  const onSubmit = (data: EnquiryFormData) => {
    setSuccessMessage(null)
    mutation.mutate(data)
  }

  return (
    <div id="enquiry-form">
      <section className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Column: Get a Free Quote Today & Benefits */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm uppercase tracking-wider">
                Lead Capture
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                Get a Free Quote Today
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
                SolarVerse connects your custom enquiries, site surveys, and installations seamlessly in one app. Request your free consultation and savings estimate.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-medium">Custom savings report based on your utility bill</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-medium">Expert consultation with zero sales pressure</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-700 dark:text-gray-300">
                  <CheckCircle2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-sm font-medium">Instant quote breakdown for $0-down financing</span>
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-800 grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Secure Data</p>
                    <p className="text-xs text-gray-500">100% Confidential</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">Fast Response</p>
                    <p className="text-xs text-gray-500">Within 24 Hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Actual Enquiry Form */}
            <div className="lg:col-span-7">
              <div className="bg-white dark:bg-gray-900 p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-800 transition-colors">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    Request Your Solar Quote
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Provide your project details below to connect with our solar experts.
                  </p>
                </div>

                {successMessage && (
                  <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-2xl text-amber-700 dark:text-amber-300 text-sm flex items-center justify-between">
                    <span>{successMessage}</span>
                    <button
                      type="button"
                      onClick={() => setSuccessMessage(null)}
                      className="text-amber-700 dark:text-amber-300 font-bold hover:opacity-75 ml-2 text-lg"
                    >
                      ×
                    </button>
                  </div>
                )}

                {mutation.isError && (
                  <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-700 dark:text-rose-300 text-sm">
                    {mutation.error.message || 'An error occurred during submission.'}
                  </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      {...register('customer_name')}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                    />
                    {errors.customer_name && (
                      <p className="text-rose-500 text-xs mt-1">{errors.customer_name.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="+1 (555) 000-0000"
                        {...register('phone')}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                      />
                      {errors.phone && (
                        <p className="text-rose-500 text-xs mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        System Capacity (kW)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        {...register('capacity_kw', { valueAsNumber: true })}
                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                      />
                      {errors.capacity_kw && (
                        <p className="text-rose-500 text-xs mt-1">{errors.capacity_kw.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Installation Address
                    </label>
                    <input
                      type="text"
                      placeholder="123 Solar Street, Sunnyville, CA"
                      {...register('address')}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                    />
                    {errors.address && (
                      <p className="text-rose-500 text-xs mt-1">{errors.address.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      System Type
                    </label>
                    <select
                      {...register('system_type')}
                      className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none transition-colors"
                    >
                      <option value="on-grid">On-Grid (Grid-Tied)</option>
                      <option value="off-grid">Off-Grid (Standalone with Battery)</option>
                    </select>
                    {errors.system_type && (
                      <p className="text-rose-500 text-xs mt-1">{errors.system_type.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl shadow-lg hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/30 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? (
                      <span>Submitting Enquiry...</span>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        <span>Submit Free Quote Request</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
