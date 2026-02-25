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

  // Rehydrate user from server on first load (validates token is still active)
  useEffect(() => {
    if (stored.accessToken && !stored.user) {
      apiGetMe()
        .then((data) => {
          setUser(data.data ?? data.user ?? data)
        })
        .catch(() => {
          // Token invalid — wipe storage silently
          localStorage.removeItem(ACCESS_KEY)
          localStorage.removeItem(REFRESH_KEY)
          localStorage.removeItem(STORAGE_KEY)
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveSession = useCallback(({ user, accessToken, refreshToken }) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    localStorage.setItem(ACCESS_KEY,  accessToken)
    localStorage.setItem(REFRESH_KEY, refreshToken)
    setUser(user)
    setAccessToken(accessToken)
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
    <AuthContext.Provider value={{ user, accessToken, saveSession, clearSession, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
