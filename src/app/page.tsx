'use client'

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  UNITS,
  CATEGORIES,
  type EntryWithItem,
  type InventoryItemWithSubTypes,
  formatDate,
  formatTimestamp,
} from '@/lib/inventory-types'

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#a855f7']

type Item = InventoryItemWithSubTypes
type Entry = EntryWithItem

// Hook to avoid hydration mismatch using useSyncExternalStore (React 19 compliant)
const emptySubscribe = () => () => {}
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false)
}

// Get today deterministically on client only
function useTodayString() {
  const mounted = useMounted()
  return mounted ? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}` : ''
}

// Quick-fill row type for inline entry
interface QuickRow {
  id: string
  itemId: string
  type: string
  qty: string
  unit: string
  remarks: string
  box: string
}

let rowIdCounter = 0
function newQuickRow(): QuickRow {
  return { id: `qr-${++rowIdCounter}`, itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', box: '' }
}

export default function InventoryApp() {
  const mounted = useMounted()
  const todayStr = useTodayString()

  const [activeTab, setActiveTab] = useState('dashboard')
  const [items, setItems] = useState<Item[]>([])
  const [inwardEntries, setInwardEntries] = useState<Entry[]>([])
  const [outwardEntries, setOutwardEntries] = useState<Entry[]>([])
  const [closingEntries, setClosingEntries] = useState<Entry[]>([])
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [compactMode, setCompactMode] = useState(false)

  // Date filters
  const [inwardDateFilter, setInwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [outwardDateFilter, setOutwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [closingDate, setClosingDate] = useState('')

  // Inline quick-fill rows for Inwards
  const [inwardRows, setInwardRows] = useState<QuickRow[]>([newQuickRow()])
  const [inwardEntryDate, setInwardEntryDate] = useState('')

  // Inline quick-fill rows for Outwards
  const [outwardRows, setOutwardRows] = useState<QuickRow[]>([newQuickRow()])
  const [outwardEntryDate, setOutwardEntryDate] = useState('')

  // Inline quick-fill rows for Closing
  const [closingRows, setClosingRows] = useState<QuickRow[]>([newQuickRow()])
  const [closingEntryDate, setClosingEntryDate] = useState('')

  // Edit states
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)

  // Add item dialog
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [itemForm, setItemForm] = useState({ name: '', category: 'Health', unitType: 'Pack', subTypes: '' })

  // Initialize dates lazily (client-only to avoid hydration mismatch)
  const [datesInitialized, setDatesInitialized] = useState(false)
  if (mounted && !datesInitialized) {
    setDatesInitialized(true)
    const t = todayStr
    setClosingDate(t)
    setInwardEntryDate(t)
    setOutwardEntryDate(t)
    setClosingEntryDate(t)
  }

  // Fetch all data
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

        const [itemsRes, inwardsRes, outwardsRes, closingRes, analyticsRes] = await Promise.all([
          fetch('/api/items'),
          fetch(`/api/inwards?${iParams}`),
          fetch(`/api/outwards?${oParams}`),
          fetch(`/api/closing?${cParams}`),
          fetch(`/api/analytics?${aParams}`),
        ])
        if (itemsRes.ok) setItems(await itemsRes.json())
        if (inwardsRes.ok) setInwardEntries(await inwardsRes.json())
        if (outwardsRes.ok) setOutwardEntries(await outwardsRes.json())
        if (closingRes.ok) setClosingEntries(await closingRes.json())
        if (analyticsRes.ok) setAnalytics(await analyticsRes.json())
      } catch (e) { console.error(e) }
      setLoading(false)
    }
    load()
  }, [refreshKey, inwardDateFilter, outwardDateFilter, closingDate, analyticsDateFilter])

  // Seed on first load
  useEffect(() => {
    if (!mounted) return
    const seedIfEmpty = async () => {
      try {
        const res = await fetch('/api/items')
        if (res.ok) {
          const existing = await res.json()
          if (existing.length === 0) {
            const seedRes = await fetch('/api/seed', { method: 'POST' })
            if (seedRes.ok) {
              toast({ title: 'Sample data loaded' })
              refreshData()
            }
          }
        }
      } catch (e) { console.error(e) }
    }
    seedIfEmpty()
  }, [mounted, refreshData])

  // Dark mode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Auto-refresh
  useEffect(() => {
    const interval = setInterval(() => refreshData(), 30000)
    return () => clearInterval(interval)
  }, [refreshData])

  // ─── Inline row helpers ───
  const updateRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>, rowId: string, field: keyof QuickRow, value: string) => {
    setter(prev => prev.map(r => r.id === rowId ? { ...r, [field]: value } : r))
  }

  const addRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>) => {
    setter(prev => [...prev, newQuickRow()])
  }

  const removeRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>, rowId: string) => {
    setter(prev => prev.length > 1 ? prev.filter(r => r.id !== rowId) : prev)
  }

  const duplicateLastRow = (setter: React.Dispatch<React.SetStateAction<QuickRow[]>>) => {
    setter(prev => {
      const last = prev[prev.length - 1]
      return [...prev, { ...last, id: `qr-${++rowIdCounter}`, qty: '' }]
    })
  }

  // ─── Submit handlers ───
  const submitInwardRows = async () => {
    const validRows = inwardRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) {
      toast({ title: 'Error', description: 'Fill at least one row with Item, Type, and Qty', variant: 'destructive' })
      return
    }
    try {
      const results = await Promise.all(
        validRows.map(row =>
          fetch('/api/inwards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, remarks: row.remarks, date: inwardEntryDate }),
          })
        )
      )
      const allOk = results.every(r => r.ok)
      if (allOk) {
        toast({ title: `${validRows.length} inward entries added` })
        setInwardRows([newQuickRow()])
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const submitOutwardRows = async () => {
    const validRows = outwardRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) {
      toast({ title: 'Error', description: 'Fill at least one row with Item, Type, and Qty', variant: 'destructive' })
      return
    }
    try {
      const results = await Promise.all(
        validRows.map(row =>
          fetch('/api/outwards', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, remarks: row.remarks, date: outwardEntryDate }),
          })
        )
      )
      const allOk = results.every(r => r.ok)
      if (allOk) {
        toast({ title: `${validRows.length} outward entries added` })
        setOutwardRows([newQuickRow()])
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const submitClosingRows = async () => {
    const validRows = closingRows.filter(r => r.itemId && r.type && r.qty)
    if (validRows.length === 0) {
      toast({ title: 'Error', description: 'Fill at least one row', variant: 'destructive' })
      return
    }
    try {
      const results = await Promise.all(
        validRows.map(row =>
          fetch('/api/closing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: row.itemId, type: row.type, qty: row.qty, unit: row.unit, box: row.box, date: closingEntryDate }),
          })
        )
      )
      const allOk = results.every(r => r.ok)
      if (allOk) {
        toast({ title: `${validRows.length} closing entries added` })
        setClosingRows([newQuickRow()])
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.category) {
      toast({ title: 'Error', description: 'Name and category required', variant: 'destructive' })
      return
    }
    try {
      const subTypes = itemForm.subTypes ? itemForm.subTypes.split(',').map(s => s.trim()) : [itemForm.unitType]
      const res = await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...itemForm, subTypes }),
      })
      if (res.ok) {
        toast({ title: 'Item added' })
        setItemDialogOpen(false)
        setItemForm({ name: '', category: 'Health', unitType: 'Pack', subTypes: '' })
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/${deleteTarget.type}?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Deleted' })
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const handleCellEdit = async (api: string, id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/${api}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      if (res.ok) {
        toast({ title: 'Updated' })
        setEditingCell(null)
        refreshData()
      }
    } catch (e) { console.error(e) }
  }

  const handleExportCSV = (data: Entry[], filename: string) => {
    const headers = ['Item Name', 'Type', 'Qty', 'Unit', 'Remarks', 'Box', 'Date', 'Timestamp']
    const rows = data.map(e => [e.item.name, e.type, e.qty, e.unit, e.remarks || '', e.box || '', formatDate(e.date), formatTimestamp(e.createdAt)])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}.csv`
    a.click()
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

  const cp = compactMode ? 'px-2 py-1' : 'px-3 py-2'
  const hp = compactMode ? 'px-2 py-1.5' : 'px-3 py-2.5'

  // Don't render date-dependent content until client-side mount
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading inventory...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 md:px-6 gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-bold tracking-tight">Inventory Manager</h1>
          </div>
          <div className="flex-1 flex items-center justify-center max-w-sm mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-8 bg-muted/50 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={refreshData}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDarkMode(!darkMode)}>{darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCompactMode(!compactMode)}><Settings className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="p-3 md:p-6 max-w-[1600px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-1 text-xs sm:text-sm"><LayoutDashboard className="h-4 w-4 hidden sm:block" />Dashboard</TabsTrigger>
            <TabsTrigger value="inwards" className="gap-1 text-xs sm:text-sm"><PackagePlus className="h-4 w-4 hidden sm:block" />Inwards</TabsTrigger>
            <TabsTrigger value="outwards" className="gap-1 text-xs sm:text-sm"><PackageMinus className="h-4 w-4 hidden sm:block" />Outwards</TabsTrigger>
            <TabsTrigger value="closing" className="gap-1 text-xs sm:text-sm"><Archive className="h-4 w-4 hidden sm:block" />Closing</TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1 text-xs sm:text-sm"><BarChart3 className="h-4 w-4 hidden sm:block" />Analytics</TabsTrigger>
          </TabsList>

          {/* ═══ DASHBOARD ═══ */}
          <TabsContent value="dashboard" className="space-y-4">
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
              {[
                { label: 'Total Inward', value: summary?.totalInward || 0, color: 'emerald', icon: TrendingUp },
                { label: 'Total Outward', value: summary?.totalOutward || 0, color: 'red', icon: TrendingDown },
                { label: 'Closing Stock', value: summary?.totalClosing || 0, color: 'amber', icon: Archive },
                { label: 'Net Movement', value: summary?.netMovement || 0, color: 'purple', icon: ArrowUpDown },
              ].map(s => (
                <Card key={s.label} className={`border-l-4 border-l-${s.color}-500`}>
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                    <div className={`text-2xl font-bold text-${s.color}-600`}>{s.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Inward vs Outward</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip /><Legend />
                      <Bar dataKey="inward" fill="#10b981" name="Inward" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outward" fill="#ef4444" name="Outward" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Closing by Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={closingByCategory} dataKey="qty" nameKey="category" cx="50%" cy="50%" outerRadius={85} label={({ category, qty }) => `${category}: ${qty}`}>
                        {closingByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Inwards</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px]">
                    <div className="space-y-1.5">
                      {filterEntries(inwardEntries).slice(0, 10).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div><div className="font-medium text-sm">{e.item.name}</div><div className="text-xs text-muted-foreground">{e.type} · {formatDate(e.date)}</div></div>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs">+{e.qty} {e.unit}</Badge>
                        </div>
                      ))}
                      {inwardEntries.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No entries</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Outwards</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[260px]">
                    <div className="space-y-1.5">
                      {filterEntries(outwardEntries).slice(0, 10).map(e => (
                        <div key={e.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                          <div><div className="font-medium text-sm">{e.item.name}</div><div className="text-xs text-muted-foreground">{e.type} · {formatDate(e.date)}</div></div>
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-xs">-{e.qty} {e.unit}</Badge>
                        </div>
                      ))}
                      {outwardEntries.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No entries</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ═══ INWARDS ═══ */}
          <TabsContent value="inwards" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold">Inwards</h2>
                <Badge variant="outline" className="text-xs">{filterEntries(inwardEntries).length}</Badge>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Label className="text-xs">From</Label>
                <Input type="date" value={inwardDateFilter.start} onChange={e => setInwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px]" />
                <Label className="text-xs">To</Label>
                <Input type="date" value={inwardDateFilter.end} onChange={e => setInwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px]" />
                {inwardDateFilter.start && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setInwardDateFilter({ start: '', end: '' })}><X className="h-3 w-3" /></Button>}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExportCSV(inwardEntries, 'inwards')}><Download className="h-3 w-3 mr-1" />CSV</Button>
              </div>
            </div>

            {/* ── QUICK-FILL ENTRY AREA ── */}
            <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Rows3 className="h-4 w-4" /> Quick Fill — Add Multiple Inward Entries</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">Date:</Label>
                    <Input type="date" value={inwardEntryDate} onChange={e => setInwardEntryDate(e.target.value)} className="h-7 text-xs w-[140px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-emerald-200 dark:border-emerald-800">
                        <th className={`${hp} text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300`}>Item *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300`}>Type *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 w-20`}>Qty *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 w-20`}>Unit</th>
                        <th className={`${hp} text-left text-xs font-semibold text-emerald-800 dark:text-emerald-300 bg-yellow-100 dark:bg-yellow-900/40`}>Remarks</th>
                        <th className={`${hp} w-24`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {inwardRows.map((row, idx) => (
                        <tr key={row.id} className="border-b border-emerald-100 dark:border-emerald-900/50">
                          <td className={cp}>
                            <Select value={row.itemId} onValueChange={v => updateRow(setInwardRows, row.id, 'itemId', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Item" /></SelectTrigger>
                              <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={cp}>
                            <Select value={row.type} onValueChange={v => updateRow(setInwardRows, row.id, 'type', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>{INWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={cp}>
                            <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setInwardRows, row.id, 'qty', e.target.value)} className="h-8 text-xs" placeholder="0" />
                          </td>
                          <td className={cp}>
                            <Select value={row.unit} onValueChange={v => updateRow(setInwardRows, row.id, 'unit', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                            <Input value={row.remarks} onChange={e => updateRow(setInwardRows, row.id, 'remarks', e.target.value)} className="h-8 text-xs bg-transparent" placeholder="—" />
                          </td>
                          <td className={cp}>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(setInwardRows, row.id)}><X className="h-3 w-3" /></Button>
                              {idx === inwardRows.length - 1 && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addRow(setInwardRows)} title="Add blank row"><Plus className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateLastRow(setInwardRows)} title="Duplicate last row"><Copy className="h-3 w-3" /></Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{inwardRows.filter(r => r.itemId && r.type && r.qty).length} row(s) ready</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setInwardRows([newQuickRow()])}>Clear All</Button>
                    <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={submitInwardRows}>
                      <Check className="h-3 w-3 mr-1" /> Submit All ({inwardRows.filter(r => r.itemId && r.type && r.qty).length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Existing entries */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-600 hover:bg-emerald-600">
                        <TableHead className={`text-white font-semibold ${hp}`}>Item</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${hp} bg-yellow-400 text-black`}>Remarks</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Date</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Timestamp</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterEntries(inwardEntries).map(e => (
                        <TableRow key={e.id} className="hover:bg-muted/50">
                          <TableCell className={`font-medium ${cp}`}>{e.item.name}</TableCell>
                          <TableCell className={cp}><Badge variant="outline" className="text-xs">{e.type}</Badge></TableCell>
                          <TableCell className={cp}>{e.qty}</TableCell>
                          <TableCell className={cp}>{e.unit}</TableCell>
                          <TableCell className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                            {editingCell === `ir-${e.id}` ? (
                              <div className="flex items-center gap-1">
                                <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs" autoFocus
                                  onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('inwards', e.id, 'remarks', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCellEdit('inwards', e.id, 'remarks', editValue)}><Save className="h-3 w-3" /></Button>
                              </div>
                            ) : (
                              <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded text-xs" onClick={() => { setEditingCell(`ir-${e.id}`); setEditValue(e.remarks || '') }}>{e.remarks || <span className="italic text-muted-foreground">edit</span>}</span>
                            )}
                          </TableCell>
                          <TableCell className={cp}>{formatDate(e.date)}</TableCell>
                          <TableCell className={`text-xs text-muted-foreground ${cp}`}>{formatTimestamp(e.createdAt)}</TableCell>
                          <TableCell className={cp}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteTarget({ type: 'inwards', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {inwardEntries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No entries</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ OUTWARDS ═══ */}
          <TabsContent value="outwards" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 className="text-base font-semibold">Outwards</h2><Badge variant="outline" className="text-xs">{filterEntries(outwardEntries).length}</Badge></div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Label className="text-xs">From</Label>
                <Input type="date" value={outwardDateFilter.start} onChange={e => setOutwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px]" />
                <Label className="text-xs">To</Label>
                <Input type="date" value={outwardDateFilter.end} onChange={e => setOutwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px]" />
                {outwardDateFilter.start && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setOutwardDateFilter({ start: '', end: '' })}><X className="h-3 w-3" /></Button>}
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExportCSV(outwardEntries, 'outwards')}><Download className="h-3 w-3 mr-1" />CSV</Button>
              </div>
            </div>

            {/* ── QUICK-FILL ENTRY AREA ── */}
            <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Rows3 className="h-4 w-4" /> Quick Fill — Add Multiple Outward Entries</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">Date:</Label>
                    <Input type="date" value={outwardEntryDate} onChange={e => setOutwardEntryDate(e.target.value)} className="h-7 text-xs w-[140px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-red-200 dark:border-red-800">
                        <th className={`${hp} text-left text-xs font-semibold text-red-800 dark:text-red-300`}>Item *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-red-800 dark:text-red-300`}>Type *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-red-800 dark:text-red-300 w-20`}>Qty *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-red-800 dark:text-red-300 w-20`}>Unit</th>
                        <th className={`${hp} text-left text-xs font-semibold text-red-800 dark:text-red-300 bg-yellow-100 dark:bg-yellow-900/40`}>Remarks</th>
                        <th className={`${hp} w-24`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {outwardRows.map((row, idx) => (
                        <tr key={row.id} className="border-b border-red-100 dark:border-red-900/50">
                          <td className={cp}>
                            <Select value={row.itemId} onValueChange={v => updateRow(setOutwardRows, row.id, 'itemId', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Item" /></SelectTrigger>
                              <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={cp}>
                            <Select value={row.type} onValueChange={v => updateRow(setOutwardRows, row.id, 'type', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
                              <SelectContent>{OUTWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={cp}>
                            <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setOutwardRows, row.id, 'qty', e.target.value)} className="h-8 text-xs" placeholder="0" />
                          </td>
                          <td className={cp}>
                            <Select value={row.unit} onValueChange={v => updateRow(setOutwardRows, row.id, 'unit', v)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                          </td>
                          <td className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                            <Input value={row.remarks} onChange={e => updateRow(setOutwardRows, row.id, 'remarks', e.target.value)} className="h-8 text-xs bg-transparent" placeholder="—" />
                          </td>
                          <td className={cp}>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(setOutwardRows, row.id)}><X className="h-3 w-3" /></Button>
                              {idx === outwardRows.length - 1 && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addRow(setOutwardRows)} title="Add row"><Plus className="h-3 w-3" /></Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateLastRow(setOutwardRows)} title="Duplicate"><Copy className="h-3 w-3" /></Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{outwardRows.filter(r => r.itemId && r.type && r.qty).length} row(s) ready</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setOutwardRows([newQuickRow()])}>Clear All</Button>
                    <Button size="sm" className="h-8 text-xs bg-red-600 hover:bg-red-700" onClick={submitOutwardRows}>
                      <Check className="h-3 w-3 mr-1" /> Submit All ({outwardRows.filter(r => r.itemId && r.type && r.qty).length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-600 hover:bg-red-600">
                        <TableHead className={`text-white font-semibold ${hp}`}>Item</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${hp} bg-yellow-400 text-black`}>Remarks</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Date</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Timestamp</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterEntries(outwardEntries).map(e => (
                        <TableRow key={e.id} className="hover:bg-muted/50">
                          <TableCell className={`font-medium ${cp}`}>{e.item.name}</TableCell>
                          <TableCell className={cp}><Badge variant="outline" className="text-xs">{e.type}</Badge></TableCell>
                          <TableCell className={cp}>{e.qty}</TableCell>
                          <TableCell className={cp}>{e.unit}</TableCell>
                          <TableCell className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                            {editingCell === `or-${e.id}` ? (
                              <div className="flex items-center gap-1">
                                <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs" autoFocus
                                  onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('outwards', e.id, 'remarks', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCellEdit('outwards', e.id, 'remarks', editValue)}><Save className="h-3 w-3" /></Button>
                              </div>
                            ) : (
                              <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded text-xs" onClick={() => { setEditingCell(`or-${e.id}`); setEditValue(e.remarks || '') }}>{e.remarks || <span className="italic text-muted-foreground">edit</span>}</span>
                            )}
                          </TableCell>
                          <TableCell className={cp}>{formatDate(e.date)}</TableCell>
                          <TableCell className={`text-xs text-muted-foreground ${cp}`}>{formatTimestamp(e.createdAt)}</TableCell>
                          <TableCell className={cp}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteTarget({ type: 'outwards', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {outwardEntries.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No entries</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ CLOSING INVENTORY ═══ */}
          <TabsContent value="closing" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 className="text-base font-semibold">Closing Inventory</h2><Badge variant="outline" className="text-xs">{closingEntries.length}</Badge></div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Label className="text-xs">Date</Label>
                <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="h-7 text-xs w-[140px]" />
                <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleExportCSV(closingEntries, 'closing')}><Download className="h-3 w-3 mr-1" />CSV</Button>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="h-4 w-4 bg-yellow-400 rounded shrink-0" />
              <span className="text-xs text-yellow-800 dark:text-yellow-300"><strong>Yellow cells</strong> are editable — click Qty or Box to modify.</span>
            </div>

            {/* ── QUICK-FILL FOR CLOSING ── */}
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2"><Rows3 className="h-4 w-4" /> Quick Fill — Add Closing Entries</CardTitle>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs font-medium">Date:</Label>
                    <Input type="date" value={closingEntryDate} onChange={e => setClosingEntryDate(e.target.value)} className="h-7 text-xs w-[140px]" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-3">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-amber-200 dark:border-amber-800">
                        <th className={`${hp} text-left text-xs font-semibold text-amber-800 dark:text-amber-300`}>Item *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-amber-800 dark:text-amber-300`}>Sub-Type *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-amber-800 dark:text-amber-300 bg-yellow-100 dark:bg-yellow-900/40 w-20`}>Qty *</th>
                        <th className={`${hp} text-left text-xs font-semibold text-amber-800 dark:text-amber-300 w-20`}>Unit</th>
                        <th className={`${hp} text-left text-xs font-semibold text-amber-800 dark:text-amber-300 bg-yellow-100 dark:bg-yellow-900/40 w-20`}>Box</th>
                        <th className={`${hp} w-24`}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {closingRows.map((row, idx) => {
                        const selectedItem = items.find(i => i.id === row.itemId)
                        const subTypes = selectedItem ? JSON.parse(selectedItem.subTypes || '[]') as string[] : []
                        return (
                          <tr key={row.id} className="border-b border-amber-100 dark:border-amber-900/50">
                            <td className={cp}>
                              <Select value={row.itemId} onValueChange={v => { updateRow(setClosingRows, row.id, 'itemId', v); updateRow(setClosingRows, row.id, 'type', ''); }}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Item" /></SelectTrigger>
                                <SelectContent>{items.map(i => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className={cp}>
                              <Select value={row.type} onValueChange={v => updateRow(setClosingRows, row.id, 'type', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Sub-type" /></SelectTrigger>
                                <SelectContent>{subTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                              <Input type="number" min="0" step="0.01" value={row.qty} onChange={e => updateRow(setClosingRows, row.id, 'qty', e.target.value)} className="h-8 text-xs bg-transparent" placeholder="0" />
                            </td>
                            <td className={cp}>
                              <Select value={row.unit} onValueChange={v => updateRow(setClosingRows, row.id, 'unit', v)}>
                                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                              </Select>
                            </td>
                            <td className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                              <Input value={row.box} onChange={e => updateRow(setClosingRows, row.id, 'box', e.target.value)} className="h-8 text-xs bg-transparent" placeholder="—" />
                            </td>
                            <td className={cp}>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeRow(setClosingRows, row.id)}><X className="h-3 w-3" /></Button>
                                {idx === closingRows.length - 1 && (
                                  <>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => addRow(setClosingRows)}><Plus className="h-3 w-3" /></Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => duplicateLastRow(setClosingRows)}><Copy className="h-3 w-3" /></Button>
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
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">{closingRows.filter(r => r.itemId && r.type && r.qty).length} row(s) ready</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setClosingRows([newQuickRow()])}>Clear All</Button>
                    <Button size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700" onClick={submitClosingRows}>
                      <Check className="h-3 w-3 mr-1" /> Submit All ({closingRows.filter(r => r.itemId && r.type && r.qty).length})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Existing closing entries */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[500px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-600 hover:bg-amber-600">
                        <TableHead className={`text-white font-semibold ${hp}`}>Item</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${hp} bg-yellow-400 text-black`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${hp} bg-yellow-400 text-black`}>Box</TableHead>
                        <TableHead className={`text-white font-semibold ${hp}`}></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedClosing).map(([name, entries]) => (
                        <React.Fragment key={name}>
                          {entries.map((e, idx) => (
                            <TableRow key={e.id} className={idx === 0 ? 'border-t-2 border-t-amber-300' : ''}>
                              {idx === 0 && <TableCell className={`font-bold text-amber-800 dark:text-amber-300 ${cp}`} rowSpan={entries.length}>{name}</TableCell>}
                              <TableCell className={cp}><span className="text-xs">{e.type}</span></TableCell>
                              <TableCell className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                                {editingCell === `cq-${e.id}` ? (
                                  <div className="flex items-center gap-1">
                                    <Input type="number" value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs w-16" autoFocus
                                      onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('closing', e.id, 'qty', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCellEdit('closing', e.id, 'qty', editValue)}><Save className="h-3 w-3" /></Button>
                                  </div>
                                ) : (
                                  <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded" onClick={() => { setEditingCell(`cq-${e.id}`); setEditValue(String(e.qty)) }}>{e.qty}</span>
                                )}
                              </TableCell>
                              <TableCell className={cp}>{e.unit}</TableCell>
                              <TableCell className={`${cp} bg-yellow-50 dark:bg-yellow-900/20`}>
                                {editingCell === `cb-${e.id}` ? (
                                  <div className="flex items-center gap-1">
                                    <Input value={editValue} onChange={ev => setEditValue(ev.target.value)} className="h-7 text-xs w-16" autoFocus
                                      onKeyDown={ev => { if (ev.key === 'Enter') handleCellEdit('closing', e.id, 'box', editValue); if (ev.key === 'Escape') setEditingCell(null) }} />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCellEdit('closing', e.id, 'box', editValue)}><Save className="h-3 w-3" /></Button>
                                  </div>
                                ) : (
                                  <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded" onClick={() => { setEditingCell(`cb-${e.id}`); setEditValue(e.box || '') }}>{e.box || <span className="italic text-muted-foreground text-xs">edit</span>}</span>
                                )}
                              </TableCell>
                              <TableCell className={cp}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setDeleteTarget({ type: 'closing', id: e.id }); setDeleteDialogOpen(true) }}><Trash2 className="h-3.5 w-3.5" /></Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      {closingEntries.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-6 text-muted-foreground">No entries for this date</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ ANALYTICS ═══ */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold">Analytics</h2>
              <div className="flex items-center gap-1.5">
                <Label className="text-xs">From</Label>
                <Input type="date" value={analyticsDateFilter.start} onChange={e => setAnalyticsDateFilter(p => ({ ...p, start: e.target.value }))} className="h-7 text-xs w-[130px]" />
                <Label className="text-xs">To</Label>
                <Input type="date" value={analyticsDateFilter.end} onChange={e => setAnalyticsDateFilter(p => ({ ...p, end: e.target.value }))} className="h-7 text-xs w-[130px]" />
                {analyticsDateFilter.start && <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAnalyticsDateFilter({ start: '', end: '' })}><X className="h-3 w-3" /></Button>}
              </div>
            </div>
            <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
              {[
                { label: 'Inward', val: summary?.totalInward || 0, c: 'emerald' },
                { label: 'Outward', val: summary?.totalOutward || 0, c: 'red' },
                { label: 'Closing', val: summary?.totalClosing || 0, c: 'amber' },
                { label: 'Net', val: summary?.netMovement || 0, c: 'purple' },
                { label: 'Items', val: summary?.totalItems || 0, c: 'cyan' },
              ].map(s => (
                <Card key={s.label}><CardContent className="p-3"><div className="text-xs text-muted-foreground">{s.label}</div><div className="text-xl font-bold">{s.val}</div></CardContent></Card>
              ))}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Trend</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="ig" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient>
                        <linearGradient id="og" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} /><stop offset="95%" stopColor="#ef4444" stopOpacity={0} /></linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} />
                      <Tooltip /><Legend />
                      <Area type="monotone" dataKey="inward" stroke="#10b981" fill="url(#ig)" name="Inward" />
                      <Area type="monotone" dataKey="outward" stroke="#ef4444" fill="url(#og)" name="Outward" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">By Category</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={closingByCategory} dataKey="qty" nameKey="category" cx="50%" cy="50%" outerRadius={95} innerRadius={45}
                        label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                        {closingByCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip /><Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Inward by Type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={inwardByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={150} />
                      <Tooltip /><Bar dataKey="qty" fill="#10b981" name="Qty" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Outward by Type</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={outwardByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 10 }} /><YAxis dataKey="type" type="category" tick={{ fontSize: 10 }} width={150} />
                      <Tooltip /><Bar dataKey="qty" fill="#ef4444" name="Qty" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Inward by Item</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={inwardByItem}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 10 }} /><Tooltip />
                      <Bar dataKey="qty" name="Inward">{inwardByItem.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Outward by Item</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={outwardByItem}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" height={70} />
                      <YAxis tick={{ fontSize: 10 }} /><Tooltip />
                      <Bar dataKey="qty" name="Outward">{outwardByItem.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Entry</DialogTitle><DialogDescription>Are you sure? This cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Item FAB */}
      <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700" size="icon" onClick={() => setItemDialogOpen(true)}>
        <Plus className="h-5 w-5" />
      </Button>
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Item</DialogTitle><DialogDescription>Create a new inventory item type</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5"><Label>Name *</Label><Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Auravill Health" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5"><Label>Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5"><Label>Unit</Label>
                <Select value={itemForm.unitType} onValueChange={v => setItemForm(p => ({ ...p, unitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5"><Label>Sub-Types (comma-separated)</Label><Input value={itemForm.subTypes} onChange={e => setItemForm(p => ({ ...p, subTypes: e.target.value }))} placeholder="50 Pcs Boxes, Loose Pcs in Box" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem} className="bg-emerald-600 hover:bg-emerald-700">Add Item</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
