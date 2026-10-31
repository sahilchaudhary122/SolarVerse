import { ArrowRight, MapPin } from 'lucide-react'

export function ProjectsSection() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const projects = [
    {
      title: 'Lodha Paradise Estate',
      location: 'Mumbai, Maharashtra',
      capacity: '12.5 kW System + Battery',
      image: 'https://images.unsplash.com/photo-1592833159155-c62df1b65634?q=80&w=800&auto=format&fit=crop',
    },
    {
      title: 'Prestige Tech Park',
      location: 'Bengaluru, Karnataka',
      capacity: '150 kW Rooftop Array',
      image: 'https://images.unsplash.com/photo-1592833159155-c62df1b65634?q=80&w=2070&auto=format&fit=crop',
    },
    {
      title: 'Jaipur Heritage Villa',
      location: 'Jaipur, Rajasthan',
      capacity: '18 kW Hybrid Setup',
      image: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?q=80&w=2072&auto=format&fit=crop',
    },
  ]

  return (
    <section id="projects" className="py-24 bg-gray-50 dark:bg-gray-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-amber-600 dark:text-amber-400 font-semibold text-sm uppercase tracking-wider">
            Our Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mt-2 tracking-tight">
            Featured Solar Installations
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-4 text-base sm:text-lg">
            Discover how homes and businesses across India are transforming their energy independence with SolarVerse.
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <div
              key={index}
              onClick={() => scrollToSection('enquiry-form')}
              className="bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800 hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-amber-500 text-gray-900 font-semibold text-xs rounded-full shadow-md">
                    {project.capacity}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400 text-xs font-semibold mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{project.location}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    {project.title}
                  </h3>
                </div>
              </div>

              <div className="px-6 pb-6 pt-0 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  View Case Study
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-gray-900 transition-all">
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
