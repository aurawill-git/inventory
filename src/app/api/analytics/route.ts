import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    let inwardQ = supabase.from('InwardEntry').select('type, qty, date, itemId')
    let outwardQ = supabase.from('OutwardEntry').select('type, qty, date, itemId')
    let closingQ = supabase.from('ClosingEntry').select('qty, date, item:InventoryItem(category)')

    if (startDate) { inwardQ = inwardQ.gte('date', startDate); outwardQ = outwardQ.gte('date', startDate); closingQ = closingQ.gte('date', startDate) }
    if (endDate) { inwardQ = inwardQ.lte('date', endDate); outwardQ = outwardQ.lte('date', endDate); closingQ = closingQ.lte('date', endDate) }

    const [{ data: inwardEntries }, { data: outwardEntries }, { data: closingEntries }, { data: items }] = await Promise.all([
      inwardQ, outwardQ, closingQ,
      supabase.from('InventoryItem').select('id, name'),
    ])

    const itemMap = new Map((items || []).map((i: { id: string; name: string }) => [i.id, i.name]))

    // Group by type
    const inwardByTypeMap = new Map<string, { qty: number; count: number }>()
    const outwardByTypeMap = new Map<string, { qty: number; count: number }>()
    const inwardByItemMap = new Map<string, number>()
    const outwardByItemMap = new Map<string, number>()
    const dailyMap = new Map<string, { inward: number; outward: number }>()

    for (const e of inwardEntries || []) {
      const t = inwardByTypeMap.get(e.type) || { qty: 0, count: 0 }
      inwardByTypeMap.set(e.type, { qty: t.qty + e.qty, count: t.count + 1 })
      inwardByItemMap.set(e.itemId, (inwardByItemMap.get(e.itemId) || 0) + e.qty)
      const dk = new Date(e.date).toISOString().split('T')[0]
      const d = dailyMap.get(dk) || { inward: 0, outward: 0 }
      dailyMap.set(dk, { ...d, inward: d.inward + e.qty })
    }

    for (const e of outwardEntries || []) {
      const t = outwardByTypeMap.get(e.type) || { qty: 0, count: 0 }
      outwardByTypeMap.set(e.type, { qty: t.qty + e.qty, count: t.count + 1 })
      outwardByItemMap.set(e.itemId, (outwardByItemMap.get(e.itemId) || 0) + e.qty)
      const dk = new Date(e.date).toISOString().split('T')[0]
      const d = dailyMap.get(dk) || { inward: 0, outward: 0 }
      dailyMap.set(dk, { ...d, outward: d.outward + e.qty })
    }

    const closingByCategory = new Map<string, number>()
    for (const e of closingEntries || []) {
      const cat = (e.item as { category: string } | null)?.category || 'Unknown'
      closingByCategory.set(cat, (closingByCategory.get(cat) || 0) + e.qty)
    }

    const totalInward = Array.from(inwardByTypeMap.values()).reduce((s, v) => s + v.qty, 0)
    const totalOutward = Array.from(outwardByTypeMap.values()).reduce((s, v) => s + v.qty, 0)
    const totalClosing = (closingEntries || []).reduce((s: number, e: { qty: number }) => s + e.qty, 0)

    return NextResponse.json({
      summary: {
        totalInward,
        totalOutward,
        totalClosing,
        totalItems: items?.length || 0,
        netMovement: totalInward - totalOutward,
      },
      inwardByType: Array.from(inwardByTypeMap.entries()).map(([type, v]) => ({ type, qty: v.qty, count: v.count })),
      outwardByType: Array.from(outwardByTypeMap.entries()).map(([type, v]) => ({ type, qty: v.qty, count: v.count })),
      inwardByItem: Array.from(inwardByItemMap.entries()).map(([itemId, qty]) => ({ itemId, name: itemMap.get(itemId) || 'Unknown', qty })),
      outwardByItem: Array.from(outwardByItemMap.entries()).map(([itemId, qty]) => ({ itemId, name: itemMap.get(itemId) || 'Unknown', qty })),
      dailyTrend: Array.from(dailyMap.entries()).map(([date, d]) => ({ date, ...d })).sort((a, b) => a.date.localeCompare(b.date)),
      closingByCategory: Array.from(closingByCategory.entries()).map(([category, qty]) => ({ category, qty })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
