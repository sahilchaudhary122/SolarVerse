import { FolderCheck, Users, SunMedium, UserCheck } from 'lucide-react'

export function StatsSection() {
  const stats = [
    {
      icon: FolderCheck,
      value: '12k+',
      label: 'Projects',
      description: 'Successfully completed residential & commercial installations.',
    },
    {
      icon: Users,
      value: '40K',
      label: 'Satisfied Clients',
      description: 'Happy homeowners enjoying reliable clean energy.',
    },
    {
      icon: SunMedium,
      value: '86M+',
      label: 'Panels Installed',
      description: 'High-efficiency tier-1 photovoltaic panels deployed.',
    },
    {
      icon: UserCheck,
      value: '1k+',
      label: 'Team Members',
      description: 'NABCEP certified engineers & solar consultants.',
    },
  ]

  return (
    <section className="py-20 bg-amber-500 dark:bg-gray-900 transition-colors text-gray-900 dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <div
                key={index}
                className="bg-amber-400/50 dark:bg-gray-800 border border-amber-300/40 dark:border-gray-700 rounded-3xl p-8 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-amber-500/10 flex items-center justify-center text-gray-900 dark:text-amber-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-7 h-7" />
                  </div>
                  <span className="text-3xl sm:text-4xl font-black tracking-tight">
                    {stat.value}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold mb-1">
                    {stat.label}
                  </h3>
                  <p className="text-gray-800 dark:text-gray-300 text-xs sm:text-sm leading-relaxed">
                    {stat.description}
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
