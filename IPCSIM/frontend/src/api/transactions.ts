import apiClient from './client'

export const transactionsAPI = {
  list: (itemId?: number) => apiClient.get('/transactions', { params: { item_id: itemId } })
}

export type TransactionsAPI = typeof transactionsAPI
