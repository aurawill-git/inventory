import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const closingDate = searchParams.get('closingDate')

    const rangeFilter: Record<string, Date> = {}
    if (startDate) rangeFilter.gte = new Date(startDate)
    if (endDate) rangeFilter.lte = new Date(endDate)
    const hasRange = Object.keys(rangeFilter).length > 0
    const rangeWhere = hasRange ? { date: rangeFilter } : {}

    // Closing snapshot date filter (exact date or latest if none)
    let closingWhere: Record<string, unknown> = {}
    if (closingDate) {
      const d = new Date(closingDate)
      const next = new Date(closingDate)
      next.setDate(next.getDate() + 1)
      closingWhere = { date: { gte: d, lt: next } }
    } else if (hasRange) {
      closingWhere = { date: rangeFilter }
    }

    const [items, inwardEntries, outwardEntries, closingEntries] = await Promise.all([
      db.inventoryItem.findMany(),
      db.inwardEntry.findMany({ where: rangeWhere }),
      db.outwardEntry.findMany({ where: rangeWhere }),
      db.closingEntry.findMany({ where: closingWhere }),
    ])

    // Aggregate inward per item
    const inwardMap = new Map<string, number>()
    const inwardTypeMap = new Map<string, Record<string, number>>()
    for (const e of inwardEntries) {
      inwardMap.set(e.itemId, (inwardMap.get(e.itemId) || 0) + e.qty)
      const types = inwardTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      inwardTypeMap.set(e.itemId, types)
    }

    // Aggregate outward per item
    const outwardMap = new Map<string, number>()
    const outwardTypeMap = new Map<string, Record<string, number>>()
    for (const e of outwardEntries) {
      outwardMap.set(e.itemId, (outwardMap.get(e.itemId) || 0) + e.qty)
      const types = outwardTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      outwardTypeMap.set(e.itemId, types)
    }

    // Aggregate closing per item
    const closingMap = new Map<string, number>()
    const closingTypeMap = new Map<string, Record<string, number>>()
    for (const e of closingEntries) {
      closingMap.set(e.itemId, (closingMap.get(e.itemId) || 0) + e.qty)
      const types = closingTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      closingTypeMap.set(e.itemId, types)
    }

    const rows = items.map(item => {
      const inward = inwardMap.get(item.id) || 0
      const outward = outwardMap.get(item.id) || 0
      const closingRecorded = closingMap.get(item.id) || 0
      const expectedClosing = inward - outward
      const variance = closingRecorded - expectedClosing

      // Determine status
      let status: 'matched' | 'surplus' | 'shortage' | 'no_closing' | 'no_movement'
      if (inward === 0 && outward === 0 && closingRecorded === 0) {
        status = 'no_movement'
      } else if (closingRecorded === 0 && (inward > 0 || outward > 0)) {
        status = 'no_closing'
      } else if (variance === 0) {
        status = 'matched'
      } else if (variance > 0) {
        status = 'surplus'
      } else {
        status = 'shortage'
      }

      return {
        itemId: item.id,
        itemName: item.name,
        category: item.category,
        unit: item.unitType,
        inward,
        outward,
        expectedClosing,
        closingRecorded,
        variance,
        status,
        inwardByType: inwardTypeMap.get(item.id) || {},
        outwardByType: outwardTypeMap.get(item.id) || {},
        closingByType: closingTypeMap.get(item.id) || {},
      }
    })

    // Summary counts
    const summary = {
      total: rows.length,
      matched: rows.filter(r => r.status === 'matched').length,
      surplus: rows.filter(r => r.status === 'surplus').length,
      shortage: rows.filter(r => r.status === 'shortage').length,
      no_closing: rows.filter(r => r.status === 'no_closing').length,
      no_movement: rows.filter(r => r.status === 'no_movement').length,
      totalVariance: rows.reduce((s, r) => s + Math.abs(r.variance), 0),
    }

    return NextResponse.json({ rows, summary })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
