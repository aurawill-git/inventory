import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/closing - Get closing inventory entries, optionally filtered by date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const where: Record<string, unknown> = {}
    if (date) {
      const start = new Date(date)
      start.setHours(0, 0, 0, 0)
      const end = new Date(date)
      end.setHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    const entries = await db.closingEntry.findMany({
      where,
      include: { item: true },
      orderBy: [{ item: { name: 'asc' } }, { type: 'asc' }],
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching closing entries:', error)
    return NextResponse.json({ error: 'Failed to fetch closing entries' }, { status: 500 })
  }
}

// POST /api/closing - Create a new closing entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, type, qty, unit, box, date } = body

    if (!itemId || !type || qty === undefined || !unit || !date) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }

    const entry = await db.closingEntry.create({
      data: {
        itemId,
        type,
        qty: parseFloat(qty),
        unit,
        box: box || null,
        date: new Date(date),
      },
      include: { item: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating closing entry:', error)
    return NextResponse.json({ error: 'Failed to create closing entry' }, { status: 500 })
  }
}

// PUT /api/closing - Update a closing entry (the yellow editable box field)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, qty, box } = body

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    const entry = await db.closingEntry.update({
      where: { id },
      data: {
        ...(qty !== undefined && { qty: parseFloat(qty) }),
        ...(box !== undefined && { box }),
      },
      include: { item: true },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating closing entry:', error)
    return NextResponse.json({ error: 'Failed to update closing entry' }, { status: 500 })
  }
}

// DELETE /api/closing - Delete a closing entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    await db.closingEntry.delete({ where: { id } })
    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting closing entry:', error)
    return NextResponse.json({ error: 'Failed to delete closing entry' }, { status: 500 })
  }
}
