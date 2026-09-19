import apiClient from './client'

export const environmentAPI = {
  latest: () => apiClient.get('/environment/latest'),
  history: (hours = 24) => apiClient.get(`/environment/history`, { params: { hours } })
}

export type EnvironmentAPI = typeof environmentAPI
