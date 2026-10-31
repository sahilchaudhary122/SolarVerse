import { useState } from 'react'
import { Link } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Sun, UserRoundPlus } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { Button, Card, Checkbox, IconButton, Input } from '../components/ui'

const registrationSchema = z.object({
  fullName: z.string().trim().min(1, 'Enter your full name'),
  email: z.string().trim().email('Enter a valid email address'),
  mobile: z.string().trim().min(7, 'Enter a valid mobile number').max(24, 'Enter a valid mobile number').regex(/^[+\d()\s.-]+$/, 'Use digits and common phone number characters'),
  password: z.string().min(8, 'Use at least 8 characters').regex(/[A-Za-z]/, 'Include at least one letter').regex(/\d/, 'Include at least one number'),
  confirmPassword: z.string().min(1, 'Confirm your password'),
  termsAccepted: z.boolean().refine((accepted) => accepted, 'Accept the terms to continue'),
}).superRefine((values, context) => {
  if (values.password !== values.confirmPassword) context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' })
})

type RegistrationValues = z.infer<typeof registrationSchema>

export function RegistrationPage() {
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [confirmationVisible, setConfirmationVisible] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegistrationValues>({
    resolver: zodResolver(registrationSchema),
    defaultValues: { fullName: '', email: '', mobile: '', password: '', confirmPassword: '', termsAccepted: false },
  })

  const onSubmit: SubmitHandler<RegistrationValues> = () => {
    setNotice('Customer registration is not connected yet. Your details were not sent or saved. Please use Sign in only if you already have an account.')
  }

  return <Card className="p-6 shadow-xl sm:p-8">
    <div className="mb-6 flex items-center gap-3">
      <span className="grid size-11 place-items-center rounded-lg bg-brand/10 text-brand"><Sun aria-hidden="true" className="size-6" /></span>
      <div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">SolarVerse</p><p className="text-sm text-muted">Customer account registration</p></div>
    </div>
    <div className="mb-5">
      <div className="mb-3 grid size-10 place-items-center rounded-md bg-surface-raised text-brand"><UserRoundPlus aria-hidden="true" className="size-5" /></div>
      <h1 className="text-2xl font-bold tracking-tight text-app-text">Create a customer account</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">This registration is for SolarVerse customers. Staff accounts are managed separately by an administrator.</p>
    </div>
    <div role="status" className="mb-5 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm leading-relaxed text-app-text">Registration integration is pending. Submitting this form will not send your details to a server or create an account.</div>
    {notice && <div role="status" aria-live="polite" className="mb-5 rounded-md border border-info/30 bg-info/5 p-3 text-sm leading-relaxed text-app-text">{notice}</div>}
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <Input label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
      <Input label="Email address" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false} error={errors.email?.message} {...register('email')} />
      <Input label="Mobile number" type="tel" autoComplete="tel" error={errors.mobile?.message} {...register('mobile')} />
      <div className="relative">
        <Input label="Password" type={passwordVisible ? 'text' : 'password'} autoComplete="new-password" hint="At least 8 characters, including a letter and a number." error={errors.password?.message} {...register('password')} />
        <IconButton type="button" label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} className="absolute right-1 top-7" onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}</IconButton>
      </div>
      <div className="relative">
        <Input label="Confirm password" type={confirmationVisible ? 'text' : 'password'} autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <IconButton type="button" label={confirmationVisible ? 'Hide confirmation password' : 'Show confirmation password'} aria-pressed={confirmationVisible} className="absolute right-1 top-7" onClick={() => setConfirmationVisible((visible) => !visible)}>{confirmationVisible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}</IconButton>
      </div>
      <Checkbox label="I accept the SolarVerse terms and conditions" error={errors.termsAccepted?.message} {...register('termsAccepted')} />
      <p className="-mt-2 text-xs text-muted">The terms content and final password policy require confirmation before live registration is enabled.</p>
      <Button type="submit" loading={isSubmitting} className="mt-1 w-full">Submit registration request</Button>
    </form>
    <p className="mt-5 text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-brand hover:underline focus-visible:outline-offset-2">Sign in</Link></p>
  </Card>
}

export default RegistrationPage
