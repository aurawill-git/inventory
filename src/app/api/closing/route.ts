import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let query = supabase
      .from('ClosingEntry')
      .select('*, item:InventoryItem(*)')

    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      query = query.gte('date', start.toISOString()).lte('date', end.toISOString())
    }

    const { data, error } = await query
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching closing entries:', error)
    return NextResponse.json({ error: 'Failed to fetch closing entries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, type, qty, unit, box, date } = body
    if (!itemId || !type || qty === undefined || !unit || !date) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('ClosingEntry')
      .insert({ itemId, type, qty: parseFloat(qty), unit, box: box || null, date })
      .select('*, item:InventoryItem(*)')
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating closing entry:', error)
    return NextResponse.json({ error: 'Failed to create closing entry' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, qty, box } = body
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    const update: Record<string, unknown> = {}
    if (qty !== undefined) update.qty = parseFloat(qty)
    if (box !== undefined) update.box = box
    const { data, error } = await supabase
      .from('ClosingEntry')
      .update(update)
      .eq('id', id)
      .select('*, item:InventoryItem(*)')
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating closing entry:', error)
    return NextResponse.json({ error: 'Failed to update closing entry' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    const { error } = await supabase.from('ClosingEntry').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting closing entry:', error)
    return NextResponse.json({ error: 'Failed to delete closing entry' }, { status: 500 })
  }
}
