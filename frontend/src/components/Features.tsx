import { Home, Building2, BatteryCharging, ArrowRight } from 'lucide-react'

export function Features() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const features = [
    {
      icon: Home,
      title: 'Residential Solar',
      description: 'Custom-designed solar panel systems for homes of all sizes. Slash your monthly electricity bills and achieve energy independence.',
      badge: 'Most Popular',
      delayClass: 'animate-fade-in-up delay-100',
    },
    {
      icon: Building2,
      title: 'Commercial Solar',
      description: 'Scalable commercial PV solutions designed to lower operational overhead, boost corporate sustainability, and enhance brand equity.',
      badge: 'High ROI',
      delayClass: 'animate-fade-in-up delay-200',
    },
    {
      icon: BatteryCharging,
      title: 'Battery Storage',
      description: 'Advanced lithium-ion energy storage systems to keep your home powered during blackouts and maximize self-consumption.',
      badge: '24/7 Backup',
      delayClass: 'animate-fade-in-up delay-300',
    },
  ]

  return (
    <section id="features" className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up">
          <span className="text-brand dark:text-brand font-semibold text-sm uppercase tracking-wider">
            Our Solutions
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
            Complete Solar Solutions for Every Need
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-base sm:text-lg">
            From residential rooftops to large-scale commercial arrays and backup battery integration, we deliver premium performance.
          </p>
        </div>

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                onClick={() => scrollToSection('enquiry-form')}
                className={`bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm hover:-translate-y-2 hover:shadow-xl dark:shadow-none dark:border dark:border-gray-800 dark:hover:shadow-brand/20 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden cursor-pointer ${feature.delayClass}`}
              >
                {/* Top Accent Gradient Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand to-brand-fresh opacity-0 group-hover:opacity-100 transition-opacity" />

                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-brand-soft dark:bg-brand-soft/50 flex items-center justify-center text-brand dark:text-brand group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="px-3 py-1 bg-brand-soft dark:bg-brand-soft text-brand dark:text-brand text-xs font-semibold rounded-full border border-brand-soft dark:border-brand/40">
                      {feature.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6">
                    {feature.description}
                  </p>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    scrollToSection('enquiry-form')
                  }}
                  className="inline-flex items-center space-x-2 text-brand dark:text-brand font-semibold text-sm group-hover:text-warning dark:group-hover:text-brand-fresh transition-colors pt-4 border-t border-gray-100 dark:border-gray-800"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
