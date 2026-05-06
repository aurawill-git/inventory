import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/analytics - Get analytics data with date range filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: Record<string, unknown> = {}
    if (startDate || endDate) {
      if (startDate) dateFilter.gte = new Date(startDate)
      if (endDate) dateFilter.lte = new Date(endDate)
    }

    const whereClause = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}

    // Get total inward quantity by type
    const inwardByType = await db.inwardEntry.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: { qty: true },
      _count: true,
    })

    // Get total outward quantity by type
    const outwardByType = await db.outwardEntry.groupBy({
      by: ['type'],
      where: whereClause,
      _sum: { qty: true },
      _count: true,
    })

    // Get total inward quantity by item
    const inwardByItem = await db.inwardEntry.groupBy({
      by: ['itemId'],
      where: whereClause,
      _sum: { qty: true },
    })

    // Get total outward quantity by item
    const outwardByItem = await db.outwardEntry.groupBy({
      by: ['itemId'],
      where: whereClause,
      _sum: { qty: true },
    })

    // Get all items for name lookup
    const items = await db.inventoryItem.findMany()
    const itemMap = new Map(items.map(i => [i.id, i.name]))

    // Get daily trend data (inward vs outward)
    const allInwardEntries = await db.inwardEntry.findMany({
      where: whereClause,
      select: { date: true, qty: true },
    })

    const allOutwardEntries = await db.outwardEntry.findMany({
      where: whereClause,
      select: { date: true, qty: true },
    })

    // Group by date
    const dailyMap = new Map<string, { inward: number; outward: number }>()

    for (const entry of allInwardEntries) {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { inward: 0, outward: 0 }
      existing.inward += entry.qty
      dailyMap.set(dateKey, existing)
    }

    for (const entry of allOutwardEntries) {
      const dateKey = new Date(entry.date).toISOString().split('T')[0]
      const existing = dailyMap.get(dateKey) || { inward: 0, outward: 0 }
      existing.outward += entry.qty
      dailyMap.set(dateKey, existing)
    }

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Closing inventory summary
    const closingEntries = await db.closingEntry.findMany({
      where: Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {},
      include: { item: true },
    })

    const closingByCategory = new Map<string, number>()
    for (const entry of closingEntries) {
      const cat = entry.item.category
      closingByCategory.set(cat, (closingByCategory.get(cat) || 0) + entry.qty)
    }

    // Summary stats
    const totalInward = inwardByType.reduce((sum, i) => sum + (i._sum.qty || 0), 0)
    const totalOutward = outwardByType.reduce((sum, i) => sum + (i._sum.qty || 0), 0)
    const totalClosing = closingEntries.reduce((sum, e) => sum + e.qty, 0)
    const totalItems = items.length

    return NextResponse.json({
      summary: {
        totalInward,
        totalOutward,
        totalClosing,
        totalItems,
        netMovement: totalInward - totalOutward,
      },
      inwardByType: inwardByType.map(i => ({ type: i.type, qty: i._sum.qty || 0, count: i._count })),
      outwardByType: outwardByType.map(i => ({ type: i.type, qty: i._sum.qty || 0, count: i._count })),
      inwardByItem: inwardByItem.map(i => ({ itemId: i.itemId, name: itemMap.get(i.itemId) || 'Unknown', qty: i._sum.qty || 0 })),
      outwardByItem: outwardByItem.map(i => ({ itemId: i.itemId, name: itemMap.get(i.itemId) || 'Unknown', qty: i._sum.qty || 0 })),
      dailyTrend,
      closingByCategory: Array.from(closingByCategory.entries()).map(([category, qty]) => ({ category, qty })),
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
