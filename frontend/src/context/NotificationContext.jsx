// components/NotificationContext.jsx - Soft message notification system
import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle , Info, AlertTriangle } from 'lucide-react'

const NotificationContext = createContext()

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    const notification = { id, message, type, duration }
    setNotifications(prev => [...prev, notification])

    if (duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id))
      }, duration)
    }

    return id
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <NotificationStack notifications={notifications} onRemove={removeNotification} />
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

function NotificationStack({ notifications, onRemove }) {
  const getIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} />
      case 'error': return <AlertCircle size={16} />
      case 'warning': return <AlertTriangle size={16} />
      default: return <Info size={16} />
    }
  }

  const getStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-50 border-emerald-200 text-emerald-700'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-700'
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700'
      default:
        return 'bg-navy-50 border-navy-200 text-navy-700'
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className={`pointer-events-auto flex items-center gap-2.5 rounded-xl border px-4 py-3 backdrop-blur-sm max-w-sm text-sm font-medium ${getStyles(notif.type)}`}
          >
            <div className="flex-shrink-0">{getIcon(notif.type)}</div>
            <div className="flex-1">{notif.message}</div>
            <button
              onClick={() => onRemove(notif.id)}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
