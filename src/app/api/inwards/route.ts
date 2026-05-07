import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const itemId = searchParams.get('itemId')

    let query = supabase
      .from('InwardEntry')
      .select('*, item:InventoryItem(*)')
      .order('date', { ascending: false })

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)
    if (itemId) query = query.eq('itemId', itemId)

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching inward entries:', error)
    return NextResponse.json({ error: 'Failed to fetch inward entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, type, qty, unit, remarks, date } = body
    if (!itemId || !type || qty === undefined || !unit || !date) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('InwardEntry')
      .insert({ itemId, type, qty: parseFloat(qty), unit, remarks: remarks || '', date })
      .select('*, item:InventoryItem(*)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating inward entry:', error)
    return NextResponse.json({ error: 'Failed to create inward entry' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, qty, unit, remarks, date } = body
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    const update: Record<string, unknown> = {}
    if (type !== undefined) update.type = type
    if (qty !== undefined) update.qty = parseFloat(qty)
    if (unit !== undefined) update.unit = unit
    if (remarks !== undefined) update.remarks = remarks
    if (date !== undefined) update.date = date
    const { data, error } = await supabase
      .from('InwardEntry')
      .update(update)
      .eq('id', id)
      .select('*, item:InventoryItem(*)')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating inward entry:', error)
    return NextResponse.json({ error: 'Failed to update inward entry' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    const { error } = await supabase.from('InwardEntry').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting inward entry:', error)
    return NextResponse.json({ error: 'Failed to delete inward entry' }, { status: 500 })
  }
}
