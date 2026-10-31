import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import type { SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sun, Mail, Lock, User, Phone, Loader2, ArrowRight, ShieldCheck, Zap, CheckCircle2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

const signupSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  middleName: z.string().optional().or(z.literal('')),
  lastName: z.string().optional().or(z.literal('')),
  countryCode: z.string(),
  phone: z.string().regex(/^\d{10}$/, 'Phone number must be 10 digits'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
})

type LoginFormValues = z.infer<typeof loginSchema>
type SignupFormValues = z.infer<typeof signupSchema>

export function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      middleName: '',
      lastName: '',
      countryCode: '+91',
      phone: '',
      email: '',
      password: '',
    },
  })

  const onLoginSubmit: SubmitHandler<LoginFormValues> = (data) => {
    setIsLoading(true)
    setAuthError(null)
    setSuccessMessage(null)

    // Simulate login API call
    setTimeout(() => {
      setIsLoading(false)
      if (data.email && data.password.length >= 6) {
        localStorage.setItem('token', 'mock-jwt-token-solarverse')
        navigate('/dashboard')
      } else {
        setAuthError('Invalid credentials. Please check your email and password.')
      }
    }, 1000)
  }

  const onSignupSubmit: SubmitHandler<SignupFormValues> = (_data) => {
    setIsLoading(true)
    setAuthError(null)
    setSuccessMessage(null)

    // Simulate API call & auto toggle back to login view
    setTimeout(() => {
      setIsLoading(false)
      setSuccessMessage('Account created successfully! Please sign in with your credentials.')
      setIsLogin(true)
      signupForm.reset()
    }, 1000)
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
      {/* Left Column: SolarVerse Branding & Background Image */}
      <div 
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-cover bg-center text-white"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2072&auto=format&fit=crop')` }}
      >
        {/* Dark amber / orange gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/85 via-amber-900/75 to-orange-950/85 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.25),transparent_60%)] pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 backdrop-blur-md flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-lg group-hover:scale-105 transition-transform">
              <Sun className="w-7 h-7" />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">
              Solar<span className="text-amber-400">Verse</span>
            </span>
          </Link>
        </div>

        {/* Center Content */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 backdrop-blur-md text-xs font-bold text-amber-300 border border-amber-500/30 shadow-sm">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Powering the Future of Solar Management
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Enterprise Solar Management & Telemetry
          </h1>
          <p className="text-base text-gray-300 font-medium leading-relaxed">
            Access your real-time telemetry, automated quote builder, inventory serial scanners, and installation dispatch operations from one secure portal.
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-3 text-sm font-semibold text-gray-200">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <span>Real-time generation telemetry & analytics</span>
            </div>
            <div className="flex items-center space-x-3 text-sm font-semibold text-gray-200">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <span>Tier-1 hardware warranty & serial tracking</span>
            </div>
            <div className="flex items-center space-x-3 text-sm font-semibold text-gray-200">
              <div className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center border border-amber-500/30">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
              </div>
              <span>Instant AI-powered commercial & residential quoting</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="relative z-10 flex items-center justify-between text-xs font-semibold text-gray-400 pt-6 border-t border-white/10">
          <span>© {new Date().getFullYear()} SolarVerse Inc.</span>
          <Link to="/" className="hover:text-amber-400 transition flex items-center gap-1">
            Back to Public Website <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Right Column: Authentication Form Panel */}
      <div className="flex flex-col justify-center items-center p-6 sm:p-10 lg:p-14 relative overflow-y-auto max-h-screen">
        <div className="absolute top-6 right-6 lg:hidden">
          <Link to="/" className="text-xs font-semibold text-amber-500 hover:underline flex items-center gap-1">
            ← Home
          </Link>
        </div>

        <div className="w-full max-w-md space-y-6 my-auto py-8">
          <div className="space-y-3 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Sun className="w-7 h-7" />
              </div>
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isLogin 
                ? 'Enter your credentials to access your SolarVerse dashboard' 
                : 'Join SolarVerse to manage solar installations and telemetry'}
            </p>
          </div>

          {/* Toggle Switch / Tabs */}
          <div className="flex rounded-2xl bg-gray-100 dark:bg-gray-900 p-1.5 border border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true)
                setAuthError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isLogin
                  ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false)
                setAuthError(null)
                setSuccessMessage(null)
              }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                !isLogin
                  ? 'bg-white dark:bg-gray-800 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {successMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {authError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold">
              {authError}
            </div>
          )}

          {isLogin ? (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    {...loginForm.register('email')}
                    placeholder="name@gmail.com"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                      loginForm.formState.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Password
                  </label>
                  <a 
                    href="#forgot" 
                    onClick={(e) => { e.preventDefault(); alert('Demo password reset instruction sent to mock email.'); }} 
                    className="text-xs font-semibold text-amber-500 hover:underline"
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    {...loginForm.register('password')}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                      loginForm.formState.errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed pt-4"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <span>Sign In</span>
                )}
              </button>
            </form>
          ) : (
            /* Sign Up / Create Account Form */
            <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
              {/* First Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  First Name <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    {...signupForm.register('firstName')}
                    placeholder="Alex"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                      signupForm.formState.errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                  />
                </div>
                {signupForm.formState.errors.firstName && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{signupForm.formState.errors.firstName.message}</p>
                )}
              </div>

              {/* Middle Name (Optional) & Last Name (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    {...signupForm.register('middleName')}
                    placeholder="Kumar"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                    Last Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    {...signupForm.register('lastName')}
                    placeholder="Sharma"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition"
                  />
                </div>
              </div>

              {/* Phone Number with Country Code Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Phone Number <span className="text-amber-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative w-32 flex-shrink-0">
                    <select
                      {...signupForm.register('countryCode')}
                      className="w-full h-full px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm font-medium transition cursor-pointer appearance-none"
                    >
                      <option value="+91">🇮🇳 +91</option>
                      <option value="+1">🇺🇸 +1</option>
                      <option value="+44">🇬🇧 +44</option>
                      <option value="+61">🇦🇺 +61</option>
                      <option value="+971">🇦🇪 +971</option>
                    </select>
                  </div>
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Phone className="w-5 h-5" />
                    </div>
                    <input
                      type="tel"
                      {...signupForm.register('phone')}
                      placeholder="9876543210"
                      maxLength={10}
                      className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                        signupForm.formState.errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                      } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                    />
                  </div>
                </div>
                {signupForm.formState.errors.phone && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{signupForm.formState.errors.phone.message}</p>
                )}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Email Address <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    {...signupForm.register('email')}
                    placeholder="name@solarverse.com"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                      signupForm.formState.errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                  />
                </div>
                {signupForm.formState.errors.email && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{signupForm.formState.errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  Password <span className="text-amber-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type="password"
                    {...signupForm.register('password')}
                    placeholder="••••••••"
                    className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-900 border ${
                      signupForm.formState.errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-200 dark:border-gray-800 focus:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm transition`}
                  />
                </div>
                {signupForm.formState.errors.password && (
                  <p className="text-xs text-red-500 font-semibold mt-1">{signupForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold rounded-xl shadow-lg hover:shadow-xl hover:shadow-amber-500/20 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-75 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-gray-900" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>
          )}

          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-center space-y-1">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Secure Enterprise Portal
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isLogin ? 'Use any email and password (min 6 chars) to log in.' : 'Fill in your details to register a new account.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
