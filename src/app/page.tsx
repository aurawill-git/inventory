'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
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
  DialogTrigger,
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
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
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  Package,
  RefreshCw,
  Settings,
  Download,
  ChevronDown,
  ArrowUpDown,
  Search,
  Filter,
  Sun,
  Moon,
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
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'
import {
  INWARD_TYPES,
  OUTWARD_TYPES,
  UNITS,
  CATEGORIES,
  type EntryWithItem,
  type InventoryItemWithSubTypes,
  getTodayString,
  formatDate,
  formatTimestamp,
} from '@/lib/inventory-types'

// Chart colors
const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#6366f1', '#14b8a6', '#e11d48', '#84cc16', '#a855f7']

type Item = InventoryItemWithSubTypes
type Entry = EntryWithItem

export default function InventoryApp() {
  // State
  const [activeTab, setActiveTab] = useState('dashboard')
  const [items, setItems] = useState<Item[]>([])
  const [inwardEntries, setInwardEntries] = useState<Entry[]>([])
  const [outwardEntries, setOutwardEntries] = useState<Entry[]>([])
  const [closingEntries, setClosingEntries] = useState<Entry[]>([])
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Date filters
  const [inwardDateFilter, setInwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [outwardDateFilter, setOutwardDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [analyticsDateFilter, setAnalyticsDateFilter] = useState<{ start: string; end: string }>({ start: '', end: '' })
  const [closingDate, setClosingDate] = useState(getTodayString())

  // Edit states
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  // Dialog states
  const [inwardDialogOpen, setInwardDialogOpen] = useState(false)
  const [outwardDialogOpen, setOutwardDialogOpen] = useState(false)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [closingDialogOpen, setClosingDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: string; id: string } | null>(null)

  // Form states
  const [inwardForm, setInwardForm] = useState({ itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', date: getTodayString() })
  const [outwardForm, setOutwardForm] = useState({ itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', date: getTodayString() })
  const [itemForm, setItemForm] = useState({ name: '', category: 'Health', unitType: 'Pack', subTypes: '' })
  const [closingForm, setClosingForm] = useState({ itemId: '', type: '', qty: '', unit: 'Box', box: '', date: getTodayString() })

  // Customization
  const [compactMode, setCompactMode] = useState(false)

  // Fetch functions
  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/items')
      if (res.ok) setItems(await res.json())
    } catch (e) { console.error(e) }
  }, [])

  const fetchInwards = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (inwardDateFilter.start) params.set('startDate', inwardDateFilter.start)
      if (inwardDateFilter.end) params.set('endDate', inwardDateFilter.end)
      const res = await fetch(`/api/inwards?${params}`)
      if (res.ok) setInwardEntries(await res.json())
    } catch (e) { console.error(e) }
  }, [inwardDateFilter])

  const fetchOutwards = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (outwardDateFilter.start) params.set('startDate', outwardDateFilter.start)
      if (outwardDateFilter.end) params.set('endDate', outwardDateFilter.end)
      const res = await fetch(`/api/outwards?${params}`)
      if (res.ok) setOutwardEntries(await res.json())
    } catch (e) { console.error(e) }
  }, [outwardDateFilter])

  const fetchClosing = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (closingDate) params.set('date', closingDate)
      const res = await fetch(`/api/closing?${params}`)
      if (res.ok) setClosingEntries(await res.json())
    } catch (e) { console.error(e) }
  }, [closingDate])

  const fetchAnalytics = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (analyticsDateFilter.start) params.set('startDate', analyticsDateFilter.start)
      if (analyticsDateFilter.end) params.set('endDate', analyticsDateFilter.end)
      const res = await fetch(`/api/analytics?${params}`)
      if (res.ok) setAnalytics(await res.json())
    } catch (e) { console.error(e) }
  }, [analyticsDateFilter])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchItems(), fetchInwards(), fetchOutwards(), fetchClosing(), fetchAnalytics()])
    setLoading(false)
  }, [fetchItems, fetchInwards, fetchOutwards, fetchClosing, fetchAnalytics])

  // Seed database on first load
  const hasSeeded = React.useRef(false)
  useEffect(() => {
    if (hasSeeded.current) return
    hasSeeded.current = true
    const seedIfEmpty = async () => {
      try {
        const checkRes = await fetch('/api/items')
        if (checkRes.ok) {
          const existing = await checkRes.json()
          if (existing.length === 0) {
            const res = await fetch('/api/seed', { method: 'POST' })
            if (res.ok) {
              toast({ title: 'Database seeded with sample data' })
              fetchItems()
            }
          }
        }
      } catch (e) { console.error(e) }
    }
    seedIfEmpty()
  }, [fetchItems])

  // Track a refresh key to trigger data fetching
  const [refreshKey, setRefreshKey] = useState(0)
  const refreshData = useCallback(() => setRefreshKey(k => k + 1), [])

  // Fetch all data on mount and when filters/refreshKey change
  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [itemsRes, inwardsRes, outwardsRes, closingRes, analyticsRes] = await Promise.all([
          fetch('/api/items'),
          fetch(`/api/inwards?${new URLSearchParams(Object.entries(inwardDateFilter).filter(([, v]) => v)).toString()}`),
          fetch(`/api/outwards?${new URLSearchParams(Object.entries(outwardDateFilter).filter(([, v]) => v)).toString()}`),
          fetch(`/api/closing?${closingDate ? `date=${closingDate}` : ''}`),
          fetch(`/api/analytics?${new URLSearchParams(Object.entries(analyticsDateFilter).filter(([, v]) => v)).toString()}`),
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, inwardDateFilter, outwardDateFilter, closingDate, analyticsDateFilter])

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAllData()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchAllData])

  // CRUD handlers
  const handleAddInward = async () => {
    if (!inwardForm.itemId || !inwardForm.type || !inwardForm.qty) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/inwards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inwardForm),
      })
      if (res.ok) {
        toast({ title: 'Inward entry added successfully' })
        setInwardDialogOpen(false)
        setInwardForm({ itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', date: getTodayString() })
        fetchInwards()
        fetchAnalytics()
        fetchClosing()
      }
    } catch (e) { console.error(e) }
  }

  const handleAddOutward = async () => {
    if (!outwardForm.itemId || !outwardForm.type || !outwardForm.qty) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/outwards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(outwardForm),
      })
      if (res.ok) {
        toast({ title: 'Outward entry added successfully' })
        setOutwardDialogOpen(false)
        setOutwardForm({ itemId: '', type: '', qty: '', unit: 'Pack', remarks: '', date: getTodayString() })
        fetchOutwards()
        fetchAnalytics()
        fetchClosing()
      }
    } catch (e) { console.error(e) }
  }

  const handleAddClosing = async () => {
    if (!closingForm.itemId || !closingForm.type || !closingForm.qty) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
      return
    }
    try {
      const res = await fetch('/api/closing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(closingForm),
      })
      if (res.ok) {
        toast({ title: 'Closing inventory entry added' })
        setClosingDialogOpen(false)
        setClosingForm({ itemId: '', type: '', qty: '', unit: 'Box', box: '', date: getTodayString() })
        fetchClosing()
        fetchAnalytics()
      }
    } catch (e) { console.error(e) }
  }

  const handleAddItem = async () => {
    if (!itemForm.name || !itemForm.category) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' })
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
        toast({ title: 'Item added successfully' })
        setItemDialogOpen(false)
        setItemForm({ name: '', category: 'Health', unitType: 'Pack', subTypes: '' })
        fetchItems()
      }
    } catch (e) { console.error(e) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      const res = await fetch(`/api/${deleteTarget.type}?id=${deleteTarget.id}`, { method: 'DELETE' })
      if (res.ok) {
        toast({ title: 'Entry deleted successfully' })
        setDeleteDialogOpen(false)
        setDeleteTarget(null)
        fetchInwards()
        fetchOutwards()
        fetchClosing()
        fetchAnalytics()
      }
    } catch (e) { console.error(e) }
  }

  const handleClosingEdit = async (id: string, field: 'qty' | 'box', value: string) => {
    try {
      const res = await fetch('/api/closing', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, [field]: value }),
      })
      if (res.ok) {
        toast({ title: 'Updated successfully' })
        setEditingCell(null)
        fetchClosing()
      }
    } catch (e) { console.error(e) }
  }

  const handleRemarksEdit = async (type: 'inwards' | 'outwards', id: string, remarks: string) => {
    try {
      const res = await fetch(`/api/${type}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, remarks }),
      })
      if (res.ok) {
        toast({ title: 'Remarks updated' })
        setEditingCell(null)
        if (type === 'inwards') fetchInwards()
        else fetchOutwards()
      }
    } catch (e) { console.error(e) }
  }

  const handleExportCSV = (data: Entry[], filename: string) => {
    const headers = ['Item Name', 'Type', 'Qty', 'Unit', 'Remarks', 'Box', 'Date', 'Timestamp']
    const rows = data.map(e => [
      e.item.name, e.type, e.qty, e.unit,
      e.remarks || '', (e as EntryWithItem & { box?: string | null }).box || '',
      formatDate(e.date), formatTimestamp(e.createdAt)
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename}_${getTodayString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Filter entries by search
  const filterEntries = (entries: Entry[]) => {
    if (!searchQuery) return entries
    const q = searchQuery.toLowerCase()
    return entries.filter(e =>
      e.item.name.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q) ||
      (e.remarks && e.remarks.toLowerCase().includes(q))
    )
  }

  // Group closing entries by item
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

  const cellPad = compactMode ? 'p-1.5' : 'p-3'
  const headerPad = compactMode ? 'p-1.5' : 'p-3'

  return (
    <div className={`min-h-screen bg-background transition-colors duration-300`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center px-4 md:px-6 gap-4">
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-emerald-600" />
            <h1 className="text-xl font-bold tracking-tight">Inventory Manager</h1>
          </div>

          <div className="flex-1 flex items-center justify-center max-w-md mx-auto">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search items, types, remarks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => { refreshData() }} title="Refresh data">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDarkMode(!darkMode)} title="Toggle dark mode">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setCompactMode(!compactMode)} title="Toggle compact mode">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 md:p-6 max-w-[1600px] mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5 lg:w-auto lg:inline-grid">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4 hidden sm:block" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="inwards" className="gap-1.5">
              <PackagePlus className="h-4 w-4 hidden sm:block" />
              Inwards
            </TabsTrigger>
            <TabsTrigger value="outwards" className="gap-1.5">
              <PackageMinus className="h-4 w-4 hidden sm:block" />
              Outwards
            </TabsTrigger>
            <TabsTrigger value="closing" className="gap-1.5">
              <Archive className="h-4 w-4 hidden sm:block" />
              Closing
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1.5">
              <BarChart3 className="h-4 w-4 hidden sm:block" />
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* ===== DASHBOARD TAB ===== */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <Card className="border-l-4 border-l-emerald-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-emerald-600 font-medium">Total Inward</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalInward || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 text-emerald-500" />
                    Stock received
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-red-600 font-medium">Total Outward</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalOutward || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    Stock dispatched
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-amber-600 font-medium">Closing Stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.totalClosing || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <Archive className="h-3 w-3 mr-1 text-amber-500" />
                    Current stock
                  </div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-2">
                  <CardDescription className="text-purple-600 font-medium">Net Movement</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{summary?.netMovement || 0}</div>
                  <div className="flex items-center text-xs text-muted-foreground mt-1">
                    <ArrowUpDown className="h-3 w-3 mr-1 text-purple-500" />
                    In - Out
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Charts */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Inward vs Outward Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={dailyTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="inward" fill="#10b981" name="Inward" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="outward" fill="#ef4444" name="Outward" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Closing Stock by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={closingByCategory}
                        dataKey="qty"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        label={({ category, qty }) => `${category}: ${qty}`}
                      >
                        {closingByCategory.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Entries */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Inward Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {filterEntries(inwardEntries).slice(0, 10).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted">
                          <div>
                            <div className="font-medium text-sm">{entry.item.name}</div>
                            <div className="text-xs text-muted-foreground">{entry.type} · {formatDate(entry.date)}</div>
                          </div>
                          <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                            +{entry.qty} {entry.unit}
                          </Badge>
                        </div>
                      ))}
                      {inwardEntries.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No entries yet</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Outward Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {filterEntries(outwardEntries).slice(0, 10).map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted">
                          <div>
                            <div className="font-medium text-sm">{entry.item.name}</div>
                            <div className="text-xs text-muted-foreground">{entry.type} · {formatDate(entry.date)}</div>
                          </div>
                          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            -{entry.qty} {entry.unit}
                          </Badge>
                        </div>
                      ))}
                      {outwardEntries.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No entries yet</div>}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== INWARDS TAB ===== */}
          <TabsContent value="inwards" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">Inward Entries</h2>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
                  {filterEntries(inwardEntries).length} entries
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">From</Label>
                  <Input type="date" value={inwardDateFilter.start} onChange={e => setInwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">To</Label>
                  <Input type="date" value={inwardDateFilter.end} onChange={e => setInwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                {(inwardDateFilter.start || inwardDateFilter.end) && (
                  <Button variant="ghost" size="sm" onClick={() => setInwardDateFilter({ start: '', end: '' })} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(inwardEntries, 'inwards')} className="h-8">
                  <Download className="h-3 w-3 mr-1" />Export
                </Button>
                <Dialog open={inwardDialogOpen} onOpenChange={setInwardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-3 w-3 mr-1" />Add Inward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Inward Entry</DialogTitle>
                      <DialogDescription>Record incoming inventory with timestamp</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-1.5">
                        <Label>Item *</Label>
                        <Select value={inwardForm.itemId} onValueChange={v => setInwardForm(p => ({ ...p, itemId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>
                            {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Type *</Label>
                        <Select value={inwardForm.type} onValueChange={v => setInwardForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {INWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label>Quantity *</Label>
                          <Input type="number" min="0" step="0.01" value={inwardForm.qty} onChange={e => setInwardForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Unit</Label>
                          <Select value={inwardForm.unit} onValueChange={v => setInwardForm(p => ({ ...p, unit: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Date *</Label>
                        <Input type="date" value={inwardForm.date} onChange={e => setInwardForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Remarks</Label>
                        <Input value={inwardForm.remarks} onChange={e => setInwardForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional remarks" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInwardDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddInward} className="bg-emerald-600 hover:bg-emerald-700">Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-emerald-600 hover:bg-emerald-600">
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Item Name</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad} bg-yellow-400 text-black`}>Remarks</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Date</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Timestamp</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterEntries(inwardEntries).map(entry => (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className={`font-medium ${cellPad}`}>{entry.item.name}</TableCell>
                          <TableCell className={cellPad}>
                            <Badge variant="outline" className="text-xs">{entry.type}</Badge>
                          </TableCell>
                          <TableCell className={cellPad}>{entry.qty}</TableCell>
                          <TableCell className={cellPad}>{entry.unit}</TableCell>
                          <TableCell className={`${cellPad} bg-yellow-50 dark:bg-yellow-900/20`}>
                            {editingCell === `inward-remarks-${entry.id}` ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="h-7 text-xs"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleRemarksEdit('inwards', entry.id, editValue)
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemarksEdit('inwards', entry.id, editValue)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 cursor-pointer min-h-[24px]" onClick={() => { setEditingCell(`inward-remarks-${entry.id}`); setEditValue(entry.remarks || '') }}>
                                <span className="text-xs">{entry.remarks || <span className="text-muted-foreground italic">Click to edit</span>}</span>
                                <Edit3 className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={cellPad}>{formatDate(entry.date)}</TableCell>
                          <TableCell className={`text-xs text-muted-foreground ${cellPad}`}>{formatTimestamp(entry.createdAt)}</TableCell>
                          <TableCell className={cellPad}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget({ type: 'inwards', id: entry.id }); setDeleteDialogOpen(true) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {inwardEntries.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No inward entries yet. Add your first entry!</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== OUTWARDS TAB ===== */}
          <TabsContent value="outwards" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">Outward Entries</h2>
                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {filterEntries(outwardEntries).length} entries
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">From</Label>
                  <Input type="date" value={outwardDateFilter.start} onChange={e => setOutwardDateFilter(p => ({ ...p, start: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">To</Label>
                  <Input type="date" value={outwardDateFilter.end} onChange={e => setOutwardDateFilter(p => ({ ...p, end: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                {(outwardDateFilter.start || outwardDateFilter.end) && (
                  <Button variant="ghost" size="sm" onClick={() => setOutwardDateFilter({ start: '', end: '' })} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />Clear
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(outwardEntries, 'outwards')} className="h-8">
                  <Download className="h-3 w-3 mr-1" />Export
                </Button>
                <Dialog open={outwardDialogOpen} onOpenChange={setOutwardDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 bg-red-600 hover:bg-red-700">
                      <Plus className="h-3 w-3 mr-1" />Add Outward
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Outward Entry</DialogTitle>
                      <DialogDescription>Record outgoing inventory with timestamp</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-1.5">
                        <Label>Item *</Label>
                        <Select value={outwardForm.itemId} onValueChange={v => setOutwardForm(p => ({ ...p, itemId: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>
                            {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Type *</Label>
                        <Select value={outwardForm.type} onValueChange={v => setOutwardForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {OUTWARD_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label>Quantity *</Label>
                          <Input type="number" min="0" step="0.01" value={outwardForm.qty} onChange={e => setOutwardForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Unit</Label>
                          <Select value={outwardForm.unit} onValueChange={v => setOutwardForm(p => ({ ...p, unit: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Date *</Label>
                        <Input type="date" value={outwardForm.date} onChange={e => setOutwardForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Remarks</Label>
                        <Input value={outwardForm.remarks} onChange={e => setOutwardForm(p => ({ ...p, remarks: e.target.value }))} placeholder="Optional remarks" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOutwardDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddOutward} className="bg-red-600 hover:bg-red-700">Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-red-600 hover:bg-red-600">
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Item Name</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad} bg-yellow-400 text-black`}>Remarks</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Date</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Timestamp</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filterEntries(outwardEntries).map(entry => (
                        <TableRow key={entry.id} className="hover:bg-muted/50">
                          <TableCell className={`font-medium ${cellPad}`}>{entry.item.name}</TableCell>
                          <TableCell className={cellPad}>
                            <Badge variant="outline" className="text-xs">{entry.type}</Badge>
                          </TableCell>
                          <TableCell className={cellPad}>{entry.qty}</TableCell>
                          <TableCell className={cellPad}>{entry.unit}</TableCell>
                          <TableCell className={`${cellPad} bg-yellow-50 dark:bg-yellow-900/20`}>
                            {editingCell === `outward-remarks-${entry.id}` ? (
                              <div className="flex items-center gap-1">
                                <Input
                                  value={editValue}
                                  onChange={e => setEditValue(e.target.value)}
                                  className="h-7 text-xs"
                                  autoFocus
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleRemarksEdit('outwards', entry.id, editValue)
                                    if (e.key === 'Escape') setEditingCell(null)
                                  }}
                                />
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRemarksEdit('outwards', entry.id, editValue)}>
                                  <Save className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 cursor-pointer min-h-[24px]" onClick={() => { setEditingCell(`outward-remarks-${entry.id}`); setEditValue(entry.remarks || '') }}>
                                <span className="text-xs">{entry.remarks || <span className="text-muted-foreground italic">Click to edit</span>}</span>
                                <Edit3 className="h-3 w-3 text-muted-foreground" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className={cellPad}>{formatDate(entry.date)}</TableCell>
                          <TableCell className={`text-xs text-muted-foreground ${cellPad}`}>{formatTimestamp(entry.createdAt)}</TableCell>
                          <TableCell className={cellPad}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget({ type: 'outwards', id: entry.id }); setDeleteDialogOpen(true) }}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {outwardEntries.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No outward entries yet. Add your first entry!</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== CLOSING INVENTORY TAB ===== */}
          <TabsContent value="closing" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">Closing Inventory</h2>
                <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                  {closingEntries.length} items
                </Badge>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">Date</Label>
                  <Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="h-8 text-xs w-[160px]" />
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(closingEntries, 'closing-inventory')} className="h-8">
                  <Download className="h-3 w-3 mr-1" />Export
                </Button>
                <Dialog open={closingDialogOpen} onOpenChange={setClosingDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 bg-amber-600 hover:bg-amber-700">
                      <Plus className="h-3 w-3 mr-1" />Add Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Closing Inventory Entry</DialogTitle>
                      <DialogDescription>Record closing stock with editable box count</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-3 py-2">
                      <div className="grid gap-1.5">
                        <Label>Item *</Label>
                        <Select value={closingForm.itemId} onValueChange={v => {
                          const item = items.find(i => i.id === v)
                          setClosingForm(p => ({ ...p, itemId: v, unit: item?.unitType || 'Box' }))
                        }}>
                          <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                          <SelectContent>
                            {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Sub-Type *</Label>
                        <Select value={closingForm.type} onValueChange={v => setClosingForm(p => ({ ...p, type: v }))}>
                          <SelectTrigger><SelectValue placeholder="Select sub-type" /></SelectTrigger>
                          <SelectContent>
                            {closingForm.itemId && (() => {
                              const item = items.find(i => i.id === closingForm.itemId)
                              if (!item) return null
                              return JSON.parse(item.subTypes || '[]').map((t: string) => <SelectItem key={t} value={t}>{t}</SelectItem>)
                            })()}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="grid gap-1.5">
                          <Label>Quantity *</Label>
                          <Input type="number" min="0" step="0.01" value={closingForm.qty} onChange={e => setClosingForm(p => ({ ...p, qty: e.target.value }))} placeholder="0" />
                        </div>
                        <div className="grid gap-1.5">
                          <Label>Unit</Label>
                          <Select value={closingForm.unit} onValueChange={v => setClosingForm(p => ({ ...p, unit: v }))}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-1.5">
                        <Label className="flex items-center gap-1">Box <span className="bg-yellow-200 dark:bg-yellow-800 px-1.5 py-0.5 rounded text-xs">Editable</span></Label>
                        <Input value={closingForm.box} onChange={e => setClosingForm(p => ({ ...p, box: e.target.value }))} placeholder="Box count (editable)" className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" />
                      </div>
                      <div className="grid gap-1.5">
                        <Label>Date *</Label>
                        <Input type="date" value={closingForm.date} onChange={e => setClosingForm(p => ({ ...p, date: e.target.value }))} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setClosingDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleAddClosing} className="bg-amber-600 hover:bg-amber-700">Add Entry</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Info Banner */}
            <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="h-4 w-4 bg-yellow-400 rounded" />
              <span className="text-sm text-yellow-800 dark:text-yellow-300">
                <strong>Yellow cells</strong> are editable (Box, Qty) — click to modify. All other cells are read-only/display only.
              </span>
            </div>

            {/* Closing Inventory Table - Grouped by Item */}
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="max-h-[600px]">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-amber-600 hover:bg-amber-600">
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Item Name</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Type</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad} bg-yellow-400 text-black`}>Qty</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Unit</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad} bg-yellow-400 text-black`}>Box</TableHead>
                        <TableHead className={`text-white font-semibold ${headerPad}`}>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {Object.entries(groupedClosing).map(([itemName, entries]) => (
                        <React.Fragment key={itemName}>
                          {entries.map((entry, idx) => (
                            <TableRow key={entry.id} className={idx === 0 ? 'border-t-2 border-t-amber-300' : ''}>
                              {idx === 0 ? (
                                <TableCell className={`font-bold text-amber-800 dark:text-amber-300 ${cellPad}`} rowSpan={entries.length}>
                                  {itemName}
                                </TableCell>
                              ) : null}
                              <TableCell className={cellPad}>
                                <span className="text-xs">{entry.type}</span>
                              </TableCell>
                              <TableCell className={`${cellPad} bg-yellow-50 dark:bg-yellow-900/20`}>
                                {editingCell === `closing-qty-${entry.id}` ? (
                                  <div className="flex items-center gap-1">
                                    <Input type="number" value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-xs w-20" autoFocus
                                      onKeyDown={e => { if (e.key === 'Enter') handleClosingEdit(entry.id, 'qty', editValue); if (e.key === 'Escape') setEditingCell(null) }} />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleClosingEdit(entry.id, 'qty', editValue)}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded" onClick={() => { setEditingCell(`closing-qty-${entry.id}`); setEditValue(String(entry.qty)) }}>
                                    {entry.qty}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className={cellPad}>{entry.unit}</TableCell>
                              <TableCell className={`${cellPad} bg-yellow-50 dark:bg-yellow-900/20`}>
                                {editingCell === `closing-box-${entry.id}` ? (
                                  <div className="flex items-center gap-1">
                                    <Input value={editValue} onChange={e => setEditValue(e.target.value)} className="h-7 text-xs w-20" autoFocus
                                      onKeyDown={e => { if (e.key === 'Enter') handleClosingEdit(entry.id, 'box', editValue); if (e.key === 'Escape') setEditingCell(null) }} />
                                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleClosingEdit(entry.id, 'box', editValue)}>
                                      <Save className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="cursor-pointer hover:bg-yellow-200 dark:hover:bg-yellow-800 px-1 rounded" onClick={() => { setEditingCell(`closing-box-${entry.id}`); setEditValue(entry.box || '') }}>
                                    {entry.box || <span className="text-muted-foreground italic text-xs">Click</span>}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className={cellPad}>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => { setDeleteTarget({ type: 'closing', id: entry.id }); setDeleteDialogOpen(true) }}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      ))}
                      {closingEntries.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No closing entries for this date.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ===== ANALYTICS TAB ===== */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Analytics Dashboard</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">From</Label>
                  <Input type="date" value={analyticsDateFilter.start} onChange={e => setAnalyticsDateFilter(p => ({ ...p, start: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                <div className="flex items-center gap-1.5">
                  <Label className="text-xs whitespace-nowrap">To</Label>
                  <Input type="date" value={analyticsDateFilter.end} onChange={e => setAnalyticsDateFilter(p => ({ ...p, end: e.target.value }))} className="h-8 text-xs w-[140px]" />
                </div>
                {(analyticsDateFilter.start || analyticsDateFilter.end) && (
                  <Button variant="ghost" size="sm" onClick={() => setAnalyticsDateFilter({ start: '', end: '' })} className="h-8 text-xs">
                    <X className="h-3 w-3 mr-1" />Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Total Inward</div>
                  <div className="text-xl font-bold text-emerald-600">{summary?.totalInward || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Total Outward</div>
                  <div className="text-xl font-bold text-red-600">{summary?.totalOutward || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Closing Stock</div>
                  <div className="text-xl font-bold text-amber-600">{summary?.totalClosing || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Net Movement</div>
                  <div className="text-xl font-bold text-purple-600">{summary?.netMovement || 0}</div>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-cyan-500">
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground">Total Items</div>
                  <div className="text-xl font-bold text-cyan-600">{summary?.totalItems || 0}</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Daily Inward vs Outward Trend</CardTitle>
                  <CardDescription>Stock movement over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <AreaChart data={dailyTrend}>
                      <defs>
                        <linearGradient id="inwardGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="outwardGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="inward" stroke="#10b981" fill="url(#inwardGrad)" name="Inward" />
                      <Area type="monotone" dataKey="outward" stroke="#ef4444" fill="url(#outwardGrad)" name="Outward" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Closing Stock by Category</CardTitle>
                  <CardDescription>Distribution of current inventory</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={closingByCategory}
                        dataKey="qty"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        innerRadius={50}
                        label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {closingByCategory.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inward by Type</CardTitle>
                  <CardDescription>Breakdown of incoming stock sources</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inwardByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={160} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#10b981" name="Quantity" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outward by Type</CardTitle>
                  <CardDescription>Breakdown of outgoing stock channels</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={outwardByType} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis dataKey="type" type="category" tick={{ fontSize: 11 }} width={160} />
                      <Tooltip />
                      <Bar dataKey="qty" fill="#ef4444" name="Quantity" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 3 - Item level */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inward by Item</CardTitle>
                  <CardDescription>Which items received the most stock</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={inwardByItem}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="qty" name="Inward Qty">
                        {inwardByItem.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Outward by Item</CardTitle>
                  <CardDescription>Which items dispatched the most</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={outwardByItem}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={80} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="qty" name="Outward Qty">
                        {outwardByItem.map((_, idx) => (
                          <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this entry? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Floating Add Item Button */}
      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogTrigger asChild>
          <Button className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-emerald-600 hover:bg-emerald-700" size="icon">
            <Plus className="h-5 w-5" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
            <DialogDescription>Create a new item type for tracking</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid gap-1.5">
              <Label>Item Name *</Label>
              <Input value={itemForm.name} onChange={e => setItemForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g., Auravill Health" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Category</Label>
                <Select value={itemForm.category} onValueChange={v => setItemForm(p => ({ ...p, category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Unit Type</Label>
                <Select value={itemForm.unitType} onValueChange={v => setItemForm(p => ({ ...p, unitType: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Sub-Types (comma-separated)</Label>
              <Input value={itemForm.subTypes} onChange={e => setItemForm(p => ({ ...p, subTypes: e.target.value }))} placeholder="e.g., 50 Pcs Boxes, Loose Pcs in Box" />
            </div>
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
