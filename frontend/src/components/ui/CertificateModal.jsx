// Feature 9: Certificate Modal Component
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Download, Printer, Loader2 } from 'lucide-react'
import html2canvas from 'html2canvas'

export default function CertificateModal({ employeeName, award, year, companyName, onClose }) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async () => {
    setIsDownloading(true)
    try {
      const element = document.getElementById('certificate-content')
      if (!element) return
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${companyName}-${award}-${year}.png`
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    const element = document.getElementById('certificate-content')
    if (!element) return
    const printWindow = window.open('', '', 'height=600,width=800')
    printWindow.document.write(element.innerHTML)
    printWindow.document.close()
    printWindow.print()
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl overflow-hidden max-w-2xl w-full shadow-2xl"
        >
          {/* Header with close + actions */}
          <div className="flex items-center justify-between p-6 border-b border-navy-100">
            <h2 className="text-lg font-bold text-navy-900">Certificate</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2 hover:bg-navy-50 rounded-lg transition-all disabled:opacity-50 text-navy-600"
                title="Download as PNG"
              >
                {isDownloading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Download size={20} />
                )}
              </button>
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-navy-50 rounded-lg transition-all text-navy-600"
                title="Print"
              >
                <Printer size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-navy-50 rounded-lg transition-all text-navy-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Certificate container */}
          <div className="p-8 bg-ice-50">
            <div
              id="certificate-content"
              className="bg-gradient-to-br from-amber-50 to-orange-50 border-4 border-double border-amber-900 rounded-2xl p-12 text-center shadow-lg"
              style={{ aspectRatio: '1.4', minHeight: '320px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
            >
              {/* Decorative top accent */}
              <div className="mb-6">
                <div className="inline-block px-4 py-2 border-b-2 border-amber-900 mb-6">
                  <span className="text-xs tracking-widest text-amber-800 font-semibold uppercase">Certificate of Achievement</span>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col justify-center items-center">
                <h1 className="text-4xl font-serif text-amber-900 mb-2">
                  This is to certify that
                </h1>
                <div className="text-3xl font-bold text-amber-950 mb-6 border-b-2 border-amber-900 pb-2 px-8">
                  {employeeName}
                </div>

                <p className="text-sm text-amber-800 mb-2">has been recognized as</p>
                <h2 className="text-2xl font-serif text-amber-900 mb-6 italic">
                  {award}
                </h2>
                <p className="text-sm text-amber-800 mb-1">at</p>
                <p className="text-lg font-semibold text-amber-950 mb-8">
                  {companyName}
                </p>
                <p className="text-sm text-amber-800 mb-12">for the year</p>
                <p className="text-2xl font-bold text-amber-900">{year}</p>
              </div>

              {/* Footer */}
              <div className="text-xs text-amber-700 mt-6">
                <p>Awarded with distinction</p>
                <p className="mt-1">RateHub Platform</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
