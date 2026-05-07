import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('InventoryItem')
      .select('*')
      .order('createdAt', { ascending: true })
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, unitType, subTypes } = body
    if (!name || !category || !unitType) {
      return NextResponse.json({ error: 'Name, category, and unitType are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('InventoryItem')
      .insert({ name, category, unitType, subTypes: JSON.stringify(subTypes || []) })
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, unitType, subTypes } = body
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (category !== undefined) update.category = category
    if (unitType !== undefined) update.unitType = unitType
    if (subTypes !== undefined) update.subTypes = JSON.stringify(subTypes)
    const { data, error } = await supabase
      .from('InventoryItem')
      .update(update)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    const { error } = await supabase.from('InventoryItem').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
