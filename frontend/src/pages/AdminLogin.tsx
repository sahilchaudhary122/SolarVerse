import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Sun } from 'lucide-react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { z } from 'zod'
import { Button, Card, IconButton, Input } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import { getAuthErrorMessage } from '../auth/authService'

const adminLoginSchema = z.object({
  email: z.string().trim().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

type AdminLoginValues = z.infer<typeof adminLoginSchema>

export function AdminLogin() {
  const navigate = useNavigate()
  const { principal, signIn, signOut } = useAuth()
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminLoginValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (principal?.kind === 'staff' && principal.role === 'system_admin') {
      navigate('/admin/dashboard', { replace: true })
    }
  }, [navigate, principal])

  const onSubmit: SubmitHandler<AdminLoginValues> = async (credentials) => {
    setAuthError(null)
    try {
      const authenticatedPrincipal = await signIn(credentials)
      if (authenticatedPrincipal.kind !== 'staff' || authenticatedPrincipal.role !== 'system_admin') {
        signOut()
        setAuthError('This account is not authorized for administrator access. Staff and customers should use the unified sign-in page.')
        return
      }
      navigate('/admin/dashboard', { replace: true })
    } catch (error) {
      setAuthError(getAuthErrorMessage(error))
    }
  }

  const currentAccountIsNotAdmin = principal !== null && !(principal.kind === 'staff' && principal.role === 'system_admin')

  return <div className="mx-auto w-full max-w-md">
    <Card className="p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-brand/10 text-brand"><Sun aria-hidden="true" className="size-6" /></span>
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">SolarVerse</p><p className="text-sm text-muted">Administrator access</p></div>
      </div>

      <div className="mb-6"><div className="mb-3 grid size-10 place-items-center rounded-md bg-surface-raised text-brand"><LockKeyhole aria-hidden="true" className="size-5" /></div><h1 className="text-2xl font-bold tracking-tight text-app-text">SolarVerse Administration</h1><p className="mt-2 text-sm leading-relaxed text-muted">Sign in with an administrator account to access the administration workspace.</p></div>

      <div role="status" className="mb-5 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm leading-relaxed text-app-text">Administrator authentication is pending FastAPI integration. No credentials are sent and no session is created by this page until the backend contract is available.</div>
      <div role="note" className="mb-5 rounded-md border border-border bg-surface-raised px-3 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted">Authorized administrators only</div>

      {currentAccountIsNotAdmin && <div role="alert" className="mb-5 rounded-md border border-warning/30 bg-warning/5 p-3 text-sm leading-relaxed text-app-text"><p>The current signed-in account does not have the administrator role and cannot access administration.</p><Button type="button" variant="tertiary" className="mt-2 min-h-8 px-2 py-1 text-xs" onClick={signOut}>Sign out current account</Button></div>}
      {authError && <div role="alert" className="mb-5 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm leading-relaxed text-danger">{authError}</div>}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input label="Email address" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <div className="relative">
          <Input label="Password" type={passwordVisible ? 'text' : 'password'} autoComplete="current-password" error={errors.password?.message} {...register('password')} />
          <IconButton type="button" label={passwordVisible ? 'Hide password' : 'Show password'} aria-pressed={passwordVisible} className="absolute right-1 top-7" onClick={() => setPasswordVisible((visible) => !visible)}>{passwordVisible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}</IconButton>
        </div>
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">Sign in to administration <ArrowRight aria-hidden="true" className="size-4" /></Button>
      </form>

      <p className="mt-5 text-center text-sm"><Link to="/" className="font-semibold text-brand hover:underline focus-visible:outline-offset-2">Return to public website</Link></p>
    </Card>
  </div>
}

export default AdminLogin
