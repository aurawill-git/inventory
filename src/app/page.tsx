'use client'

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip as UiTooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'
import {
  BarChart3,
  PackagePlus,
  PackageMinus,
  Archive,
  LayoutDashboard,
  Plus,
  Trash2,
  Edit3,
  Save,
  X,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  Settings,
  Download,
  ArrowUpDown,
  Search,
  Sun,
  Moon,
  Check,
  Copy,
  Rows3,
  ChevronRight,
  Menu,
  Activity,
  FileBarChart2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from 'recharts'
import {
  INWARD_TYPES,
  OUTWARD_TYPES,
  ITEM_INWARD_TYPES,
  ITEM_OUTWARD_TYPES,
  UNITS,
  CATEGORIES,
  type EntryWithItem,
  type InventoryItemWithSubTypes,
  formatDate,
  formatTimestamp,
} from '@/lib/inventory-types'
import * as XLSX from 'xlsx'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#a855f7']

type Item = InventoryItemWithSubTypes
type Entry = EntryWithItem

interface ReportRow {
  itemId: string
  itemName: string
  category: string
  unit: string
  inward: number
  outward: number
  expectedClosing: number
  closingRecorded: number
  variance: number
  status: 'matched' | 'surplus' | 'shortage' | 'no_closing' | 'no_movement'
  inwardByType: Record<string, number>
  outwardByType: Record<string, number>
  closingByType: Record<string, number>
}

interface ReportData {
  rows: ReportRow[]
  summary: {
    total: number
    matched: number
    surplus: number
    shortage: number
    no_closing: number
    no_movement: number
    totalVariance: number
  }
}

// Hook to avoid hydration mismatch
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  return mounted
}

function useTodayString(mounted: boolean) {
  return mounted ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` : ''
}

interface QuickRow {
  id: string
  itemId: string
  type: string
  qty: string
  unit: string
  remarks: string
  box: string
}

function newQuickRow(counter: number): QuickRow {
  return { id: `qr-${counter}`, itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', box: '' }
}

type TabId = 'dashboard' | 'inwards' | 'outwards' | 'closing' | 'analytics' | 'products' | 'report'

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType; color: string; description: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-slate-600 dark:text-slate-400', description: 'Overview & KPIs' },
  { id: 'inwards', label: 'Inwards', icon: PackagePlus, color: 'text-emerald-600 dark:text-emerald-400', description: 'Stock received' },
  { id: 'outwards', label: 'Outwards', icon: PackageMinus, color: 'text-red-500 dark:text-red-400', description: 'Stock dispatched' },
  { id: 'closing', label: 'Closing', icon: Archive, color: 'text-amber-600 dark:text-amber-400', description: 'End-of-day stock' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, color: 'text-violet-600 dark:text-violet-400', description: 'Charts & trends' },
  { id: 'products', label: 'Products', icon: Package, color: 'text-cyan-600 dark:text-cyan-400', description: 'Item catalogue' },
  { id: 'report', label: 'Report', icon: FileBarChart2, color: 'text-rose-600 dark:text-rose-400', description: 'Reconciliation' },
]

function StatCard({ label, value, icon: Icon, gradient, change, description }: { label: string; value: number; icon: React.ElementType; gradient: string; change?: string; description?: string }) {
  return (
    <TooltipProvider>
      <UiTooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <Card className="relative overflow-hidden border-0 shadow-sm cursor-help">
            <div className={`absolute inset-0 opacity-[0.07] ${gradient}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-3xl font-bold text-foreground leading-none">{value.toLocaleString()}</p>
                  {change && <p className="text-xs text-muted-foreground mt-1.5">{change}</p>}
                </div>
                <div className={`h-10 w-10 rounded-xl ${gradient} flex items-center justify-center shadow-sm`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        {description && (
          <TooltipContent className="max-w-[200px] text-xs py-2 px-3 rounded-lg shadow-lg border-slate-200 dark:border-slate-800">
            {description}
          </TooltipContent>
        )}
      </UiTooltip>
    </TooltipProvider>
  )
}

export default function InventoryApp() {
  const mounted = useMounted()
  const todayStr = useTodayString(mounted)

  const [activeTab, setActiveTab] = useState<TabId>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [inwardEntries, setInwardEntries] = useState<Entry[]>([])
  const [outwardEntries, setOutwardEntries] = useState<Entry[]>([])
  const [closingEntries, setClosingEntries] = useState<Entry[]>([])
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [report, setReport] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [compactMode, setCompactMode] = useState(false)

  const [inwardDateFilter, setInwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [outwardDateFilter, setOutwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [reportDateFilter, setReportDateFilter] = useState<{ start: string; end: string; closingDate: string }>({ start: '', end: '', closingDate: '' })
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [closingDate, setClosingDate] = useState('')

  const [inwardRows, setInwardRows] = useState<QuickRow[]>([])
  const [inwardEntryDate, setInwardEntryDate] = useState('')
  const [outwardRows, setOutwardRows] = useState<QuickRow[]>([])
  const [outwardEntryDate, setOutwardEntryDate] = useState('')
  const [closingRows, setClosingRows] = useState<QuickRow[]>([])
  const [closingEntryDate, setClosingEntryDate] = useState('')

  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [itemForm, setItemForm] = useState({ id: '', name: '', category: 'Health', unitType: 'Pack', subTypes: '' })
  const [isEditingItem, setIsEditingItem] = useState(false)

  const [datesInitialized, setDatesInitialized] = useState(false)

  // Initialize rows and dates on mount
  useEffect(() => {
    if (mounted && !datesInitialized) {
      setDatesInitialized(true)
      const t = todayStr || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`
      setClosingDate(t)
      setInwardEntryDate(t)
      setOutwardEntryDate(t)
      setClosingEntryDate(t)

      setInwardRows([newQuickRow(1)])
      setOutwardRows([newQuickRow(1)])
      setClosingRows([newQuickRow(1)])
    }
  }, [mounted, datesInitialized, todayStr])

  const [refreshKey, setRefreshKey] = useState(0)
  const refreshData = useCallback(() => setRefreshKey(k => k + 1), [])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const iParams = new URLSearchParams()
        if (inwardDateFilter.start) iParams.set('startDate', inwardDateFilter.start)
        if (inwardDateFilter.end) iParams.set('endDate', inwardDateFilter.end)
        const oParams = new URLSearchParams()
        if (outwardDateFilter.start) oParams.set('startDate', outwardDateFilter.start)
        if (outwardDateFilter.end) oParams.set('endDate', outwardDateFilter.end)
        const cParams = new URLSearchParams()
        if (closingDate) cParams.set('date', closingDate)
        const aParams = new URLSearchParams()
        if (analyticsDateFilter.start) aParams.set('startDate', analyticsDateFilter.start)
        if (analyticsDateFilter.end) aParams.set('endDate', analyticsDateFilter.end)

        const rParams = new URLSearchParams()
        if (reportDateFilter.start) rParams.set('startDate', reportDateFilter.start)
        if (reportDateFilter.end) rParams.set('endDate', reportDateFilter.end)
        if (reportDateFilter.closingDate) rParams.set('closingDate', reportDateFilter.closingDate)

        const [itemsRes, inwardsRes, outwardsRes, closingRes, analyticsRes, reportRes] = await Promise.all([
          fetch('/api/items'),
          fetch(`/api/inwards?${iParams}`),
          fetch(`/api/outwards?${oParams}`),
          fetch(`/api/closing?${cParams}`),
          fetch(`/api/analytics?${aParams}`),
          fetch(`/api/report?${rParams}`),
        ])
        if (itemsRes.ok) setItems(await itemsRes.json())
        if (inwardsRes.ok) setInwardEntries(await inwardsRes.json())
        if (outwardsRes.ok) setOutwardEntries(await outwardsRes.json())
        if (closingRes.ok) setClosingEntries(await closingRes.json())
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
        if (reportRes.ok) setReport(await reportRes.json())
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [refreshKey, inwardDateFilter, outwardDateFilter, closingDate, analyticsDateFilter, reportDateFilter])

  useEffect(() => {
    if (!mounted) return
    const seedIfEmpty = async () => {
      try {
        const res = await fetch('/api/items')
        if (res.ok) {
          const existing = await res.json()
          if (existing.length === 0) {
            const seedRes = await fetch('/api/seed', { method: 'POST' })
            if (seedRes.ok) { toast({ title: 'Sample data loaded' }); refreshData() }
          }
        }
      } catch (e) { console.error(e) }
    }
    seedIfEmpty()
  }, [mounted, refreshData])

  useEffect(() => { document.documentElement.classList.toggle('dark', darkMode) }, [darkMode])
  useEffect(() => { const i = setInterval(() => refreshData(), 30000); return () => clearInterval(i) }, [refreshData])

  const updateRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>, rowId: string, field: keyof QuickRow, value: string) => {
    setter(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r))
  }
  const addRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>) => setter(prev => [...prev, newQuickRow(prev.length + 1)])
  const removeRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>, rowId: string) => setter(prev => prev.length > 1 ? prev.filter(r => r.id !== rowId) : prev)
  const duplicateLastRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>) => setter(prev => { const last = prev[prev.length - 1]; return [...prev, { ...last, id: `qr-${prev.length + 1}`, qty: '' }] })

  // Excel-like keyboard navigation for quick entry tables
  // Cells are identified by data-cell="tableId:rowIdx:colIdx"
  const focusCell = useCallback((tableId: string, rowIdx: number, colIdx: number) => {
    const el = document.querySelector(`[data-cell="${tableId}:${rowIdx}:${colIdx}"]`) as HTMLElement | null
    if (!el) return
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input,button,[tabindex]') as HTMLElement | null
    if (input) { input.focus(); if (input.tagName === 'INPUT') (input as HTMLInputElement).select() }
  }, [])

  const handleCellKeyDown = useCallback((
    e: React.KeyboardEvent,
    tableId: string,
    rowIdx: number,
    colIdx: number,
    totalCols: number,
    rows: QuickRow[],
    setter: React.Dispatch<React.SetStateAction<QuickRow[]>>
  ) => {
    const isEnterOrTab = e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey)
    const isShiftTab = e.key === 'Tab' && e.shiftKey
    const isDown = e.key === 'ArrowDown'
    const isUp = e.key === 'ArrowUp'

    if (isEnterOrTab || isShiftTab || isDown || isUp) {
      e.preventDefault()

      let nextRow = rowIdx
      let nextCol = colIdx

      if (isEnterOrTab) {
        nextCol = colIdx + 1
        if (nextCol >= totalCols) { nextCol = 0; nextRow = rowIdx + 1 }
      } else if (isShiftTab) {
        nextCol = colIdx - 1
        if (nextCol < 0) { nextCol = totalCols - 1; nextRow = rowIdx - 1 }
      } else if (isDown) {
        nextRow = rowIdx + 1
      } else if (isUp) {
        nextRow = rowIdx - 1
      }

      if (nextRow < 0) return

      // Auto-add row when navigating past last row
      if (nextRow >= rows.length) {
        setter(prev => [...prev, newQuickRow(prev.length + 1)])
        setTimeout(() => focusCell(tableId, nextRow, nextCol), 30)
      } else {
        focusCell(tableId, nextRow, nextCol)
      }
    }
  }, [focusCell])

  const submitInwardRows = async () => {
    const validRows = inwardRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) { toast({ title: 'Error', description: 'Fill at least one row with Item, Type, and Qty', variant: 'destructive' }); return }
    try {
      const results = await Promise.all(validRows.map(row => fetch('/api/inwards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, remarks: row.remarks, date: inwardEntryDate }) })))
      if (results.every(r => r.ok)) { toast({ title: `${validRows.length} inward entries added` }); setInwardRows([newQuickRow(1)]); refreshData() }
    } catch (e) { console.error(e) }
  }

  const submitOutwardRows = async () => {
    const validRows = outwardRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) { toast({ title: 'Error', description: 'Fill at least one row with Item, Type, and Qty', variant: 'destructive' }); return }
    try {
      const results = await Promise.all(validRows.map(row => fetch('/api/outwards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, remarks: row.remarks, date: outwardEntryDate }) })))
      if (results.every(r => r.ok)) { toast({ title: `${validRows.length} outward entries added` }); setOutwardRows([newQuickRow(1)]); refreshData() }
    } catch (e) { console.error(e) }
  }

  const submitClosingRows = async () => {
    const validRows = closingRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) { toast({ title: 'Error', description: 'Fill at least one row', variant: 'destructive' }); return }
    try {
      const results = await Promise.all(validRows.map(row => fetch('/api/closing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, box: row.box, date: closingEntryDate }) })))
      if (results.every(r => r.ok)) { toast({ title: `${validRows.length} closing entries added` }); setClosingRows([newQuickRow(1)]); refreshData() }
    } catch (e) { console.error(e) }
  }

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.category) { toast({ title: 'Error', description: 'Name and category required', variant: 'destructive' }); return }
    try {
      const subTypes = itemForm.subTypes ? itemForm.subTypes.split(',').map(s => s.trim()) : [itemForm.unitType]
      const method = isEditingItem ? 'PUT' : 'POST'
      const res = await fetch('/api/items', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...itemForm, subTypes }) })
      if (res.ok) { toast({ title: isEditingItem ? 'Item updated' : 'Item added' }); setItemDialogOpen(false); setItemForm({ id: '', name: '', category: 'Health', unitType: 'Pack', subTypes: '' }); setIsEditingItem(false); refreshData() }
    } catch (e) { console.error(e) }
  }

  const openEditItem = (item: Item) => {
    setIsEditingItem(true)
    setItemForm({ id: item.id, name: item.name, category: item.category, unitType: item.unitType, subTypes: JSON.parse(item.subTypes || '[]').join(', ') })
    setItemDialogOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/${deleteTarget.type}?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) { toast({ title: 'Deleted' }); setDeleteDialogOpen(false); setDeleteTarget(null); refreshData() }
    } catch (e) { console.error(e) }
  }

  const handleCellEdit = async (api: string, id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/${api}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, [field]: value }) })
      if (res.ok) { toast({ title: 'Updated' }); setEditingCell(null); refreshData() }
    } catch (e) { console.error(e) }
  }

  const handleExportCSV = (data: Entry[], filename: string) => {
    const headers = ['Item Name', 'Type', 'Qty', 'Unit', 'Remarks', 'Box', 'Date', 'Timestamp']
    const rows = data.map(e => [e.item.name, e.type, e.qty, e.unit, e.remarks || '', e.box || '', formatDate(e.date), formatTimestamp(e.createdAt)])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${filename}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const filterEntries = (entries: Entry[]) => {
    if (!searchQuery) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(e => e.item.name.toLowerCase().includes(q) || e.type.toLowerCase().includes(q) || (e.remarks && e.remarks.toLowerCase().includes(q)))
  }

  const groupedClosing = closingEntries.reduce((acc, entry) => {
    const key = entry.item.name
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {} as Record<string, Entry[]>)

  const summary = analytics?.summary as { totalInward: number; totalOutward: number; totalClosing: number; totalItems: number; netMovement: number } | undefined
  const dailyTrend = (analytics?.dailyTrend as { date: string; inward: number; outward: number }[]) || []
  const inwardByType = (analytics?.inwardByType as { type: string; qty: number; count: number }[]) || []
  const outwardByType = (analytics?.outwardByType as { type: string; qty: number; count: number }[]) || []
  const closingByCategory = (analytics?.closingByCategory as { category: string; qty: number }[]) || []
  const inwardByItem = (analytics?.inwardByItem as { itemId: string; name: string; qty: number }[]) || []
  const outwardByItem = (analytics?.outwardByItem as { itemId: string; name: string; qty: number }[]) || []

  // ── Bulk Actions ──
  // Inward checklist: one row per item × item-specific inward types (from xlsx)
  const loadInwardChecklist = () => {
    if (items.length === 0) return
    const newRows: QuickRow[] = []
    let counter = 1
    items.forEach(item => {
      const types = ITEM_INWARD_TYPES[item.name] || ['Purchase']
      types.forEach(type => {
        const row = newQuickRow(counter++)
        row.itemId = item.id
        row.unit = item.unitType
        row.type = type
        newRows.push(row)
      })
    })
    setInwardRows(newRows)
    toast({ title: 'Checklist Loaded', description: `${newRows.length} rows — fill Qty only.` })
  }

  // Outward checklist: one row per item × item-specific outward types (from xlsx)
  const loadOutwardChecklist = () => {
    if (items.length === 0) return
    const newRows: QuickRow[] = []
    let counter = 1
    items.forEach(item => {
      const types = ITEM_OUTWARD_TYPES[item.name] || ['Consumed']
      types.forEach(type => {
        const row = newQuickRow(counter++)
        row.itemId = item.id
        row.unit = item.unitType
        row.type = type
        newRows.push(row)
      })
    })
    setOutwardRows(newRows)
    toast({ title: 'Checklist Loaded', description: `${newRows.length} rows — fill Qty only.` })
  }

  // Generic fallback (kept for safety)
  const loadChecklist = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>, defaultType?: string) => {
    if (items.length === 0) return
    const newRows: QuickRow[] = items.map((item, i) => {
      const row = newQuickRow(i + 1)
      row.itemId = item.id
      row.unit = item.unitType
      if (defaultType) row.type = defaultType
      return row
    })
    setter(newRows)
    toast({ title: 'Checklist Loaded', description: `${newRows.length} rows ready.` })
  }

  // For closing: one row per item × subType
  const loadChecklistClosing = () => {
    if (items.length === 0) return
    const newRows: QuickRow[] = []
    let counter = 1
    items.forEach(item => {
      try {
        const subTypes = JSON.parse(item.subTypes || '[]') as string[]
        const types = subTypes.length > 0 ? subTypes : [item.unitType]
        types.forEach(st => {
          const row = newQuickRow(counter++)
          row.itemId = item.id
          row.unit = item.unitType
          row.type = st
          newRows.push(row)
        })
      } catch {
        const row = newQuickRow(counter++)
        row.itemId = item.id
        row.unit = item.unitType
        newRows.push(row)
      }
    })
    setClosingRows(newRows)
    toast({ title: 'Checklist Loaded', description: `${newRows.length} rows with sub-types pre-filled.` })
  }

  const useExpectedValues = () => {
    if (!report || report.rows.length === 0) {
      toast({ title: 'No Data', description: 'Run a report first to see expected values.', variant: 'destructive' })
      return
    }
    const newRows: QuickRow[] = report.rows.map((r, i) => ({
      id: `qr-auto-${i + 1}`,
      itemId: r.itemId,
      type: r.unit, 
      qty: String(r.expectedClosing),
      unit: r.unit,
      remarks: '',
      box: ''
    }))
    setClosingRows(newRows)
    toast({ title: 'Auto-populated', description: `Loaded ${newRows.length} rows with expected quantities.` })
  }

  const downloadTemplate = () => {
    const headers = ['Item', 'Type', 'Qty', 'Unit', 'Remarks', 'Box']
    const data = items.flatMap(item => {
      try {
        const subTypes = JSON.parse(item.subTypes || '[]') as string[]
        return subTypes.map(st => [item.name, st, '', item.unitType, '', ''])
      } catch (e) {
        return [[item.name, item.unitType, '', item.unitType, '', '']]
      }
    })
    const csv = [headers, ...data].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `inventory_import_template.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<QuickRow[]>>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]

        const newRows: QuickRow[] = data.map((d, i) => {
          const itemName = String(d.Item || d.item || '').trim()
          const item = items.find(it => it.name.toLowerCase() === itemName.toLowerCase())
          return {
            id: `qr-imp-${i + 1}`,
            itemId: item?.id || '',
            type: String(d.Type || d.type || ''),
            qty: String(d.Qty || d.qty || ''),
            unit: String(d.Unit || d.unit || item?.unitType || 'Pack'),
            remarks: String(d.Remarks || d.remarks || ''),
            box: String(d.Box || d.box || '')
          }
        })
        setter(newRows)
        toast({ title: 'Import Successful', description: `Loaded ${newRows.length} rows from file.` })
      } catch (err) {
        console.error(err)
        toast({ title: 'Import Failed', description: 'Invalid file format.', variant: 'destructive' })
      }
    }
    reader.readAsBinaryString(file)
    e.target.value = '' // Reset input
  }

  const cp = compactMode ? 'px-3 py-1.5' : 'px-4 py-3'
  const hp = compactMode ? 'px-3 py-2' : 'px-4 py-3'

  const activeNav = NAV_ITEMS.find(n => n.id === activeTab)

  // Auto-resolve loading if stuck too long
  useEffect(() => {
    if (!mounted) {
      const timer = setTimeout(() => {
        console.warn('Mount check taking too long, forcing mount state...')
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [mounted])

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-lg">
            <Package className="h-6 w-6 text-white" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading Inventory Manager...</span>
          </div>
          <button 
            onClick={() => typeof window !== 'undefined' && window.location.reload()} 
            className="mt-4 text-xs text-slate-400 hover:text-slate-600 underline"
          >
            Stuck? Click to reload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" suppressHydrationWarning>

      {/* ── Sidebar overlay (mobile) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col
        bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-200 dark:shadow-emerald-900">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100">Inventory</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">Aurawill APS</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setSidebarOpen(false) }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150
                  ${isActive
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }
                `}
              >
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-white dark:bg-slate-700 shadow-sm' : 'bg-transparent'}`}>
                  <Icon className={`h-4 w-4 ${isActive ? item.color : ''}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{item.label}</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">{item.description}</p>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 ml-auto text-slate-400 shrink-0" />}
              </button>
            )
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800">
            <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0">
              <Activity className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">Live sync active</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">Refreshes every 30s</p>
            </div>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* ── Top header ── */}
        <header className="h-16 flex items-center gap-4 px-4 md:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-4 w-4" />
          </Button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <span className="text-slate-400 dark:text-slate-500">Inventory</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
            <span className="font-medium text-slate-700 dark:text-slate-200">{activeNav?.label}</span>
          </div>

          <div className="flex-1 flex items-center justify-center max-w-xs mx-auto md:max-w-sm">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search entries…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-sm rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              onClick={refreshData}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 ${compactMode ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
              onClick={() => setCompactMode(!compactMode)}
              title="Toggle compact mode"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ml-1">
              A
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">

          {/* ════════════════ DASHBOARD ════════════════ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 max-w-[1400px]">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Overview</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Real-time inventory snapshot</p>
              </div>

              <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                <StatCard label="Total Inward" value={summary?.totalInward || 0} icon={TrendingUp} gradient="bg-gradient-to-br from-emerald-500 to-emerald-600" change="All time stock received" description="Cumulative quantity of all stock received across all items." />
                <StatCard label="Total Outward" value={summary?.totalOutward || 0} icon={TrendingDown} gradient="bg-gradient-to-br from-red-500 to-red-600" change="All time dispatched" description="Cumulative quantity of all stock dispatched or used." />
                <StatCard label="Closing Stock" value={summary?.totalClosing || 0} icon={Archive} gradient="bg-gradient-to-br from-amber-500 to-amber-600" change="Current balance" description="Current physical stock remaining in inventory across all items." />
                <StatCard label="Net Movement" value={summary?.netMovement || 0} icon={ArrowUpDown} gradient="bg-gradient-to-br from-violet-500 to-violet-600" change="Inward minus outward" description="The net difference between total stock received and total stock dispatched." />
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Daily Inward vs Outward</CardTitle>
                    <CardDescription className="text-xs">Stock movement over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={dailyTrend}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        <Legend />
                        <Bar dataKey="inward" fill="#10b981" name="Inward" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="outward" fill="#ef4444" name="Outward" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold">Closing by Category</CardTitle>
                    <CardDescription className="text-xs">Stock distribution breakdown</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={260}>
                      <PieChart>
                        <Pie data={closingByCategory} dataKey="qty" nameKey="category" cx="50%" cy="50%" outerRadius={85} label={({ category, qty }) => `${category}: ${qty}`} labelLine={{ stroke: '#94a3b8' }}>
                          {closingByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Recent Inwards</CardTitle>
                      <CardDescription className="text-xs">Latest stock received</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs font-medium">{inwardEntries.length} entries</Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[260px]">
                      <div className="space-y-2 pr-2">
                        {filterEntries(inwardEntries).slice(0, 10).map(e => (
                          <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                              <TrendingUp className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate text-slate-800 dark:text-slate-200">{e.item.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{e.type} · {formatDate(e.date)}</p>
                            </div>
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-semibold shrink-0">+{e.qty} {e.unit}</Badge>
                          </div>
                        ))}
                        {inwardEntries.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <PackagePlus className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-xs">No inward entries</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Recent Outwards</CardTitle>
                      <CardDescription className="text-xs">Latest stock dispatched</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium">{outwardEntries.length} entries</Badge>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ScrollArea className="h-[260px]">
                      <div className="space-y-2 pr-2">
                        {filterEntries(outwardEntries).slice(0, 10).map(e => (
                          <div key={e.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <div className="h-7 w-7 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                              <TrendingDown className="h-3.5 w-3.5 text-red-500 dark:text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs truncate text-slate-800 dark:text-slate-200">{e.item.name}</p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">{e.type} · {formatDate(e.date)}</p>
                            </div>
                            <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-semibold shrink-0">-{e.qty} {e.unit}</Badge>
                          </div>
                        ))}
                        {outwardEntries.length === 0 && (
                          <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                            <PackageMinus className="h-8 w-8 mb-2 opacity-30" />
                            <p className="text-xs">No outward entries</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ════════════════ INWARDS ════════════════ */}
          {activeTab === 'inwards' && (
            <div className="space-y-5 max-w-[1400px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Inward Entries</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Record stock received into inventory</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Label className="text-xs text-slate-500 shrink-0">From</Label>
                    <Input type="date" value={inwardDateFilter.start} onChange={e => setInwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <Label className="text-xs text-slate-500 shrink-0">To</Label>
                    <Input type="date" value={inwardDateFilter.end} onChange={e => setInwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                    {inwardDateFilter.start && <button onClick={() => setInwardDateFilter({ start: '', end: '' })} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>}
                  </div>
                  <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5 border-slate-200 dark:border-slate-700" onClick={() => handleExportCSV(inwardEntries, 'inwards')}>
                    <Download className="h-3.5 w-3.5" />Export CSV
                  </Button>
                </div>
              </div>

              {/* Quick Fill */}
              <Card className="border-emerald-200/70 dark:border-emerald-800/60 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                        <Rows3 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Quick Entry</CardTitle>
                        <CardDescription className="text-xs">Add multiple inward entries at once</CardDescription>
                        <div className="flex gap-2 mt-1.5">
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={loadInwardChecklist}>
                            <Rows3 className="h-3 w-3 mr-1" />Checklist Mode
                          </Button>
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={() => document.getElementById('inward-file-input')?.click()}>
                            <Download className="h-3 w-3 mr-1" />Import Excel
                          </Button>
                          <input id="inward-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFileUpload(e, setInwardRows)} />
                          <Button variant="ghost" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={downloadTemplate}>
                            Template
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date</Label>
                      <Input type="date" value={inwardEntryDate} onChange={e => setInwardEntryDate(e.target.value)} className="h-8 text-xs w-[145px] rounded-lg" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {(() => {
                    const groupColors = ['bg-emerald-50/60 dark:bg-emerald-900/10','bg-sky-50/60 dark:bg-sky-900/10','bg-violet-50/60 dark:bg-violet-900/10','bg-rose-50/60 dark:bg-rose-900/10','bg-amber-50/60 dark:bg-amber-900/10','bg-teal-50/60 dark:bg-teal-900/10','bg-orange-50/60 dark:bg-orange-900/10','bg-pink-50/60 dark:bg-pink-900/10']
                    const groupBorder = ['border-l-emerald-400','border-l-sky-400','border-l-violet-400','border-l-rose-400','border-l-amber-400','border-l-teal-400','border-l-orange-400','border-l-pink-400']
                    let groupIdx = -1; let lastItemId = ''
                    return (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-[200px]">Item</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">Type</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-20">Qty *</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-20">Unit</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-amber-500 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10">Remarks</th>
                          <th className="px-2 py-2 w-14 border-b border-slate-100 dark:border-slate-800"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {inwardRows.map((row, idx) => {
                          if (row.itemId !== lastItemId) { groupIdx++; lastItemId = row.itemId }
                          const ci = groupIdx % groupColors.length
                          const isFirst = idx === 0 || inwardRows[idx - 1].itemId !== row.itemId
                          return (
                          <tr key={row.id} className={`border-b border-slate-100/80 dark:border-slate-800/40 last:border-0 transition-colors ${groupColors[ci]} border-l-2 ${groupBorder[ci]}`}>
                            <td className="px-3 py-1.5" data-cell={`inward:${idx}:0`} onKeyDown={e => handleCellKeyDown(e, 'inward', idx, 0, 5, inwardRows, setInwardRows)}>
                              {isFirst ? (
                                <Select value={row.itemId} onValueChange={v => { updateRow(setInwardRows, row.id, 'itemId', v); setTimeout(() => focusCell('inward', idx, 1), 30) }}>
                                  <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Select item" /></SelectTrigger>
                                  <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : (
                                <span className="text-[10px] text-slate-400 pl-1 italic">↳ same item</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5" data-cell={`inward:${idx}:1`} onKeyDown={e => handleCellKeyDown(e, 'inward', idx, 1, 5, inwardRows, setInwardRows)}>
                              <Select value={row.type} onValueChange={v => { updateRow(setInwardRows, row.id, 'type', v); setTimeout(() => focusCell('inward', idx, 2), 30) }}>
                                <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>{INWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-1.5" data-cell={`inward:${idx}:2`} onKeyDown={e => handleCellKeyDown(e, 'inward', idx, 2, 5, inwardRows, setInwardRows)}>
                              <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setInwardRows, row.id, 'qty', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm font-semibold" placeholder="0" />
                            </td>
                            <td className="px-3 py-1.5" data-cell={`inward:${idx}:3`} onKeyDown={e => handleCellKeyDown(e, 'inward', idx, 3, 5, inwardRows, setInwardRows)}>
                              <Select value={row.unit} onValueChange={v => { updateRow(setInwardRows, row.id, 'unit', v); setTimeout(() => focusCell('inward', idx, 4), 30) }}>
                                <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-1.5 bg-amber-50/50 dark:bg-amber-900/10" data-cell={`inward:${idx}:4`} onKeyDown={e => handleCellKeyDown(e, 'inward', idx, 4, 5, inwardRows, setInwardRows)}>
                              <Input value={row.remarks} onChange={e => updateRow(setInwardRows, row.id, 'remarks', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-transparent" placeholder="note…" />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-red-500" onClick={() => removeRow(setInwardRows, row.id)}><X className="h-3 w-3" /></Button>
                                {idx === inwardRows.length - 1 && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-emerald-600" onClick={() => addRow(setInwardRows)}><Plus className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-emerald-600" onClick={() => duplicateLastRow(setInwardRows)}><Copy className="h-3 w-3" /></Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                    )
                  })()}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-emerald-600">{inwardRows.filter(r => r.itemId && r.type && r.qty).length}</span> row(s) ready to submit
                      <span className="hidden sm:inline text-[10px] text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">Enter / Tab → next cell &nbsp;·&nbsp; ↑↓ move rows &nbsp;·&nbsp; Enter on last cell → new row</span>
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setInwardRows([newQuickRow(1)])}>Clear All</Button>
                      <Button size="sm" className="h-8 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-emerald-900" onClick={submitInwardRows}>
                        <Check className="h-3 w-3 mr-1.5" />Submit ({inwardRows.filter(r => r.itemId && r.type && r.qty).length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Entries Table */}
              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">All Inward Entries</CardTitle>
                    <CardDescription className="text-xs">{filterEntries(inwardEntries).length} records</CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Item</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Type</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Qty</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Unit</TableHead>
                          <TableHead className={`text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 ${hp}`}>Remarks</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Date</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Timestamp</TableHead>
                          <TableHead className={`${hp} w-12`}></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterEntries(inwardEntries).map((e, i) => (
                          <TableRow key={e.id} className={`${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}>
                            <TableCell className={`font-medium text-sm ${cp}`}>{e.item.name}</TableCell>
                            <TableCell className={cp}><Badge variant="secondary" className="text-[11px] rounded-lg font-medium">{e.type}</Badge></TableCell>
                            <TableCell className={`font-semibold text-emerald-700 dark:text-emerald-400 ${cp}`}>{e.qty}</TableCell>
                            <TableCell className={`text-xs text-slate-500 ${cp}`}>{e.unit}</TableCell>
                            <TableCell className={`bg-amber-50/40 dark:bg-amber-900/10 ${cp}`}>
                              {editingCell === `ir-${e.id}` ? (
                                <div className="flex items-center gap-1">
                                  <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs rounded-lg" autoFocus onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('inwards', e.id, 'remarks', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => handleCellEdit('inwards', e.id, 'remarks', editValue)}><Save className="h-3 w-3" /></Button>
                                </div>
                              ) : (
                                <span className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 px-1.5 py-0.5 rounded-lg text-xs transition-colors" onClick={() => { setEditingCell(`ir-${e.id}`); setEditValue(e.remarks || '') }}>
                                  {e.remarks || <span className="italic text-slate-400">click to edit</span>}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className={`text-xs ${cp}`}>{formatDate(e.date)}</TableCell>
                            <TableCell className={`text-xs text-slate-400 dark:text-slate-500 ${cp}`}>{formatTimestamp(e.createdAt)}</TableCell>
                            <TableCell className={cp}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500" onClick={() => { setDeleteTarget({ type: 'inwards', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {inwardEntries.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <PackagePlus className="h-8 w-8 opacity-30" />
                              <p className="text-sm">No inward entries yet</p>
                            </div>
                          </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ OUTWARDS ════════════════ */}
          {activeTab === 'outwards' && (
            <div className="space-y-5 max-w-[1400px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Outward Entries</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Record stock dispatched from inventory</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Label className="text-xs text-slate-500 shrink-0">From</Label>
                    <Input type="date" value={outwardDateFilter.start} onChange={e => setOutwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                    <span className="text-slate-300 dark:text-slate-600">|</span>
                    <Label className="text-xs text-slate-500 shrink-0">To</Label>
                    <Input type="date" value={outwardDateFilter.end} onChange={e => setOutwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                    {outwardDateFilter.start && <button onClick={() => setOutwardDateFilter({ start: '', end: '' })} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>}
                  </div>
                  <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5 border-slate-200 dark:border-slate-700" onClick={() => handleExportCSV(outwardEntries, 'outwards')}>
                    <Download className="h-3.5 w-3.5" />Export CSV
                  </Button>
                </div>
              </div>

              <Card className="border-red-200/70 dark:border-red-800/60 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                        <Rows3 className="h-4 w-4 text-red-500 dark:text-red-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Quick Entry</CardTitle>
                        <CardDescription className="text-xs">Add multiple outward entries at once</CardDescription>
                        <div className="flex gap-2 mt-1.5">
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={loadOutwardChecklist}>
                            <Rows3 className="h-3 w-3 mr-1" />Checklist Mode
                          </Button>
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={() => document.getElementById('outward-file-input')?.click()}>
                            <Download className="h-3 w-3 mr-1" />Import Excel
                          </Button>
                          <input id="outward-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFileUpload(e, setOutwardRows)} />
                          <Button variant="ghost" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={downloadTemplate}>
                            Template
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date</Label>
                      <Input type="date" value={outwardEntryDate} onChange={e => setOutwardEntryDate(e.target.value)} className="h-8 text-xs w-[145px] rounded-lg" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {(() => {
                    const groupColors = ['bg-red-50/60 dark:bg-red-900/10','bg-sky-50/60 dark:bg-sky-900/10','bg-violet-50/60 dark:bg-violet-900/10','bg-emerald-50/60 dark:bg-emerald-900/10','bg-amber-50/60 dark:bg-amber-900/10','bg-teal-50/60 dark:bg-teal-900/10','bg-orange-50/60 dark:bg-orange-900/10','bg-pink-50/60 dark:bg-pink-900/10']
                    const groupBorder = ['border-l-red-400','border-l-sky-400','border-l-violet-400','border-l-emerald-400','border-l-amber-400','border-l-teal-400','border-l-orange-400','border-l-pink-400']
                    let groupIdx = -1; let lastItemId = ''
                    return (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-[200px]">Item</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">Type</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-20">Qty *</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-20">Unit</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-amber-500 border-b border-amber-100 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-900/10">Remarks</th>
                          <th className="px-2 py-2 w-14 border-b border-slate-100 dark:border-slate-800"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {outwardRows.map((row, idx) => {
                          if (row.itemId !== lastItemId) { groupIdx++; lastItemId = row.itemId }
                          const ci = groupIdx % groupColors.length
                          const isFirst = idx === 0 || outwardRows[idx - 1].itemId !== row.itemId
                          return (
                          <tr key={row.id} className={`border-b border-slate-100/80 dark:border-slate-800/40 last:border-0 transition-colors ${groupColors[ci]} border-l-2 ${groupBorder[ci]}`}>
                            <td className="px-3 py-1.5" data-cell={`outward:${idx}:0`} onKeyDown={e => handleCellKeyDown(e, 'outward', idx, 0, 5, outwardRows, setOutwardRows)}>
                              {isFirst ? (
                                <Select value={row.itemId} onValueChange={v => { updateRow(setOutwardRows, row.id, 'itemId', v); setTimeout(() => focusCell('outward', idx, 1), 30) }}>
                                  <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Select item" /></SelectTrigger>
                                  <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                </Select>
                              ) : (
                                <span className="text-[10px] text-slate-400 pl-1 italic">↳ same item</span>
                              )}
                            </td>
                            <td className="px-3 py-1.5" data-cell={`outward:${idx}:1`} onKeyDown={e => handleCellKeyDown(e, 'outward', idx, 1, 5, outwardRows, setOutwardRows)}>
                              <Select value={row.type} onValueChange={v => { updateRow(setOutwardRows, row.id, 'type', v); setTimeout(() => focusCell('outward', idx, 2), 30) }}>
                                <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent>{OUTWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-1.5" data-cell={`outward:${idx}:2`} onKeyDown={e => handleCellKeyDown(e, 'outward', idx, 2, 5, outwardRows, setOutwardRows)}>
                              <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setOutwardRows, row.id, 'qty', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm font-semibold" placeholder="0" />
                            </td>
                            <td className="px-3 py-1.5" data-cell={`outward:${idx}:3`} onKeyDown={e => handleCellKeyDown(e, 'outward', idx, 3, 5, outwardRows, setOutwardRows)}>
                              <Select value={row.unit} onValueChange={v => { updateRow(setOutwardRows, row.id, 'unit', v); setTimeout(() => focusCell('outward', idx, 4), 30) }}>
                                <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className="px-3 py-1.5 bg-amber-50/50 dark:bg-amber-900/10" data-cell={`outward:${idx}:4`} onKeyDown={e => handleCellKeyDown(e, 'outward', idx, 4, 5, outwardRows, setOutwardRows)}>
                              <Input value={row.remarks} onChange={e => updateRow(setOutwardRows, row.id, 'remarks', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-transparent" placeholder="note…" />
                            </td>
                            <td className="px-2 py-1.5">
                              <div className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-red-500" onClick={() => removeRow(setOutwardRows, row.id)}><X className="h-3 w-3" /></Button>
                                {idx === outwardRows.length - 1 && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-red-500" onClick={() => addRow(setOutwardRows)}><Plus className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-red-500" onClick={() => duplicateLastRow(setOutwardRows)}><Copy className="h-3 w-3" /></Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                    )
                  })()}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-red-500">{outwardRows.filter(r => r.itemId && r.type && r.qty).length}</span> row(s) ready to submit
                      <span className="hidden sm:inline text-[10px] text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">Enter / Tab → next cell &nbsp;·&nbsp; ↑↓ move rows &nbsp;·&nbsp; Enter on last cell → new row</span>
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setOutwardRows([newQuickRow(1)])}>Clear All</Button>
                      <Button size="sm" className="h-8 text-xs rounded-lg bg-red-600 hover:bg-red-700 shadow-sm shadow-red-200 dark:shadow-red-900" onClick={submitOutwardRows}>
                        <Check className="h-3 w-3 mr-1.5" />Submit ({outwardRows.filter(r => r.itemId && r.type && r.qty).length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold">All Outward Entries</CardTitle>
                  <CardDescription className="text-xs">{filterEntries(outwardEntries).length} records</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Item</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Type</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Qty</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Unit</TableHead>
                          <TableHead className={`text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 ${hp}`}>Remarks</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Date</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Timestamp</TableHead>
                          <TableHead className={`${hp} w-12`}></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filterEntries(outwardEntries).map((e, i) => (
                          <TableRow key={e.id} className={`${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}>
                            <TableCell className={`font-medium text-sm ${cp}`}>{e.item.name}</TableCell>
                            <TableCell className={cp}><Badge variant="secondary" className="text-[11px] rounded-lg font-medium">{e.type}</Badge></TableCell>
                            <TableCell className={`font-semibold text-red-600 dark:text-red-400 ${cp}`}>{e.qty}</TableCell>
                            <TableCell className={`text-xs text-slate-500 ${cp}`}>{e.unit}</TableCell>
                            <TableCell className={`bg-amber-50/40 dark:bg-amber-900/10 ${cp}`}>
                              {editingCell === `or-${e.id}` ? (
                                <div className="flex items-center gap-1">
                                  <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs rounded-lg" autoFocus onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('outwards', e.id, 'remarks', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                  <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => handleCellEdit('outwards', e.id, 'remarks', editValue)}><Save className="h-3 w-3" /></Button>
                                </div>
                              ) : (
                                <span className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 px-1.5 py-0.5 rounded-lg text-xs transition-colors" onClick={() => { setEditingCell(`or-${e.id}`); setEditValue(e.remarks || '') }}>
                                  {e.remarks || <span className="italic text-slate-400">click to edit</span>}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className={`text-xs ${cp}`}>{formatDate(e.date)}</TableCell>
                            <TableCell className={`text-xs text-slate-400 dark:text-slate-500 ${cp}`}>{formatTimestamp(e.createdAt)}</TableCell>
                            <TableCell className={cp}>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500" onClick={() => { setDeleteTarget({ type: 'outwards', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {outwardEntries.length === 0 && (
                          <TableRow><TableCell colSpan={8} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <PackageMinus className="h-8 w-8 opacity-30" />
                              <p className="text-sm">No outward entries yet</p>
                            </div>
                          </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ CLOSING ════════════════ */}
          {activeTab === 'closing' && (
            <div className="space-y-5 max-w-[1400px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Closing Inventory</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">End-of-day stock balance records</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Label className="text-xs text-slate-500 shrink-0">View Date</Label>
                    <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="h-7 text-xs w-[140px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5 border-slate-200 dark:border-slate-700" onClick={() => handleExportCSV(closingEntries, 'closing')}>
                    <Download className="h-3.5 w-3.5" />Export CSV
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2.5 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/60 rounded-xl">
                <div className="h-5 w-5 rounded-md bg-amber-400 flex items-center justify-center shrink-0">
                  <Edit3 className="h-2.5 w-2.5 text-white" />
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300"><strong>Tip:</strong> Highlighted cells are editable — click Qty or Box to modify inline.</p>
              </div>

              <Card className="border-amber-200/70 dark:border-amber-800/60 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                        <Rows3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">Quick Entry</CardTitle>
                        <CardDescription className="text-xs">Add closing stock entries</CardDescription>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2 bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800" onClick={useExpectedValues}>
                            <Activity className="h-3 w-3 mr-1" />Auto-fill Expected
                          </Button>
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={loadChecklistClosing}>
                            <Rows3 className="h-3 w-3 mr-1" />Load All Products
                          </Button>
                          <Button variant="outline" size="xs" className="h-6 text-[10px] rounded-md px-2" onClick={() => document.getElementById('closing-file-input')?.click()}>
                            <Download className="h-3 w-3 mr-1" />Import Excel
                          </Button>
                          <input id="closing-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={e => handleFileUpload(e, setClosingRows)} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Date</Label>
                      <Input type="date" value={closingEntryDate} onChange={e => setClosingEntryDate(e.target.value)} className="h-8 text-xs w-[145px] rounded-lg" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-5 pb-5">
                  {(() => {
                    const groupColors = ['bg-amber-50/60 dark:bg-amber-900/10','bg-teal-50/60 dark:bg-teal-900/10','bg-violet-50/60 dark:bg-violet-900/10','bg-sky-50/60 dark:bg-sky-900/10','bg-rose-50/60 dark:bg-rose-900/10','bg-emerald-50/60 dark:bg-emerald-900/10','bg-orange-50/60 dark:bg-orange-900/10','bg-pink-50/60 dark:bg-pink-900/10']
                    const groupBorder = ['border-l-amber-400','border-l-teal-400','border-l-violet-400','border-l-sky-400','border-l-rose-400','border-l-emerald-400','border-l-orange-400','border-l-pink-400']
                    let groupIdx = -1; let lastItemId = ''
                    return (
                  <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60">
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-[200px]">Item</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">Sub-Type</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-amber-500 border-b border-amber-100 bg-amber-50/40 dark:bg-amber-900/10 w-20">Qty *</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800 w-20">Unit</th>
                          <th className="px-3 py-2 text-left text-[11px] font-semibold text-amber-500 border-b border-amber-100 bg-amber-50/40 dark:bg-amber-900/10 w-20">Box</th>
                          <th className="px-2 py-2 w-14 border-b border-slate-100 dark:border-slate-800"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {closingRows.map((row, idx) => {
                          const selectedItem = items.find(i => i.id === row.itemId)
                          const subTypes = selectedItem ? JSON.parse(selectedItem.subTypes || '[]') as string[] : []
                          if (row.itemId !== lastItemId) { groupIdx++; lastItemId = row.itemId }
                          const ci = groupIdx % groupColors.length
                          const isFirst = idx === 0 || closingRows[idx - 1].itemId !== row.itemId
                          return (
                            <tr key={row.id} className={`border-b border-slate-100/80 dark:border-slate-800/40 last:border-0 transition-colors ${groupColors[ci]} border-l-2 ${groupBorder[ci]}`}>
                              <td className="px-3 py-1.5" data-cell={`closing:${idx}:0`} onKeyDown={e => handleCellKeyDown(e, 'closing', idx, 0, 5, closingRows, setClosingRows)}>
                                {isFirst ? (
                                  <Select value={row.itemId} onValueChange={v => { updateRow(setClosingRows, row.id, 'itemId', v); updateRow(setClosingRows, row.id, 'type', ''); setTimeout(() => focusCell('closing', idx, 1), 30) }}>
                                    <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Select item" /></SelectTrigger>
                                    <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-[10px] text-slate-400 pl-1 italic">↳ same item</span>
                                )}
                              </td>
                              <td className="px-3 py-1.5" data-cell={`closing:${idx}:1`} onKeyDown={e => handleCellKeyDown(e, 'closing', idx, 1, 5, closingRows, setClosingRows)}>
                                <Select value={row.type} onValueChange={v => { updateRow(setClosingRows, row.id, 'type', v); setTimeout(() => focusCell('closing', idx, 2), 30) }}>
                                  <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue placeholder="Sub-type" /></SelectTrigger>
                                  <SelectContent>{subTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-1.5 bg-amber-50/50 dark:bg-amber-900/10" data-cell={`closing:${idx}:2`} onKeyDown={e => handleCellKeyDown(e, 'closing', idx, 2, 5, closingRows, setClosingRows)}>
                                <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setClosingRows, row.id, 'qty', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-transparent font-semibold" placeholder="0" />
                              </td>
                              <td className="px-3 py-1.5" data-cell={`closing:${idx}:3`} onKeyDown={e => handleCellKeyDown(e, 'closing', idx, 3, 5, closingRows, setClosingRows)}>
                                <Select value={row.unit} onValueChange={v => { updateRow(setClosingRows, row.id, 'unit', v); setTimeout(() => focusCell('closing', idx, 4), 30) }}>
                                  <SelectTrigger className="h-7 text-xs rounded-md border-0 bg-white/70 dark:bg-slate-800/50 shadow-sm"><SelectValue /></SelectTrigger>
                                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                              </td>
                              <td className="px-3 py-1.5 bg-amber-50/50 dark:bg-amber-900/10" data-cell={`closing:${idx}:4`} onKeyDown={e => handleCellKeyDown(e, 'closing', idx, 4, 5, closingRows, setClosingRows)}>
                                <Input value={row.box} onChange={e => updateRow(setClosingRows, row.id, 'box', e.target.value)} className="h-7 text-xs rounded-md border-0 bg-transparent" placeholder="—" />
                              </td>
                              <td className="px-2 py-1.5">
                                <div className="flex gap-0.5">
                                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-red-500" onClick={() => removeRow(setClosingRows, row.id)}><X className="h-3 w-3" /></Button>
                                  {idx === closingRows.length - 1 && (
                                    <>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-amber-600" onClick={() => addRow(setClosingRows)}><Plus className="h-3 w-3" /></Button>
                                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-slate-300 hover:text-amber-600" onClick={() => duplicateLastRow(setClosingRows)}><Copy className="h-3 w-3" /></Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                    )
                  })()}
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-2">
                      <span className="font-semibold text-amber-600">{closingRows.filter(r => r.itemId && r.type && r.qty).length}</span> row(s) ready to submit
                      <span className="hidden sm:inline text-[10px] text-slate-300 dark:text-slate-600 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">Enter / Tab → next cell &nbsp;·&nbsp; ↑↓ move rows &nbsp;·&nbsp; Enter on last cell → new row</span>
                    </span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" onClick={() => setClosingRows([newQuickRow(1)])}>Clear All</Button>
                      <Button size="sm" className="h-8 text-xs rounded-lg bg-amber-600 hover:bg-amber-700 shadow-sm shadow-amber-200 dark:shadow-amber-900" onClick={submitClosingRows}>
                        <Check className="h-3 w-3 mr-1.5" />Submit ({closingRows.filter(r => r.itemId && r.type && r.qty).length})
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold">Closing Stock Entries</CardTitle>
                  <CardDescription className="text-xs">{closingEntries.length} records for selected date</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="max-h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Item</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Type</TableHead>
                          <TableHead className={`text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 ${hp}`}>Qty</TableHead>
                          <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Unit</TableHead>
                          <TableHead className={`text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 ${hp}`}>Box</TableHead>
                          <TableHead className={`${hp} w-12`}></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Object.entries(groupedClosing).map(([name, entries]) => (
                          <React.Fragment key={name}>
                            {entries.map((e, idx) => (
                              <TableRow key={e.id} className={`${idx === 0 ? 'border-t-2 border-t-slate-200 dark:border-t-slate-700' : ''} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}>
                                {idx === 0 && <TableCell className={`font-semibold text-sm text-slate-800 dark:text-slate-200 ${cp}`} rowSpan={entries.length}>{name}</TableCell>}
                                <TableCell className={cp}><span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 font-medium">{e.type}</span></TableCell>
                                <TableCell className={`bg-amber-50/40 dark:bg-amber-900/10 ${cp}`}>
                                  {editingCell === `cq-${e.id}` ? (
                                    <div className="flex items-center gap-1">
                                      <Input type="number" value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs w-20 rounded-lg" autoFocus onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('closing', e.id, 'qty', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => handleCellEdit('closing', e.id, 'qty', editValue)}><Save className="h-3 w-3" /></Button>
                                    </div>
                                  ) : (
                                    <span className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 px-1.5 py-0.5 rounded-lg font-semibold text-amber-800 dark:text-amber-300 transition-colors" onClick={() => { setEditingCell(`cq-${e.id}`); setEditValue(String(e.qty)) }}>{e.qty}</span>
                                  )}
                                </TableCell>
                                <TableCell className={`text-xs text-slate-500 ${cp}`}>{e.unit}</TableCell>
                                <TableCell className={`bg-amber-50/40 dark:bg-amber-900/10 ${cp}`}>
                                  {editingCell === `cb-${e.id}` ? (
                                    <div className="flex items-center gap-1">
                                      <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs w-20 rounded-lg" autoFocus onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('closing', e.id, 'box', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                      <Button size="icon" variant="ghost" className="h-6 w-6 rounded-md" onClick={() => handleCellEdit('closing', e.id, 'box', editValue)}><Save className="h-3 w-3" /></Button>
                                    </div>
                                  ) : (
                                    <span className="cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-800/40 px-1.5 py-0.5 rounded-lg text-xs transition-colors" onClick={() => { setEditingCell(`cb-${e.id}`); setEditValue(e.box || '') }}>
                                      {e.box || <span className="italic text-slate-400">click to edit</span>}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className={cp}>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500" onClick={() => { setDeleteTarget({ type: 'closing', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </React.Fragment>
                        ))}
                        {closingEntries.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center py-12">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <Archive className="h-8 w-8 opacity-30" />
                              <p className="text-sm">No closing entries for this date</p>
                            </div>
                          </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ ANALYTICS ════════════════ */}
          {activeTab === 'analytics' && (
            <div className="space-y-6 max-w-[1400px]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Analytics</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Charts, trends, and inventory insights</p>
                </div>
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                  <Label className="text-xs text-slate-500 shrink-0">From</Label>
                  <Input type="date" value={analyticsDateFilter.start} onChange={e => setAnalyticsDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <Label className="text-xs text-slate-500 shrink-0">To</Label>
                  <Input type="date" value={analyticsDateFilter.end} onChange={e => setAnalyticsDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                  {analyticsDateFilter.start && <button onClick={() => setAnalyticsDateFilter({ start: '', end: '' })} className="text-slate-400 hover:text-slate-600"><X className="h-3 w-3" /></button>}
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
                {[
                  { label: 'Total Inward', val: summary?.totalInward || 0, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                  { label: 'Total Outward', val: summary?.totalOutward || 0, icon: TrendingDown, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Closing Stock', val: summary?.totalClosing || 0, icon: Archive, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                  { label: 'Net Movement', val: summary?.netMovement || 0, icon: ArrowUpDown, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
                  { label: 'Total Items', val: summary?.totalItems || 0, icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-900/20' },
                ].map(s => {
                  const Icon = s.icon
                  return (
                    <Card key={s.label} className="border-slate-200 dark:border-slate-800 shadow-sm">
                      <CardContent className="p-4 flex items-center gap-3">
                        <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center shrink-0`}>
                          <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
                          <p className="text-xl font-bold text-slate-900 dark:text-slate-100 leading-tight">{s.val.toLocaleString()}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Movement Trend</CardTitle>
                    <CardDescription className="text-xs">Inward vs outward over time</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={dailyTrend}>
                        <defs>
                          <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.25} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                          <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Legend />
                        <Area type="monotone" dataKey="inward" stroke="#10b981" fill="url(#ig)" name="Inward" strokeWidth={2} />
                        <Area type="monotone" dataKey="outward" stroke="#ef4444" fill="url(#og)" name="Outward" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Stock by Category</CardTitle>
                    <CardDescription className="text-xs">Closing stock distribution</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie data={closingByCategory} dataKey="qty" nameKey="category" cx="50%" cy="50%" outerRadius={100} innerRadius={45} label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                          {closingByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Inward by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={inwardByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={150} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Bar dataKey="qty" fill="#10b981" name="Qty" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Outward by Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={outwardByType} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={150} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Bar dataKey="qty" fill="#ef4444" name="Qty" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Inward by Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={inwardByItem}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Bar dataKey="qty" name="Inward" radius={[6, 6, 0, 0]}>{inwardByItem.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">Outward by Item</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={outwardByItem}>
                        <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" />
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '10px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }} />
                        <Bar dataKey="qty" name="Outward" radius={[6, 6, 0, 0]}>{outwardByItem.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ════════════════ PRODUCTS ════════════════ */}
          {activeTab === 'products' && (
            <div className="space-y-5 max-w-[1400px]">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Product Catalogue</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Manage inventory item types and sub-types</p>
                </div>
                <Button
                  size="sm"
                  className="h-9 text-sm rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-200 dark:shadow-emerald-900 gap-1.5"
                  onClick={() => { setIsEditingItem(false); setItemForm({ id: '', name: '', category: 'Health', unitType: 'Pack', subTypes: '' }); setItemDialogOpen(true) }}
                >
                  <Plus className="h-4 w-4" />Add Product
                </Button>
              </div>

              <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="pb-3 px-5 pt-5">
                  <CardTitle className="text-sm font-semibold">All Products</CardTitle>
                  <CardDescription className="text-xs">{items.length} items in catalogue</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                        <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Name</TableHead>
                        <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Category</TableHead>
                        <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Base Unit</TableHead>
                        <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp}`}>Sub-Types</TableHead>
                        <TableHead className={`text-xs font-semibold text-slate-600 dark:text-slate-400 ${hp} w-[110px]`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, i) => (
                        <TableRow key={item.id} className={`${i % 2 === 0 ? '' : 'bg-slate-50/50 dark:bg-slate-800/20'} hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors`}>
                          <TableCell className={`font-semibold text-sm ${cp}`}>{item.name}</TableCell>
                          <TableCell className={cp}>
                            <Badge variant="secondary" className="text-[11px] rounded-lg font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">{item.category}</Badge>
                          </TableCell>
                          <TableCell className={`text-xs text-slate-500 ${cp}`}>{item.unitType}</TableCell>
                          <TableCell className={cp}>
                            <div className="flex flex-wrap gap-1">
                              {JSON.parse(item.subTypes || '[]').map((s: string) => (
                                <Badge key={s} variant="outline" className="text-[10px] rounded-lg font-normal">{s}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className={cp}>
                            <div className="flex gap-1.5">
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200" onClick={() => openEditItem(item)}><Edit3 className="h-3.5 w-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-red-500" onClick={() => { setDeleteTarget({ type: 'items', id: item.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {items.length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <Package className="h-8 w-8 opacity-30" />
                            <p className="text-sm">No products yet — add your first one</p>
                          </div>
                        </TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ════════════════ REPORT ════════════════ */}
          {activeTab === 'report' && (
            <div className="space-y-5 max-w-[1400px]">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Reconciliation Report</h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Compare inward, outward and closing stock — spot shortages, surpluses and missing records</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Label className="text-xs text-slate-500 shrink-0">Movement</Label>
                    <Input type="date" value={reportDateFilter.start} onChange={e => setReportDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                    <span className="text-slate-300 dark:text-slate-600">–</span>
                    <Input type="date" value={reportDateFilter.end} onChange={e => setReportDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5">
                    <Label className="text-xs text-slate-500 shrink-0">Closing date</Label>
                    <Input type="date" value={reportDateFilter.closingDate} onChange={e => setReportDateFilter(p => ({ ...p, closingDate: e.target.value }))} className="h-7 text-xs w-[140px] border-0 p-0 focus-visible:ring-0 bg-transparent" />
                  </div>
                  {(reportDateFilter.start || reportDateFilter.closingDate) && (
                    <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl" onClick={() => setReportDateFilter({ start: '', end: '', closingDate: '' })}>
                      <X className="h-3.5 w-3.5 mr-1" />Clear
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="h-9 text-xs rounded-xl gap-1.5 border-slate-200 dark:border-slate-700" onClick={() => {
                    if (!report) return
                    const filtered = report.rows.filter(r => reportStatusFilter === 'all' || r.status === reportStatusFilter)
                    const headers = ['Item', 'Category', 'Unit', 'Inward', 'Outward', 'Expected Closing', 'Recorded Closing', 'Variance', 'Status']
                    const rows = filtered.map(r => [r.itemName, r.category, r.unit, r.inward, r.outward, r.expectedClosing, r.closingRecorded, r.variance, r.status])
                    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
                    const blob = new Blob([csv], { type: 'text/csv' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a'); a.href = url; a.download = 'reconciliation-report.csv'; a.click()
                    URL.revokeObjectURL(url)
                  }}>
                    <Download className="h-3.5 w-3.5" />Export CSV
                  </Button>
                </div>
              </div>

              {/* Summary KPI cards */}
              {report && (
                <>
                  <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                    {[
                      { label: 'Total Items', val: report.summary.total, icon: Package, bg: 'bg-slate-100 dark:bg-slate-800', color: 'text-slate-600 dark:text-slate-300', filter: 'all', desc: 'Total number of unique products in this report.' },
                      { label: 'Matched', val: report.summary.matched, icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400', filter: 'matched', desc: 'Items where system expected stock matches physical count.' },
                      { label: 'Surplus', val: report.summary.surplus, icon: TrendingUp, bg: 'bg-blue-50 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400', filter: 'surplus', desc: 'Items where physical count is higher than expected (extra stock).' },
                      { label: 'Shortage', val: report.summary.shortage, icon: TrendingDown, bg: 'bg-red-50 dark:bg-red-900/30', color: 'text-red-600 dark:text-red-400', filter: 'shortage', desc: 'Items where physical count is lower than expected (missing stock).' },
                      { label: 'No Closing', val: report.summary.no_closing, icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-900/30', color: 'text-amber-600 dark:text-amber-400', filter: 'no_closing', desc: 'Items with movement but no physical count recorded.' },
                      { label: 'No Movement', val: report.summary.no_movement, icon: MinusCircle, bg: 'bg-slate-50 dark:bg-slate-800/60', color: 'text-slate-400', filter: 'no_movement', desc: 'Items with no activity during this date range.' },
                    ].map(s => {
                      const Icon = s.icon
                      const isActive = reportStatusFilter === s.filter
                      return (
                        <TooltipProvider key={s.label}>
                          <UiTooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <button onClick={() => setReportStatusFilter(isActive ? 'all' : s.filter)}
                                className={`text-left p-4 rounded-2xl border transition-all ${isActive ? 'border-slate-400 dark:border-slate-500 ring-2 ring-slate-300 dark:ring-slate-600' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'} bg-white dark:bg-slate-900 shadow-sm cursor-help`}>
                                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-2`}>
                                  <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                                </div>
                                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 leading-none">{s.val}</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">{s.label}</p>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-[200px] text-xs py-2 px-3 rounded-lg shadow-lg border-slate-200 dark:border-slate-800">
                              {s.desc}
                            </TooltipContent>
                          </UiTooltip>
                        </TooltipProvider>
                      )
                    })}
                  </div>

                  {report.summary.totalVariance > 0 && (
                    <div className="flex items-center gap-3 px-4 py-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/60 rounded-xl">
                      <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      <p className="text-sm text-rose-800 dark:text-rose-300">
                        Total unreconciled variance: <strong>{report.summary.totalVariance} units</strong> across {report.summary.shortage + report.summary.surplus} items.
                        {report.summary.no_closing > 0 && <> · <strong>{report.summary.no_closing}</strong> item(s) have no closing entry recorded.</>}
                      </p>
                    </div>
                  )}

                  {/* Main reconciliation table */}
                  <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                    <CardHeader className="pb-3 px-5 pt-5 flex flex-row items-center justify-between flex-wrap gap-2">
                      <div>
                        <CardTitle className="text-sm font-semibold">Item-Level Reconciliation</CardTitle>
                        <CardDescription className="text-xs">
                          {report.rows.filter(r => reportStatusFilter === 'all' || r.status === reportStatusFilter).length} items
                          {reportStatusFilter !== 'all' && ` · filtered by "${reportStatusFilter}"`}
                        </CardDescription>
                      </div>
                      <Select value={reportStatusFilter} onValueChange={setReportStatusFilter}>
                        <SelectTrigger className="h-8 text-xs w-[160px] rounded-lg">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All statuses</SelectItem>
                          <SelectItem value="matched">✓ Matched</SelectItem>
                          <SelectItem value="surplus">↑ Surplus</SelectItem>
                          <SelectItem value="shortage">↓ Shortage</SelectItem>
                          <SelectItem value="no_closing">⚠ No Closing</SelectItem>
                          <SelectItem value="no_movement">— No Movement</SelectItem>
                        </SelectContent>
                      </Select>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800">
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400 w-8"></th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Item</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-slate-400">Category</th>
                              <TooltipProvider>
                                <UiTooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400 cursor-help">Inward</th>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Total stock received during the selected movement range.</TooltipContent>
                                </UiTooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <UiTooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-red-500 dark:text-red-400 cursor-help">Outward</th>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Total stock dispatched during the selected movement range.</TooltipContent>
                                </UiTooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <UiTooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-violet-600 dark:text-violet-400 cursor-help">Expected Closing</th>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Theoretical stock balance based on previous records + inward - outward.</TooltipContent>
                                </UiTooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <UiTooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-900/10 cursor-help">Recorded Closing</th>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Actual physical count entered for the closing date.</TooltipContent>
                                </UiTooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <UiTooltip delayDuration={300}>
                                  <TooltipTrigger asChild>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-help">Variance</th>
                                  </TooltipTrigger>
                                  <TooltipContent className="text-xs">Difference between Recorded and Expected closing stock. 0 means matched.</TooltipContent>
                                </UiTooltip>
                              </TooltipProvider>
                              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-400">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.rows
                              .filter(r => reportStatusFilter === 'all' || r.status === reportStatusFilter)
                              .sort((a, b) => {
                                const order = { shortage: 0, no_closing: 1, surplus: 2, matched: 3, no_movement: 4 }
                                return order[a.status] - order[b.status]
                              })
                              .map((row, i) => {
                                const isExpanded = expandedRows.has(row.itemId)
                                const hasBreakdown = Object.keys(row.inwardByType).length > 0 || Object.keys(row.outwardByType).length > 0 || Object.keys(row.closingByType).length > 0

                                const statusConfig = {
                                  matched:     { label: 'Matched',     bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
                                  surplus:     { label: 'Surplus',     bg: 'bg-blue-100 dark:bg-blue-900/30',    text: 'text-blue-700 dark:text-blue-400',    dot: 'bg-blue-500' },
                                  shortage:    { label: 'Shortage',    bg: 'bg-red-100 dark:bg-red-900/30',      text: 'text-red-700 dark:text-red-400',      dot: 'bg-red-500' },
                                  no_closing:  { label: 'No Closing',  bg: 'bg-amber-100 dark:bg-amber-900/30',  text: 'text-amber-700 dark:text-amber-400',  dot: 'bg-amber-500' },
                                  no_movement: { label: 'No Movement', bg: 'bg-slate-100 dark:bg-slate-800',     text: 'text-slate-500 dark:text-slate-400',  dot: 'bg-slate-400' },
                                }
                                const sc = statusConfig[row.status]

                                return (
                                  <React.Fragment key={row.itemId}>
                                    <tr
                                      className={`border-b border-slate-100 dark:border-slate-800 ${i % 2 === 0 ? '' : 'bg-slate-50/40 dark:bg-slate-800/10'} hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${hasBreakdown ? 'cursor-pointer' : ''}`}
                                      onClick={() => {
                                        if (!hasBreakdown) return
                                        setExpandedRows(prev => {
                                          const next = new Set(prev)
                                          next.has(row.itemId) ? next.delete(row.itemId) : next.add(row.itemId)
                                          return next
                                        })
                                      }}
                                    >
                                      <td className="px-4 py-3 w-8">
                                        {hasBreakdown && (
                                          isExpanded
                                            ? <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
                                            : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                                        )}
                                      </td>
                                      <td className="px-4 py-3">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{row.itemName}</p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">{row.unit}</p>
                                      </td>
                                      <td className="px-4 py-3">
                                        <Badge variant="secondary" className="text-[10px] rounded-lg font-medium">{row.category}</Badge>
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-emerald-700 dark:text-emerald-400">
                                        {row.inward > 0 ? `+${row.inward}` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                                        {row.outward > 0 ? `-${row.outward}` : <span className="text-slate-300 dark:text-slate-600">—</span>}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-violet-700 dark:text-violet-400">
                                        {row.expectedClosing}
                                      </td>
                                      <td className="px-4 py-3 text-right font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/40 dark:bg-amber-900/10">
                                        {row.closingRecorded > 0 ? row.closingRecorded : <span className="text-slate-300 dark:text-slate-600 font-normal italic text-xs">not recorded</span>}
                                      </td>
                                      <td className="px-4 py-3 text-right">
                                        {row.variance === 0 ? (
                                          <span className="text-slate-400 dark:text-slate-500 text-xs">0</span>
                                        ) : (
                                          <span className={`font-bold text-sm ${row.variance > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {row.variance > 0 ? `+${row.variance}` : row.variance}
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
                                          <span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
                                          {sc.label}
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Expanded breakdown row */}
                                    {isExpanded && (
                                      <tr className="bg-slate-50 dark:bg-slate-800/30 border-b border-slate-200 dark:border-slate-700">
                                        <td colSpan={9} className="px-6 py-4">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* Inward breakdown */}
                                            <div>
                                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Inward by Type
                                              </p>
                                              {Object.keys(row.inwardByType).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No inward entries</p>
                                              ) : (
                                                <div className="space-y-1">
                                                  {Object.entries(row.inwardByType).map(([type, qty]) => (
                                                    <div key={type} className="flex items-center justify-between">
                                                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">{type}</span>
                                                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">+{qty}</span>
                                                    </div>
                                                  ))}
                                                  <div className="border-t border-emerald-200 dark:border-emerald-800 pt-1 mt-1 flex justify-between">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total</span>
                                                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+{row.inward}</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Outward breakdown */}
                                            <div>
                                              <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />Outward by Type
                                              </p>
                                              {Object.keys(row.outwardByType).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No outward entries</p>
                                              ) : (
                                                <div className="space-y-1">
                                                  {Object.entries(row.outwardByType).map(([type, qty]) => (
                                                    <div key={type} className="flex items-center justify-between">
                                                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">{type}</span>
                                                      <span className="text-xs font-semibold text-red-600 dark:text-red-400 shrink-0">-{qty}</span>
                                                    </div>
                                                  ))}
                                                  <div className="border-t border-red-200 dark:border-red-800 pt-1 mt-1 flex justify-between">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total</span>
                                                    <span className="text-xs font-bold text-red-600 dark:text-red-400">-{row.outward}</span>
                                                  </div>
                                                </div>
                                              )}
                                            </div>

                                            {/* Closing breakdown */}
                                            <div>
                                              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />Closing by Sub-Type
                                              </p>
                                              {Object.keys(row.closingByType).length === 0 ? (
                                                <p className="text-xs text-slate-400 italic">No closing entry recorded</p>
                                              ) : (
                                                <div className="space-y-1">
                                                  {Object.entries(row.closingByType).map(([type, qty]) => (
                                                    <div key={type} className="flex items-center justify-between">
                                                      <span className="text-xs text-slate-600 dark:text-slate-400 truncate mr-2">{type}</span>
                                                      <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 shrink-0">{qty}</span>
                                                    </div>
                                                  ))}
                                                  <div className="border-t border-amber-200 dark:border-amber-800 pt-1 mt-1 flex justify-between">
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Total</span>
                                                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400">{row.closingRecorded}</span>
                                                  </div>
                                                </div>
                                              )}
                                              {row.closingRecorded > 0 && (
                                                <div className={`mt-3 px-3 py-2 rounded-lg text-xs font-medium ${row.variance === 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : row.variance > 0 ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'}`}>
                                                  Expected: {row.expectedClosing} · Recorded: {row.closingRecorded} · Variance: {row.variance > 0 ? `+${row.variance}` : row.variance}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    )}
                                  </React.Fragment>
                                )
                              })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}

              {!report && (
                <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                  <CardContent className="py-16 flex flex-col items-center gap-3 text-slate-400">
                    <FileBarChart2 className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Loading report…</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>This action cannot be undone. The entry will be permanently removed.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="rounded-xl" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditingItem ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogDescription>{isEditingItem ? 'Update this product\'s details' : 'Create a new inventory product type'}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Name *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Auravill Health" className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-sm font-medium">Base Unit</Label>
                <Select value={itemForm.unitType} onValueChange={v => setItemForm(p => ({ ...p, unitType: v }))}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm font-medium">Sub-Types <span className="text-slate-400 font-normal">(comma-separated)</span></Label>
              <Input value={itemForm.subTypes} onChange={e => setItemForm(p => ({ ...p, subTypes: e.target.value }))} placeholder="50 Pcs Boxes, Loose Pcs in Box" className="rounded-xl" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="rounded-xl" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} className="rounded-xl bg-emerald-600 hover:bg-emerald-700">{isEditingItem ? 'Update Product' : 'Add Product'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAB */}
      <Button
        className="fixed bottom-6 right-6 h-12 w-12 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/50 bg-emerald-600 hover:bg-emerald-700 z-30"
        size="icon"
        onClick={() => { setIsEditingItem(false); setItemForm({ id: '', name: '', category: 'Health', unitType: 'Pack', subTypes: '' }); setItemDialogOpen(true) }}
      >
        <Plus className="h-5 w-5" />
      </Button>
    </div>
  )
}
