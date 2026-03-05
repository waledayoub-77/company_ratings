// @refresh reset
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { apiLogout, apiGetMe } from '../api/auth'

const AuthContext = createContext(null)

const STORAGE_KEY = 'rh_user'
const ACCESS_KEY  = 'rh_access'
const REFRESH_KEY = 'rh_refresh'

function loadFromStorage() {
  try {
    return {
      user:         JSON.parse(localStorage.getItem(STORAGE_KEY)) || null,
      accessToken:  localStorage.getItem(ACCESS_KEY)  || null,
      refreshToken: localStorage.getItem(REFRESH_KEY) || null,
    }
  } catch {
    return { user: null, accessToken: null, refreshToken: null }
  }
}

export function AuthProvider({ children }) {
  const stored = loadFromStorage()
  const [user, setUser]               = useState(stored.user)
  const [accessToken, setAccessToken] = useState(stored.accessToken)
  const [initializing, setInitializing] = useState(!!stored.accessToken)

  // On every app load with a valid token: refresh user data from server.
  // This ensures fullName, role and other profile fields are always up-to-date
  // even if they were saved while using a different browser/device.
  useEffect(() => {
    if (!stored.accessToken) return
    apiGetMe()
      .then((res) => {
        const fresh = res?.data ?? res?.user ?? res
        if (!fresh?.id) return
        setUser(prev => {
          const merged = { ...(prev ?? {}), ...fresh }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
          return merged
        })
      })
      .catch(() => {
        // Token invalid — wipe storage silently
        localStorage.removeItem(ACCESS_KEY)
        localStorage.removeItem(REFRESH_KEY)
        localStorage.removeItem(STORAGE_KEY)
        setUser(null)
        setAccessToken(null)
      })
      .finally(() => setInitializing(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSession = useCallback(({ user, accessToken, refreshToken }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(ACCESS_KEY,  accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    setUser(user)
    setAccessToken(accessToken)
  }, [])

  const updateUser = useCallback((patch) => {
    setUser(prev => {
      const updated = { ...prev, ...patch }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  const clearSession = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    setUser(null)
    setAccessToken(null)
  }, [])

  const logout = useCallback(async () => {
    try {
      await apiLogout()
    } catch {
      // Swallow — clear session regardless
    } finally {
      clearSession()
    }
  }, [clearSession])

  return (
    <AuthContext.Provider value={{ user, accessToken, initializing, saveSession, updateUser, clearSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
