import { useQuery, useMutation } from '@tanstack/react-query'
import { inventoryAPI } from '@api/inventory'

export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: () => inventoryAPI.getItems().then((res) => res.data)
  })
}

export const useItem = (id: number) => {
  return useQuery({
    queryKey: ['items', id],
    queryFn: () => inventoryAPI.getItem(id).then((res) => res.data)
  })
}

export const useSearchItems = (query: string) => {
  return useQuery({
    queryKey: ['items', 'search', query],
    queryFn: () => inventoryAPI.searchItems(query).then((res) => res.data),
    enabled: query.length > 0
  })
}

export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => inventoryAPI.getInventory().then((res) => res.data)
  })
}

export const usePickMutation = () => {
  return useMutation({
    mutationFn: (data: any) => inventoryAPI.createPickTransaction(data)
  })
}

export const usePutMutation = () => {
  return useMutation({
    mutationFn: (data: any) => inventoryAPI.createPutTransaction(data)
  })
}
