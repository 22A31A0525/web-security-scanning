import { create } from 'zustand'
import {
  loadBearerToken,
  writeBearerToken,
  clearBearerToken,
} from '../api/auth'

interface User {
  email: string
}

interface AuthState {
  token: string | null
  isAuthenticated: boolean
  user: User | null
  login: (email: string, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: loadBearerToken(),
  isAuthenticated: !!loadBearerToken(),
  user: loadBearerToken() ? { email: 'analyst@security.io' } : null,

  login: (email: string, token: string) => {
    writeBearerToken(token)
    set({
      token,
      isAuthenticated: true,
      user: { email },
    })
  },

  logout: () => {
    clearBearerToken()
    set({
      token: null,
      isAuthenticated: false,
      user: null,
    })
  },
}))
