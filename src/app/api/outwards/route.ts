import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/outwards - Get outward entries, optionally filtered by date
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const itemId = searchParams.get('itemId')

    const where: Record<string, unknown> = {}
    if (startDate || endDate) {
      where.date = {}
      if (startDate) (where.date as Record<string, unknown>).gte = new Date(startDate)
      if (endDate) (where.date as Record<string, unknown>).lte = new Date(endDate)
    }
    if (itemId) where.itemId = itemId

    const entries = await db.outwardEntry.findMany({
      where,
      include: { item: true },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    })

    return NextResponse.json(entries)
  } catch (error) {
    console.error('Error fetching outward entries:', error)
    return NextResponse.json({ error: 'Failed to fetch outward entries' }, { status: 500 })
  }
}

// POST /api/outwards - Create a new outward entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { itemId, type, qty, unit, remarks, date } = body

    if (!itemId || !type || qty === undefined || !unit || !date) {
      return NextResponse.json({ error: 'All required fields must be provided' }, { status: 400 })
    }

    const entry = await db.outwardEntry.create({
      data: {
        itemId,
        type,
        qty: parseFloat(qty),
        unit,
        remarks: remarks || '',
        date: new Date(date),
      },
      include: { item: true },
    })

    return NextResponse.json(entry, { status: 201 })
  } catch (error) {
    console.error('Error creating outward entry:', error)
    return NextResponse.json({ error: 'Failed to create outward entry' }, { status: 500 })
  }
}

// PUT /api/outwards - Update an outward entry
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, type, qty, unit, remarks, date } = body

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    const entry = await db.outwardEntry.update({
      where: { id },
      data: {
        ...(type !== undefined && { type }),
        ...(qty !== undefined && { qty: parseFloat(qty) }),
        ...(unit !== undefined && { unit }),
        ...(remarks !== undefined && { remarks }),
        ...(date !== undefined && { date: new Date(date) }),
      },
      include: { item: true },
    })

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Error updating outward entry:', error)
    return NextResponse.json({ error: 'Failed to update outward entry' }, { status: 500 })
  }
}

// DELETE /api/outwards - Delete an outward entry
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 })
    }

    await db.outwardEntry.delete({ where: { id } })
    return NextResponse.json({ message: 'Entry deleted successfully' })
  } catch (error) {
    console.error('Error deleting outward entry:', error)
    return NextResponse.json({ error: 'Failed to delete outward entry' }, { status: 500 })
  }
}
