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

// Per-item inward types (matches Inventory_1.xlsx exactly)
export const ITEM_INWARD_TYPES: Record<string, string[]> = {
  'Aurawill Health Mix':    ['From Production Unit', 'RTO'],
  'Aurawill Cover':         ['Purchase', 'Damaged - From Production Unit'],
  '50 Pcs Carton Box':      ['From Production Unit', 'Purchase'],
  '1 Pc Cover (6.5*11)':   ['Purchase'],
  '2 Pcs Carton Box':       ['Purchase'],
  '4 Pcs Carton Box':       ['Purchase'],
  '24 Pcs Amazon Box':      ['Purchase'],
  'Wax Ribbon Roll':        ['Purchase'],
  'Label Roll (500 Pcs)':   ['Purchase'],
  'Aurawill Tape':          ['Purchase'],
  'Batch Printer Catridge': ['Purchase'],
  '8*12 Cover':             ['Purchase'],
  'Cello Tape 3"':          ['Purchase'],
  '10*12 Cover':            ['Purchase'],
}

// Per-item outward types (matches Inventory_1.xlsx exactly)
export const ITEM_OUTWARD_TYPES: Record<string, string[]> = {
  'Aurawill Health Mix':    ['Prepaid Orders', 'Customer Care', 'COD - Speed Post', 'COD - Business Parcel', 'Bluedart', 'Amazon', 'Meesho', 'Sample', 'Damaged', 'Offline Sales', 'Sent to Tiruchengode'],
  'Aurawill Cover':         ['Sent to Tiruchengode', 'Used for Repacking', 'Damaged'],
  '50 Pcs Carton Box':      ['Sent to Tiruchengode', 'Damaged'],
  '1 Pc Cover (6.5*11)':   ['Consumed'],
  '2 Pcs Carton Box':       ['Consumed'],
  '4 Pcs Carton Box':       ['Consumed'],
  '24 Pcs Amazon Box':      ['Consumed'],
  'Wax Ribbon Roll':        ['Consumed'],
  'Label Roll (500 Pcs)':   ['Consumed'],
  'Aurawill Tape':          ['Consumed'],
  'Batch Printer Catridge': ['Sent to Tiruchengode', 'Consumed'],
  '8*12 Cover':             ['Consumed'],
  'Cello Tape 3"':          ['Consumed'],
  '10*12 Cover':            ['Consumed'],
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
