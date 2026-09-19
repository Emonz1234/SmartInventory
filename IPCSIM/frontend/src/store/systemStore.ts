import { create } from 'zustand'
import { SystemStatus } from '../types'

interface SystemState {
  status: SystemStatus
  updateStatus: (status: Partial<SystemStatus>) => void
  isLoading: boolean
  setLoading: (loading: boolean) => void
}

const initialStatus: SystemStatus = {
  serial_connected: false,
  simulation_online: false,
  database_healthy: true,
  server_synced: false
}

export const useSystemStore = create<SystemState>((set) => ({
  status: initialStatus,
  updateStatus: (updates) => set((state) => ({
    status: { ...state.status, ...updates }
  })),
  isLoading: false,
  setLoading: (loading) => set({ isLoading: loading })
}))
