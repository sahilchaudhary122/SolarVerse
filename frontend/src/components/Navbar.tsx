import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useDarkMode } from '../hooks/useDarkMode'
import { Sun, Moon, Menu, X } from 'lucide-react'

export function Navbar() {
  const { isDarkMode, toggleDarkMode } = useDarkMode()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false)
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <nav id="home" className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-50 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand dark:text-brand">
            <Sun className="w-6 h-6 animate-spin-slow" />
          </div>
          <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-1">
            Solar<span className="text-brand dark:text-brand">Verse</span>
          </span>
        </div>

        {/* Center Links */}
        <div className="hidden md:flex items-center space-x-8">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand transition"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand transition"
          >
            About Us
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand transition"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection('projects')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand transition"
          >
            Projects
          </button>
          <button
            onClick={() => scrollToSection('enquiry-form')}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand dark:hover:text-brand transition"
          >
            Contact
          </button>
        </div>

        {/* Right Side: Dark Mode Toggle + Login to App + CTA */}
        <div className="hidden md:flex items-center space-x-3">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-brand" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          <Link
            to="/login"
            className="px-4 py-2.5 border border-brand text-brand dark:text-brand hover:bg-brand hover:text-white dark:hover:text-gray-950 font-semibold text-sm rounded-xl transition-all duration-300 shadow-sm"
          >
            Login to App
          </Link>
          <button
            onClick={() => scrollToSection('enquiry-form')}
            className="px-6 py-2.5 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-semibold text-sm rounded-xl shadow-md hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
          >
            Get a Quote
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex items-center space-x-2 md:hidden">
          <button
            type="button"
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-brand" /> : <Moon className="w-5 h-5 text-gray-700" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden px-4 pt-2 pb-6 space-y-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-xl">
          <button
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }}
            className="block w-full text-left py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-brand"
          >
            Home
          </button>
          <button
            onClick={() => scrollToSection('about')}
            className="block w-full text-left py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-brand"
          >
            About Us
          </button>
          <button
            onClick={() => scrollToSection('services')}
            className="block w-full text-left py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-brand"
          >
            Services
          </button>
          <button
            onClick={() => scrollToSection('projects')}
            className="block w-full text-left py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-brand"
          >
            Projects
          </button>
          <button
            onClick={() => scrollToSection('enquiry-form')}
            className="block w-full text-left py-2 text-base font-semibold text-gray-700 dark:text-gray-200 hover:text-brand"
          >
            Contact
          </button>
          <div className="pt-2 space-y-2">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full py-3 border border-brand text-brand dark:text-brand font-semibold rounded-xl text-center hover:bg-brand hover:text-white dark:hover:text-gray-950 transition-all duration-300"
            >
              Login to App
            </Link>
            <button
              onClick={() => scrollToSection('enquiry-form')}
              className="w-full py-3 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-semibold rounded-xl shadow-md text-center hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
            >
              Get a Quote
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
