import apiClient from './client'

export const itemsAPI = {
  list: () => apiClient.get('/items'),
  search: (q: string) => apiClient.get('/items/search', { params: { q } }),
  get: (id: number) => apiClient.get(`/items/${id}`),
  create: (data: any) => apiClient.post('/items', data),
  update: (id: number, data: any) => apiClient.put(`/items/${id}`, data),
  remove: (id: number) => apiClient.delete(`/items/${id}`),
  pick: (data: any) => apiClient.post('/transactions/pick', data),
  put: (data: any) => apiClient.post('/transactions/put', data)
}

export type ItemsAPI = typeof itemsAPI
