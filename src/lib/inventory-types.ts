export type InventoryItemWithSubTypes = {
  id: string
  name: string
  category: string
  unitType: string
  subTypes: string
  createdAt: Date
  updatedAt: Date
}

export type EntryWithItem = {
  id: string
  itemId: string
  type: string
  qty: number
  unit: string
  remarks: string | null
  box: string | null
  date: Date
  createdAt: Date
  updatedAt: Date
  item: InventoryItemWithSubTypes
}

// Inward types
export const INWARD_TYPES = [
  'From Production Unit',
  'Purchase',
  'RTO',
  'Damaged - From Production Unit',
] as const

// Outward types
export const OUTWARD_TYPES = [
  'Prepaid Orders',
  'Customer Care',
  'COD - Speed Post',
  'COD - Business Parcel',
  'Bluedart',
  'Amazon',
  'Meesho',
  'Sample',
  'Damaged',
  'Offline Sales',
  'Sent to Tiruchengode',
  'Used for Repacking',
  'Consumed',
] as const

// Units
export const UNITS = ['Pack', 'Pc', 'Box', 'Roll'] as const

// Categories
export const CATEGORIES = ['Health', 'Cover', 'Packaging', 'Consumable', 'Equipment'] as const

// Format date for display - deterministic to avoid hydration mismatches
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Format timestamp - deterministic
export function formatTimestamp(date: Date | string): string {
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  const secs = String(d.getSeconds()).padStart(2, '0')
  return `${day} ${month} ${year}, ${hours}:${mins}:${secs}`
}

// Get today's date in YYYY-MM-DD format (deterministic for initial state)
export function getTodayString(): string {
  if (typeof window !== 'undefined') {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  }
  return '2026-01-01' // SSR fallback - will be corrected on client
}
