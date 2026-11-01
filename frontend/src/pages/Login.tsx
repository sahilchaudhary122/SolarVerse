import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowRight, LockKeyhole, Sun } from 'lucide-react'
import { Button, Card, Input } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import { dashboardForPrincipal, getAuthErrorMessage } from '../auth/authService'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function Login() {
  const navigate = useNavigate()
  const { principal, signIn } = useAuth()
  const [authError, setAuthError] = useState<string | null>(null)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (principal) navigate(dashboardForPrincipal(principal), { replace: true })
  }, [navigate, principal])

  const onSubmit: SubmitHandler<LoginFormValues> = async (credentials) => {
    setAuthError(null)
    try {
      const authenticatedPrincipal = await signIn(credentials)
      navigate(dashboardForPrincipal(authenticatedPrincipal), { replace: true })
    } catch (error) {
      setAuthError(getAuthErrorMessage(error))
    }
  }

  return <div className="mx-auto w-full max-w-md">
    <Card className="p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg bg-brand/10 text-brand"><Sun aria-hidden="true" className="size-6" /></span>
        <div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">SolarVerse</p><p className="text-sm text-muted">Unified account access</p></div>
      </div>

      <div className="mb-6"><div className="mb-3 grid size-10 place-items-center rounded-md bg-surface-raised text-brand"><LockKeyhole aria-hidden="true" className="size-5" /></div><h1 className="text-2xl font-bold tracking-tight text-app-text">Sign in</h1><p className="mt-2 text-sm leading-relaxed text-muted">Use your SolarVerse account. Your authenticated account role will choose the correct portal.</p></div>

      {authError && <div role="alert" className="mb-5 rounded-md border border-danger/30 bg-danger/5 p-3 text-sm leading-relaxed text-danger">{authError}</div>}

      <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
        <Input label="Email address" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} error={errors.email?.message} {...register('email')} />
        <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" loading={isSubmitting} className="mt-2 w-full">{isSubmitting ? 'Signing in…' : 'Sign in'} <ArrowRight aria-hidden="true" className="size-4" /></Button>
      </form>

      <p className="mt-5 text-center text-sm text-muted">Don't have an account? <Link to="/register" className="font-semibold text-brand hover:underline focus-visible:outline-offset-2">Create an account</Link></p>
      <p className="mt-5 text-center text-xs leading-relaxed text-muted">Staff and customer accounts use the same sign-in page. No role selection is needed.</p>
    </Card>
  </div>
}

export default Login
