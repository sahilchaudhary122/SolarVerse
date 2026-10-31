import { MessageSquare, PenTool, Wrench, Zap } from 'lucide-react'

export function Process() {
  const steps = [
    {
      step: '01',
      icon: MessageSquare,
      title: 'Consultation',
      description: 'We analyze your energy bills and roof layout to design a customized solar proposal.',
    },
    {
      step: '02',
      icon: PenTool,
      title: 'Custom Design',
      description: 'Our engineers draft precise blueprints and handle all municipal permits and paperwork.',
    },
    {
      step: '03',
      icon: Wrench,
      title: 'Expert Installation',
      description: 'NABCEP-certified technicians install your system cleanly and efficiently within 1-2 days.',
    },
    {
      step: '04',
      icon: Zap,
      title: 'Activation',
      description: 'System inspection, utility interconnection, and you start generating clean free energy!',
    },
  ]

  return (
    <section className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-sm uppercase tracking-wider">
            Simple 4-Step Journey
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
            How You Go Solar with Us
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-base sm:text-lg">
            We handle 100% of the heavy lifting so you can enjoy a seamless, stress-free transition to clean energy.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => {
            const Icon = item.icon
            return (
              <div
                key={index}
                className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm hover:shadow-xl dark:shadow-none dark:border dark:border-gray-800 transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="text-2xl font-black text-gray-200 dark:text-gray-800 group-hover:text-emerald-500/20 transition-colors">
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
