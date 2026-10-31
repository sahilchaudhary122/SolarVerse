import { ArrowRight, Zap } from 'lucide-react'

export function Hero() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
      {/* Background Image & Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1508921912186-1d1a45ebb3c1?q=80&w=2070&auto=format&fit=crop"
          alt="Solar panels on modern roof"
          className="w-full h-full object-cover object-center scale-105 hover:scale-[1.02] transition-transform duration-500 animate-fade-in"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black/80 backdrop-blur-[2px]" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-brand/10 border border-brand/30 text-brand mb-8 backdrop-blur-md animate-fade-in-up">
          <Zap className="w-4 h-4 text-brand animate-pulse" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">
            Next-Gen Solar Energy Platform
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight sm:leading-none mb-6 animate-fade-in-up delay-100">
          We Specialize in <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-fresh to-brand-fresh">
            Sustainable Energy Solutions
          </span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-2xl mx-auto text-lg sm:text-xl text-gray-300 mb-10 leading-relaxed animate-fade-in-up delay-200">
          SolarVerse connects customer enquiries, site surveys, and installations in one app.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 animate-fade-in-up delay-300">
          <button
            onClick={() => scrollToSection('enquiry-form')}
            className="w-full sm:w-auto px-8 py-4 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-bold rounded-2xl shadow-xl hover:shadow-[0_0_20px_color-mix(in_srgb,var(--sv-brand)_50%,transparent)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-center space-x-3 text-base group"
          >
            <span>Get Started</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
         
        </div>
      </div>
    </div>
  )
}
