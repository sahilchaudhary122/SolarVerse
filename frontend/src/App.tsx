import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Navbar } from './components/Navbar'
import { Hero } from './components/Hero'
import { AboutSection } from './components/AboutSection'
import { ServicesSection } from './components/ServicesSection'
import { StatsSection } from './components/StatsSection'
import { ProcessSection } from './components/ProcessSection'
import { ProjectsSection } from './components/ProjectsSection'
import { EnquiryForm } from './features/enquiry/EnquiryForm'
import { Dashboard } from './pages/Dashboard'
import { QuoteBuilder } from './pages/QuoteBuilder'
import { SerialScanner } from './pages/SerialScanner'
import { InstallationForm } from './pages/InstallationForm'
import { WarrantyLookup } from './pages/WarrantyLookup'
import { SupportTickets } from './pages/SupportTickets'
import { Sun } from 'lucide-react'

const queryClient = new QueryClient()

function LandingPage() {
  return (
    <main className="flex-1">
      <Hero />
      <AboutSection />
      <ServicesSection />
      <StatsSection />
      <ProcessSection />
      <ProjectsSection />
      <EnquiryForm />
    </main>
  )
}

function Footer() {
  return (
    <footer className="bg-gray-950 text-white py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-2">
          <span className="text-xl font-black tracking-tight flex items-center gap-2">
            <Sun className="w-6 h-6 text-amber-500" /> <span className="text-amber-500">SolarVerse</span>
          </span>
        </div>
        <p className="text-sm text-gray-400 text-center md:text-left">
          © {new Date().getFullYear()} SolarVerse Inc. All rights reserved. Empowering a cleaner, sustainable future.
        </p>
        <div className="flex space-x-6 text-sm text-gray-400">
          <a href="#about" className="hover:text-amber-400 transition">About</a>
          <a href="#services" className="hover:text-amber-400 transition">Services</a>
          <a href="#projects" className="hover:text-amber-400 transition">Projects</a>
          <Link to="/quote-builder" className="hover:text-amber-400 transition">Quote Builder</Link>
          <Link to="/dashboard" className="hover:text-amber-400 transition">Dashboard</Link>
        </div>
      </div>
    </footer>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors">
          <Routes>
            <Route path="/" element={<><Navbar /><LandingPage /><Footer /></>} />
            <Route path="/quote-builder" element={<QuoteBuilder />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/scanner" element={<SerialScanner />} />
            <Route path="/dashboard/installation" element={<InstallationForm />} />
            <Route path="/dashboard/warranty" element={<WarrantyLookup />} />
            <Route path="/dashboard/tickets" element={<SupportTickets />} />
          </Routes>
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
