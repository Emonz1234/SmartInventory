import apiClient from './client'
import { SystemStatus } from '../types'

export const systemAPI = {
  getSerialStatus: () => apiClient.get('/serial/status'),
  getSystemHealth: () => apiClient.get<SystemStatus>('/system/health'),
  getEnvironmentData: (limit?: number) => apiClient.get('/telemetry/environment', { params: { limit } }),
  getOperationData: (limit?: number) => apiClient.get('/telemetry/operation', { params: { limit } }),
  getBreakdownData: (limit?: number) => apiClient.get('/telemetry/breakdown', { params: { limit } }),
  getBreakdownStatus: (rackId: number) => apiClient.get(`/telemetry/breakdown/${rackId}/latest`)
}
