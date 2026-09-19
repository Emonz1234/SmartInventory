import { create } from 'zustand'
import { User } from '../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void
  canAccess: (requiredRole: string) => boolean
}

const mockUser: User = {
  id: 1,
  username: 'operator',
  role: 'OPERATOR',
  email: 'operator@ipcsim.local'
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: mockUser,
  isAuthenticated: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
  canAccess: (requiredRole: string) => {
    const user = get().user
    if (!user) return false
    
    const roleHierarchy: Record<string, number> = {
      'OPERATOR': 1,
      'SUPERVISOR': 2,
      'MAINTENANCE': 3
    }
    
    return roleHierarchy[user.role] >= roleHierarchy[requiredRole]
  }
}))
