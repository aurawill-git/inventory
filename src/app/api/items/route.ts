import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/items - Get all inventory items
export async function GET() {
  try {
    const items = await db.inventoryItem.findMany({
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(items)
  } catch (error) {
    console.error('Error fetching items:', error)
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 })
  }
}

// POST /api/items - Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, category, unitType, subTypes } = body

    if (!name || !category || !unitType) {
      return NextResponse.json({ error: 'Name, category, and unitType are required' }, { status: 400 })
    }

    const item = await db.inventoryItem.create({
      data: {
        name,
        category,
        unitType,
        subTypes: JSON.stringify(subTypes || []),
      },
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    console.error('Error creating item:', error)
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 })
  }
}

// PUT /api/items - Update an inventory item
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, category, unitType, subTypes } = body

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    const item = await db.inventoryItem.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(unitType && { unitType }),
        ...(subTypes && { subTypes: JSON.stringify(subTypes) }),
      },
    })

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
  }
}

// DELETE /api/items - Delete an inventory item
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Item ID is required' }, { status: 400 })
    }

    await db.inventoryItem.delete({ where: { id } })
    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 })
  }
}
