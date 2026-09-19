// User & Auth
export interface User {
  id: number
  username: string
  role: 'OPERATOR' | 'SUPERVISOR' | 'MAINTENANCE'
  email?: string
}

// Inventory
export interface Item {
  id: number
  item_code: string
  item_name: string
  unit: string
  min_qty: number
  max_qty: number
}

export interface ItemLocation {
  id: number
  item_id: number
  bin_id: number
  quantity: number
  updated_at: string
}

export interface InventoryItem {
  item_id: number
  item_code: string
  item_name: string
  total_quantity: number
  locations: ItemLocation[]
}

export interface Bin {
  id: number
  bin_code: string
  bin_name?: string
  capacity: number
}

// Cabinet & Hardware
export interface Cabinet {
  id: number
  cabinet_code: string
  cabinet_name?: string
  status: string
}

export interface Rack {
  id: number
  cabinet_id: number
  rack_code: string
  rack_name?: string
  status?: string
  position?: number
  last_updated?: string
}

// Environment
export interface EnvironmentData {
  rack_id: number
  temperature: number
  humidity: number
  weight: number
  smoke_detected: number
  created_at: string
}

// Operations
export interface OperationSnapshot {
  id: number
  rack_id: number
  movement_speed: number
  displacement: number
  is_hard_locked: number
  is_endpoint: number
  state?: number
  created_at: string
}

// Transactions
export interface InventoryTransaction {
  id: number
  item_id: number
  item_code?: string
  item_name?: string
  transaction_type: 'PICK' | 'PUT' | 'ADJUST' | 'INITIAL'
  quantity: number
  reference_no?: string
  user_id?: number
  created_at: string
}

// System Status
export interface SystemStatus {
  serial_connected: boolean
  simulation_online: boolean
  database_healthy: boolean
  server_synced: boolean
  last_sync_time?: string
}
