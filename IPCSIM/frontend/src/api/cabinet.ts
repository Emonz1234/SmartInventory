import apiClient from './client'

export const cabinetAPI = {
  list: () => apiClient.get('/cabinets'),
  getRacks: (cabinetId: number) => apiClient.get(`/cabinets/${cabinetId}/racks`),
  openRack: (rackId: number) => apiClient.post(`/racks/${rackId}/open`),
  closeRack: (rackId: number) => apiClient.post(`/racks/${rackId}/close`),
  clearRackBreakdown: (rackId: number) => apiClient.post(`/racks/${rackId}/clear-breakdown`),
  ventilateCabinet: (cabinetId: number) => apiClient.post(`/cabinets/${cabinetId}/ventilate`)
}
