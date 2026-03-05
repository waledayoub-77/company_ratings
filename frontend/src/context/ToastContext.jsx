import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

const ICONS = {
  success: <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />,
  error:   <AlertCircle  size={18} className="text-red-500 shrink-0" />,
  info:    <Info          size={18} className="text-navy-500 shrink-0" />,
}

const BG = {
  success: 'bg-emerald-50 border-emerald-200',
  error:   'bg-red-50 border-red-200',
  info:    'bg-white border-navy-200',
}

let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const removeToast = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++nextId
    setToasts((prev) => [...prev.slice(-4), { id, message, type }]) // max 5 visible
    timers.current[id] = setTimeout(() => removeToast(id), duration)
    return id
  }, [removeToast])

  const toast = useCallback({
    success: (msg, ms) => addToast(msg, 'success', ms),
    error:   (msg, ms) => addToast(msg, 'error', ms ?? 6000),
    info:    (msg, ms) => addToast(msg, 'info', ms),
  }, [addToast])

  // Make toast callable: toast.success(), toast.error(), toast.info()
  // But we can't make a plain object a callback, so we use a ref-stable object
  const api = useRef(toast)
  api.current = toast

  return (
    <ToastContext.Provider value={api.current}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg ${BG[t.type]}`}
            >
              {ICONS[t.type]}
              <p className="text-sm text-navy-800 flex-1 leading-snug">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-navy-400 hover:text-navy-600 transition-colors shrink-0 mt-0.5"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}
