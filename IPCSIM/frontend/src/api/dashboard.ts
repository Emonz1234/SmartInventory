import apiClient from './client'

export const dashboardAPI = {
  getSummary: () => apiClient.get('/dashboard/summary')
}

export type DashboardAPI = typeof dashboardAPI
