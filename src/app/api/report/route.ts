import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const closingDate = searchParams.get('closingDate')

    let inwardQ = supabase.from('InwardEntry').select('itemId, type, qty')
    let outwardQ = supabase.from('OutwardEntry').select('itemId, type, qty')
    let closingQ = supabase.from('ClosingEntry').select('itemId, type, qty')

    if (startDate) inwardQ = inwardQ.gte('date', startDate)
    if (endDate) inwardQ = inwardQ.lte('date', endDate)
    if (startDate) outwardQ = outwardQ.gte('date', startDate)
    if (endDate) outwardQ = outwardQ.lte('date', endDate)

    if (closingDate) {
      const d = new Date(closingDate)
      const next = new Date(closingDate)
      next.setDate(next.getDate() + 1)
      closingQ = closingQ.gte('date', d.toISOString()).lt('date', next.toISOString())
    } else if (startDate || endDate) {
      if (startDate) closingQ = closingQ.gte('date', startDate)
      if (endDate) closingQ = closingQ.lte('date', endDate)
    }

    const [{ data: items }, { data: inwardEntries }, { data: outwardEntries }, { data: closingEntries }] = await Promise.all([
      supabase.from('InventoryItem').select('id, name, category, unitType'),
      inwardQ, outwardQ, closingQ,
    ])

    const inwardMap = new Map<string, number>()
    const inwardTypeMap = new Map<string, Record<string, number>>()
    for (const e of inwardEntries || []) {
      inwardMap.set(e.itemId, (inwardMap.get(e.itemId) || 0) + e.qty)
      const types = inwardTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      inwardTypeMap.set(e.itemId, types)
    }

    const outwardMap = new Map<string, number>()
    const outwardTypeMap = new Map<string, Record<string, number>>()
    for (const e of outwardEntries || []) {
      outwardMap.set(e.itemId, (outwardMap.get(e.itemId) || 0) + e.qty)
      const types = outwardTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      outwardTypeMap.set(e.itemId, types)
    }

    const closingMap = new Map<string, number>()
    const closingTypeMap = new Map<string, Record<string, number>>()
    for (const e of closingEntries || []) {
      closingMap.set(e.itemId, (closingMap.get(e.itemId) || 0) + e.qty)
      const types = closingTypeMap.get(e.itemId) || {}
      types[e.type] = (types[e.type] || 0) + e.qty
      closingTypeMap.set(e.itemId, types)
    }

    const rows = (items || []).map((item: { id: string; name: string; category: string; unitType: string }) => {
      const inward = inwardMap.get(item.id) || 0
      const outward = outwardMap.get(item.id) || 0
      const closingRecorded = closingMap.get(item.id) || 0
      const expectedClosing = inward - outward
      const variance = closingRecorded - expectedClosing

      let status: 'matched' | 'surplus' | 'shortage' | 'no_closing' | 'no_movement'
      if (inward === 0 && outward === 0 && closingRecorded === 0) status = 'no_movement'
      else if (closingRecorded === 0 && (inward > 0 || outward > 0)) status = 'no_closing'
      else if (variance === 0) status = 'matched'
      else if (variance > 0) status = 'surplus'
      else status = 'shortage'

      return {
        itemId: item.id, itemName: item.name, category: item.category, unit: item.unitType,
        inward, outward, expectedClosing, closingRecorded, variance, status,
        inwardByType: inwardTypeMap.get(item.id) || {},
        outwardByType: outwardTypeMap.get(item.id) || {},
        closingByType: closingTypeMap.get(item.id) || {},
      }
    })

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
