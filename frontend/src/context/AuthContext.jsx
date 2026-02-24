import { createContext, useContext, useState, useCallback } from 'react'

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

  return (
    <AuthContext.Provider value={{ user, accessToken, saveSession, clearSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
