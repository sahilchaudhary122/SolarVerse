import { MessageSquare, PenTool, Wrench, Zap } from 'lucide-react'

export function ProcessSection() {
  const steps = [
    {
      step: '01',
      icon: MessageSquare,
      title: 'Consultation',
      description: 'We analyze your utility bills and roof specs to design a custom solar proposal.',
    },
    {
      step: '02',
      icon: PenTool,
      title: 'Design',
      description: 'Our engineers prepare precise blueprints and handle all municipal permits.',
    },
    {
      step: '03',
      icon: Wrench,
      title: 'Installation',
      description: 'NABCEP-certified technicians mount and wire your system cleanly.',
    },
    {
      step: '04',
      icon: Zap,
      title: 'Activation',
      description: 'System inspection, utility interconnection, and you generate clean energy!',
    },
  ]

  return (
    <section className="py-24 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm uppercase tracking-wider">
            The Way We Work
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
            Your Seamless Journey to Solar Energy
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-base sm:text-lg">
            We handle 100% of the heavy lifting so you can enjoy a hassle-free transition to sustainable power.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    {/* Icon inside a circle */}
                    <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-2xl font-black text-gray-300 dark:text-gray-800 group-hover:text-amber-500/20 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
