import { ArrowRight } from 'lucide-react'

export function ServicesSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const services = [
    {
      title: 'Maintenance Services',
      image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop',
      description: 'Comprehensive system checks, inverter performance auditing, and professional panel cleaning to ensure peak generation.',
    },
    {
      title: 'Solar PV Systems',
      image: 'https://images.unsplash.com/photo-1592833159155-c62df1b65634?q=80&w=2070&auto=format&fit=crop',
      description: 'Turnkey photovoltaic setups engineered for residential and commercial properties with maximum energy yield.',
    },
    {
      title: 'Solar Panels',
      image: 'https://images.unsplash.com/photo-1613665813446-82a78c468a1d?q=80&w=2058&auto=format&fit=crop',
      description: 'High-efficiency monocrystalline tier-1 solar panels backed by a 25-year performance warranty.',
    },
    {
      title: 'Solar BOS',
      image: 'https://images.unsplash.com/photo-1548613053-22087dd8edb8?q=80&w=2070&auto=format&fit=crop',
      description: 'Advanced balance of system (BOS) components including wiring, mounting structures, and smart disconnects.',
    },
  ]

  return (
    <section id="services" className="py-24 bg-gray-900 dark:bg-gray-950 transition-colors text-white relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-brand font-semibold text-sm uppercase tracking-wider">
            Our Offerings
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold mt-2 tracking-tight">
            We are Building a Sustainable Service
          </h2>
          <p className="text-gray-400 mt-4 text-base sm:text-lg">
            Explore our state-of-the-art solar products and engineering services designed for long-term reliability.
          </p>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              onClick={() => scrollToSection('enquiry-form')}
              className="glass-panel rounded-3xl overflow-hidden hover:-translate-y-2 hover:shadow-[0_0_30px_color-mix(in_srgb,var(--sv-brand)_20%,transparent)] transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={service.image}
                    alt={service.title}
                    className="w-full h-64 object-cover group-hover:scale-[1.05] hover:scale-[1.02] transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
                    {service.description}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between">
                <span className="text-xs font-semibold text-brand dark:text-brand uppercase tracking-wider">
                  Learn More
                </span>
                <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand dark:text-brand group-hover:bg-brand group-hover:text-white dark:group-hover:text-gray-950 transition-all shadow-md">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
