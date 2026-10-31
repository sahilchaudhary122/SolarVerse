import { CheckCircle2, Award } from 'lucide-react'

export function WhyChooseUs() {
  const points = [
    {
      title: 'Top Tier Panels & Equipment',
      description: 'We partner exclusively with tier-1 manufacturers to provide high-efficiency monocrystalline panels and industry-leading inverters.',
    },
    {
      title: 'Certified Master Installers',
      description: 'Our team consists of NABCEP-certified technicians who adhere to rigorous safety and structural engineering standards.',
    },
    {
      title: '25-Year Comprehensive Warranty',
      description: 'Enjoy complete peace of mind with our industry-leading 25-year product, performance, and workmanship warranty.',
    },
    {
      title: 'Zero-Down Financing Options',
      description: 'Start saving from day one with flexible $0-down solar loans, power purchase agreements (PPAs), and turnkey cash rebates.',
    },
  ]

  return (
    <section id="why-choose-us" className="py-24 bg-white dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Image */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800">
              <img
                src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2072&auto=format&fit=crop"
                alt="Solar technicians installing panels"
                className="w-full h-64 sm:h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/60 via-transparent to-transparent" />
              
              {/* Floating Badge */}
              <div className="absolute bottom-6 left-6 right-6 p-6 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-2xl border border-white/20 dark:border-gray-800 flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-brand flex items-center justify-center text-white dark:text-gray-950 font-bold shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-bold text-base">Award-Winning Excellence</p>
                  <p className="text-gray-600 dark:text-gray-400 text-xs">Recognized for superior customer service & technical craftsmanship.</p>
                </div>
              </div>
            </div>

            {/* Decorative background glow */}
            <div className="absolute -top-6 -left-6 w-72 h-72 bg-brand/10 rounded-full blur-3xl -z-10" />
          </div>

          {/* Right Column: Text & Checkmark list */}
          <div>
            <span className="text-brand dark:text-brand font-semibold text-sm uppercase tracking-wider">
              Why Choose SolarVerse
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight mb-6">
              Engineered for Maximum Savings & Durability
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed mb-8">
              We combine cutting-edge technology with meticulous craftsmanship to ensure your solar investment performs flawlessly for decades.
            </p>

            <div className="space-y-6">
              {points.map((point, index) => (
                <div 
                  key={index} 
                  className="flex items-start space-x-4 p-4 rounded-2xl hover:bg-brand-soft/50 dark:hover:bg-brand-soft/20 transition-all duration-200 group cursor-pointer"
                >
                  <div className="mt-1 shrink-0 group-hover:scale-125 transition-transform duration-200">
                    <CheckCircle2 className="w-6 h-6 text-brand dark:text-brand" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand dark:group-hover:text-brand transition-colors">
                      {point.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {point.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
