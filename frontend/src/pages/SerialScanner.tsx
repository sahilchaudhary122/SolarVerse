import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, QrCode, Camera, CheckCircle2, Trash2, RefreshCw } from 'lucide-react'

export function SerialScanner() {
  const [scannedItems, setScannedItems] = useState<Array<{ id: string; serial: string; time: string; type: string }>>([
    { id: '1', serial: 'INV-9982', time: '10:42 AM', type: 'Hybrid Inverter 5kW' },
    { id: '2', serial: 'PAN-4410', time: '10:45 AM', type: 'Monocrystalline Panel' },
  ])
  const [isScanning, setIsScanning] = useState(false)

  const handleMockScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      const mockSerials = [
        { prefix: 'INV', type: 'Hybrid Inverter 10kW' },
        { prefix: 'PAN', type: 'Solar Panel Tier-1' },
        { prefix: 'BAT', type: 'Lithium Battery 5kWh' },
        { prefix: 'EV', type: 'EV Smart Charger' },
      ]
      const randomItem = mockSerials[Math.floor(Math.random() * mockSerials.length)]
      const randomNum = Math.floor(1000 + Math.random() * 9000)
      const newSerial = {
        id: Date.now().toString(),
        serial: `${randomItem.prefix}-${randomNum}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: randomItem.type,
      }
      setScannedItems((prev) => [newSerial, ...prev])
      setIsScanning(false)
    }, 800)
  }

  const handleDelete = (id: string) => {
    setScannedItems((prev) => prev.filter((item) => item.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center space-x-3">
          <Link to="/dashboard" className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
            <QrCode className="w-6 h-6" />
          </div>
          <span className="text-xl font-black tracking-tight">Serial Scanner & Barcode Telemetry</span>
        </div>
        <Link 
          to="/" 
          className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-semibold transition"
        >
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 sm:p-10 space-y-8">
        {/* Scanner Viewport Box */}
        <div className="glass-panel p-8 rounded-3xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="max-w-md mx-auto space-y-3">
            <h2 className="text-2xl font-black">Barcode & QR Scanner</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Point your camera at the hardware serial tag or barcode sticker to instantly log inventory items for installation.
            </p>
          </div>

          {/* Camera Viewfinder Box */}
          <div className="w-full max-w-md h-64 mx-auto rounded-2xl border-2 border-dashed border-brand/50 dark:border-brand/40 bg-brand/5 flex flex-col items-center justify-center relative shadow-inner">
            {isScanning ? (
              <div className="flex flex-col items-center space-y-3 animate-pulse">
                <RefreshCw className="w-10 h-10 text-brand animate-spin" />
                <span className="text-sm font-bold text-brand dark:text-brand">Scanning barcode...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow">
                  <Camera className="w-8 h-8" />
                </div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Camera Viewfinder Active</span>
                <span className="text-xs text-gray-400">Align barcode within the frame</span>
              </div>
            )}
            
            {/* Corner Markers */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-brand" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-brand" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-brand" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-brand" />
          </div>

          <div className="pt-2">
            <button
              onClick={handleMockScan}
              disabled={isScanning}
              className="px-8 py-4 bg-brand hover:bg-brand-strong text-white dark:text-gray-950 font-bold rounded-2xl shadow-lg hover:shadow-[0_0_20px_color-mix(in_srgb,var(--sv-brand)_40%,transparent)] transition-all disabled:opacity-50 text-base flex items-center justify-center gap-2 mx-auto"
            >
              <Camera className="w-5 h-5" />
              <span>Start Camera Scan</span>
            </button>
          </div>
        </div>

        {/* Scanned Serials List */}
        <div className="glass-panel p-6 sm:p-8 rounded-3xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/50 dark:border-gray-800">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-brand" /> Scanned Serials ({scannedItems.length})
            </h3>
            <span className="text-xs text-gray-500">Logged to current site manifest</span>
          </div>

          {scannedItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <QrCode className="w-12 h-12 mx-auto opacity-40" />
              <p className="font-semibold">No serials scanned yet</p>
              <p className="text-xs">Click "Start Camera Scan" above to simulate scanning items.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scannedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white/50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 hover:border-brand/50 transition shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand font-black">
                      {item.serial.substring(0, 3)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-base tracking-wide font-mono">{item.serial}</span>
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success dark:text-success text-xs font-bold">
                          Verified
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.type} • Scanned at {item.time}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default SerialScanner
