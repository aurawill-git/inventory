import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

const DEFAULT_ITEMS = [
  {
    name: 'Aurawill Health Mix',
    category: 'Health',
    unitType: 'Pack',
    subTypes: JSON.stringify(['50 Pcs Boxes', 'Loose Pcs in Box', 'Packed 1 Pc', 'Packed 2 Pcs', 'Packed 4 Pcs', 'Waiting for Repack']),
  },
  {
    name: 'Aurawill Cover',
    category: 'Cover',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: '50 Pcs Carton Box',
    category: 'Packaging',
    unitType: 'Box',
    subTypes: JSON.stringify(['Box']),
  },
  {
    name: '1 Pc Cover (6.5*11)',
    category: 'Packaging',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: '2 Pcs Carton Box',
    category: 'Packaging',
    unitType: 'Box',
    subTypes: JSON.stringify(['Box']),
  },
  {
    name: '4 Pcs Carton Box',
    category: 'Packaging',
    unitType: 'Box',
    subTypes: JSON.stringify(['Box']),
  },
  {
    name: '24 Pcs Amazon Box',
    category: 'Packaging',
    unitType: 'Box',
    subTypes: JSON.stringify(['Box']),
  },
  {
    name: 'Wax Ribbon Roll',
    category: 'Consumable',
    unitType: 'Roll',
    subTypes: JSON.stringify(['Roll']),
  },
  {
    name: 'Label Roll (500 Pcs)',
    category: 'Consumable',
    unitType: 'Roll',
    subTypes: JSON.stringify(['Roll']),
  },
  {
    name: 'Aurawill Tape',
    category: 'Consumable',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: 'Batch Printer Catridge',
    category: 'Equipment',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: '8*12 Cover',
    category: 'Cover',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: 'Cello Tape 3"',
    category: 'Consumable',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
  {
    name: '10*12 Cover',
    category: 'Cover',
    unitType: 'Pc',
    subTypes: JSON.stringify(['Pc']),
  },
]

export async function POST() {
  try {
    // Check if items already exist
    const existing = await db.inventoryItem.count()
    if (existing > 0) {
      return NextResponse.json({ message: 'Items already seeded', count: existing })
    }

    const items = await Promise.all(
      DEFAULT_ITEMS.map(item => db.inventoryItem.create({ data: item }))
    )

    // Create some sample entries for demonstration
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const twoDaysAgo = new Date(today)
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    // Sample inward entries
    const sampleInwards = [
      { itemId: items[0].id, type: 'From Production Unit', qty: 100, unit: 'Pack', date: today },
      { itemId: items[0].id, type: 'Purchase', qty: 50, unit: 'Pack', date: yesterday },
      { itemId: items[1].id, type: 'Purchase', qty: 200, unit: 'Pc', date: today },
      { itemId: items[1].id, type: 'Damaged - From Production Unit', qty: 5, unit: 'Pc', date: twoDaysAgo },
      { itemId: items[2].id, type: 'Purchase', qty: 10, unit: 'Roll', date: today },
      { itemId: items[3].id, type: 'Purchase', qty: 8, unit: 'Roll', date: yesterday },
      { itemId: items[4].id, type: 'Purchase', qty: 20, unit: 'Pc', date: today },
      { itemId: items[5].id, type: 'Purchase', qty: 3, unit: 'Pc', date: twoDaysAgo },
      { itemId: items[6].id, type: 'Purchase', qty: 500, unit: 'Pc', date: today },
      { itemId: items[7].id, type: 'Purchase', qty: 15, unit: 'Pc', date: yesterday },
      { itemId: items[8].id, type: 'Purchase', qty: 300, unit: 'Pc', date: today },
      { itemId: items[0].id, type: 'From Production Unit', qty: 75, unit: 'Pack', date: twoDaysAgo },
      { itemId: items[1].id, type: 'From Production Unit', qty: 150, unit: 'Pc', date: twoDaysAgo },
    ]

    await Promise.all(
      sampleInwards.map(entry =>
        db.inwardEntry.create({ data: { ...entry, remarks: '' } })
      )
    )

    // Sample outward entries
    const sampleOutwards = [
      { itemId: items[0].id, type: 'Prepaid Orders', qty: 30, unit: 'Pack', date: today },
      { itemId: items[0].id, type: 'Customer Care', qty: 5, unit: 'Pack', date: today },
      { itemId: items[0].id, type: 'COD - Speed Post', qty: 15, unit: 'Pack', date: yesterday },
      { itemId: items[1].id, type: 'Amazon', qty: 40, unit: 'Pc', date: today },
      { itemId: items[1].id, type: 'Meesho', qty: 25, unit: 'Pc', date: yesterday },
      { itemId: items[1].id, type: 'Sample', qty: 3, unit: 'Pc', date: twoDaysAgo },
      { itemId: items[0].id, type: 'Bluedart', qty: 10, unit: 'Pack', date: twoDaysAgo },
      { itemId: items[0].id, type: 'Damaged', qty: 2, unit: 'Pack', date: yesterday },
      { itemId: items[1].id, type: 'Offline Sales', qty: 20, unit: 'Pc', date: today },
      { itemId: items[4].id, type: 'Consumed', qty: 5, unit: 'Pc', date: today },
      { itemId: items[2].id, type: 'Consumed', qty: 2, unit: 'Roll', date: yesterday },
      { itemId: items[3].id, type: 'Used for Repacking', qty: 1, unit: 'Roll', date: twoDaysAgo },
      { itemId: items[0].id, type: 'COD - Business Parcel', qty: 20, unit: 'Pack', date: today },
      { itemId: items[1].id, type: 'Sent to Tiruchengode', qty: 10, unit: 'Pc', date: yesterday },
    ]

    await Promise.all(
      sampleOutwards.map(entry =>
        db.outwardEntry.create({ data: { ...entry, remarks: '' } })
      )
    )

    // Sample closing entries
    const sampleClosing = [
      { itemId: items[0].id, type: '50 Pcs Boxes', qty: 45, unit: 'Box', box: '3', date: today },
      { itemId: items[0].id, type: 'Loose Pcs in Box', qty: 120, unit: 'Pc', box: '', date: today },
      { itemId: items[0].id, type: 'Packed 1 Pc', qty: 50, unit: 'Pc', box: '', date: today },
      { itemId: items[0].id, type: 'Packed 2 Pcs', qty: 30, unit: 'Box', box: '2', date: today },
      { itemId: items[0].id, type: 'Packed 4 Pcs', qty: 20, unit: 'Pc', box: '', date: today },
      { itemId: items[0].id, type: 'Waiting for Repack', qty: 8, unit: 'Pc', box: '', date: today },
      { itemId: items[1].id, type: '50 Pcs Carton Box', qty: 5, unit: 'Box', box: '1', date: today },
      { itemId: items[1].id, type: '1 Pc Cover (6.5*11)', qty: 150, unit: 'Pc', box: '', date: today },
      { itemId: items[1].id, type: '2 Pcs Carton Box', qty: 12, unit: 'Box', box: '', date: today },
      { itemId: items[1].id, type: '4 Pcs Carton Box', qty: 8, unit: 'Box', box: '', date: today },
      { itemId: items[1].id, type: '24 Pcs Amazon Box', qty: 3, unit: 'Box', box: '', date: today },
      { itemId: items[2].id, type: 'Roll', qty: 7, unit: 'Roll', box: '', date: today },
      { itemId: items[3].id, type: 'Roll', qty: 6, unit: 'Roll', box: '', date: today },
      { itemId: items[4].id, type: 'Pc', qty: 14, unit: 'Pc', box: '', date: today },
      { itemId: items[5].id, type: 'Pc', qty: 2, unit: 'Pc', box: '', date: today },
      { itemId: items[6].id, type: 'Pc', qty: 480, unit: 'Pc', box: '', date: today },
      { itemId: items[7].id, type: 'Pc', qty: 10, unit: 'Pc', box: '', date: today },
      { itemId: items[8].id, type: 'Pc', qty: 280, unit: 'Pc', box: '', date: today },
    ]

    await Promise.all(
      sampleClosing.map(entry =>
        db.closingEntry.create({ data: entry })
      )
    )

    return NextResponse.json({
      message: 'Database seeded successfully',
      items: items.length,
      inwards: sampleInwards.length,
      outwards: sampleOutwards.length,
      closing: sampleClosing.length,
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 })
  }
}
