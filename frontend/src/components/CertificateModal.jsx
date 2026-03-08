// components/CertificateModal.jsx - Certificate for EOTM and EOTY winners
import React from 'react'
import { Download, X } from 'lucide-react'
import { motion } from 'framer-motion'

export default function CertificateModal({ isOpen, onClose, winner, awardType, monthYear, companyName }) {

  const downloadCertificate = () => {
    const canvas = document.createElement('canvas')
    const w = 1700
    const h = 2200
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')

    // Background
    ctx.fillStyle = '#fffbeb'
    ctx.fillRect(0, 0, w, h)

    // Border
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 16
    ctx.strokeRect(40, 40, w - 80, h - 80)
    ctx.strokeStyle = '#d97706'
    ctx.lineWidth = 4
    ctx.strokeRect(60, 60, w - 120, h - 120)

    // Trophy emoji as text
    ctx.font = '80px serif'
    ctx.textAlign = 'center'
    ctx.fillText('🏆  ⭐  🏆', w / 2, 200)

    // Title
    ctx.fillStyle = '#78350f'
    ctx.font = 'bold 64px Georgia, serif'
    ctx.fillText('Certificate of Excellence', w / 2, 340)

    // Divider line
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(300, 390)
    ctx.lineTo(w - 300, 390)
    ctx.stroke()

    // Award type
    ctx.fillStyle = '#b45309'
    ctx.font = '36px Georgia, serif'
    const awardLabel = awardType === 'eotm' ? 'Employee of the Month' : 'Employee of the Year'
    ctx.fillText(awardLabel, w / 2, 480)

    // "This certifies that"
    ctx.fillStyle = '#d97706'
    ctx.font = '24px Georgia, serif'
    ctx.fillText('This certifies that', w / 2, 620)

    // Winner name
    ctx.fillStyle = '#1e293b'
    ctx.font = 'bold 56px Georgia, serif'
    ctx.fillText(winner || 'Unknown', w / 2, 720)

    // Underline for name
    const nameWidth = ctx.measureText(winner || 'Unknown').width
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo((w - nameWidth) / 2 - 20, 740)
    ctx.lineTo((w + nameWidth) / 2 + 20, 740)
    ctx.stroke()

    // "has been recognized as"
    ctx.fillStyle = '#d97706'
    ctx.font = '24px Georgia, serif'
    ctx.fillText('has been recognized as the outstanding', w / 2, 830)

    // Award title again
    ctx.fillStyle = '#78350f'
    ctx.font = 'bold 40px Georgia, serif'
    ctx.fillText(awardLabel, w / 2, 910)

    // Month/Year
    ctx.fillStyle = '#334155'
    ctx.font = '32px Georgia, serif'
    ctx.fillText(monthYear || '', w / 2, 1000)

    // Company name
    if (companyName) {
      ctx.fillStyle = '#1e293b'
      ctx.font = 'bold 30px Georgia, serif'
      ctx.fillText(`at ${companyName}`, w / 2, 1060)
    }

    // "For outstanding performance"
    ctx.fillStyle = '#b45309'
    ctx.font = 'italic 22px Georgia, serif'
    ctx.fillText('For outstanding performance and contribution to the team ', w / 2, 1120)

    // Bottom divider
    ctx.strokeStyle = '#fbbf24'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(200, 1200)
    ctx.lineTo(w - 200, 1200)
    ctx.stroke()

    // Issue date
    ctx.fillStyle = '#92400e'
    ctx.font = '22px Georgia, serif'
    ctx.fillText(`Issued on ${new Date().toLocaleDateString()}`, w / 2, 1280)

    // Download
    canvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${awardType}-${winner}-certificate.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 'image/png')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-navy-100 p-6">
          <h2 className="text-xl font-bold text-navy-900 flex items-center gap-2">
            🏆 Your Certificate
          </h2>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-navy-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Certificate Preview */}
        <div className="p-6 flex justify-center bg-navy-50/30">
          <div
            className="w-full max-w-xl bg-gradient-to-br from-amber-50 via-white to-amber-50 p-12 shadow-lg border-4 border-amber-400/20 rounded-lg"
            style={{ aspectRatio: '8.5 / 11' }}
          >
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
              <div className="flex gap-2 justify-center mb-4">
                <span className="text-3xl">🏆</span>
                <span className="text-3xl">⭐</span>
                <span className="text-3xl">🏆</span>
              </div>

              <h1 className="text-4xl font-bold text-amber-900 leading-tight">
                Certificate of Excellence
              </h1>

              <p className="text-xl font-semibold text-amber-700">
                {awardType === 'eotm' ? 'Employee of the Month' : 'Employee of the Year'}
              </p>

              <div className="space-y-2 my-6">
                <p className="text-sm text-amber-600 uppercase tracking-widest">This certifies that</p>
                <p className="text-3xl font-bold text-navy-900">{winner}</p>
                <p className="text-sm text-amber-600 uppercase tracking-widest">has been recognized as</p>
              </div>

              <p className="text-lg font-semibold text-navy-700">{monthYear}</p>

              {companyName && (
                <p className="text-lg font-bold text-navy-900">at {companyName}</p>
              )}

              <p className="text-xs text-amber-600 italic mt-6">
                For outstanding performance and contribution
              </p>

              <div className="border-t border-amber-300 pt-4 mt-6 w-full text-xs text-amber-600">
                Issued on {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-navy-100 p-6 flex gap-3 justify-center">
          <button
            onClick={downloadCertificate}
            className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors font-medium text-sm"
          >
            <Download size={16} />
            Download as Image
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-6 py-2.5 border border-navy-200 text-navy-700 rounded-xl hover:bg-navy-50 transition-colors font-medium text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
