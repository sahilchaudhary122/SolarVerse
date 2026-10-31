import { Zap, Battery, Sun, Award } from 'lucide-react'

export function AboutSection() {
  const points = [
    {
      icon: Zap,
      title: 'Peak Saving',
      description: 'Intelligently reduce your highest electricity demand spikes to dramatically lower commercial and residential utility bills.',
    },
    {
      icon: Battery,
      title: 'Demand Response',
      description: 'Automated battery dispatch during grid stress events, earning you credits and ensuring uninterrupted power.',
    },
    {
      icon: Sun,
      title: 'Load Shifting',
      description: 'Store excess solar generation during peak sunlight hours and deploy it when utility rates are most expensive.',
    },
  ]

  return (
    <section id="about" className="py-24 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Tag, Heading, Paragraph, 3 Bullet Points */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-brand dark:text-brand font-semibold text-sm uppercase tracking-wider">
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
              Providing the Best Service in Solar Energy
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg leading-relaxed">
              SolarVerse is a pioneering renewable energy platform designed to streamline your entire solar journey. From initial consultation and site surveys to seamless installation and ongoing maintenance, we empower homes and businesses with reliable, clean electricity.
            </p>

            {/* 3 Bullet Points with Icons */}
            <div className="space-y-4 pt-4">
              {points.map((point, index) => {
                const Icon = point.icon
                return (
                  <div
                    key={index}
                    className="glass-panel p-5 rounded-2xl hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex items-start space-x-4"
                  >
                    <div className="w-12 h-12 rounded-xl bg-brand/10 flex items-center justify-center text-brand dark:text-brand shrink-0 mt-1">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                        {point.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        {point.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right Column: Image with Floating Badge */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
              <img
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2072&auto=format&fit=crop"
                alt="Solar panels installation team"
                className="w-full h-64 sm:h-[540px] object-cover hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent" />

              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-6 glass-panel rounded-2xl flex items-center space-x-4 shadow-xl">
                <div className="w-14 h-14 rounded-2xl bg-brand flex items-center justify-center text-white dark:text-gray-950 font-bold shrink-0 shadow-lg">
                  <Award className="w-7 h-7" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-black text-xl">12+ Years Experience</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Leading the solar transition with proven expertise & excellence.</p>
                </div>
              </div>
            </div>

            {/* Background Glow */}
            <div className="absolute -top-6 -right-6 w-72 h-72 bg-brand/10 rounded-full blur-3xl -z-10" />
          </div>
        </div>
      </div>
    </section>
  )
}
