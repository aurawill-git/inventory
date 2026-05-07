import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const PRODUCTS = [
  { name: 'Aurawill Health Mix',    category: 'Health',      unitType: 'Pack', subTypes: JSON.stringify(['50 Pcs Boxes', 'Loose Pcs in Box', 'Packed 1 Pc', 'Packed 2 Pcs', 'Packed 4 Pcs', 'Waiting for Repack']) },
  { name: 'Aurawill Cover',         category: 'Cover',       unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: '50 Pcs Carton Box',      category: 'Packaging',   unitType: 'Box',  subTypes: JSON.stringify(['Box']) },
  { name: '1 Pc Cover (6.5*11)',    category: 'Packaging',   unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: '2 Pcs Carton Box',       category: 'Packaging',   unitType: 'Box',  subTypes: JSON.stringify(['Box']) },
  { name: '4 Pcs Carton Box',       category: 'Packaging',   unitType: 'Box',  subTypes: JSON.stringify(['Box']) },
  { name: '24 Pcs Amazon Box',      category: 'Packaging',   unitType: 'Box',  subTypes: JSON.stringify(['Box']) },
  { name: 'Wax Ribbon Roll',        category: 'Consumable',  unitType: 'Roll', subTypes: JSON.stringify(['Roll']) },
  { name: 'Label Roll (500 Pcs)',   category: 'Consumable',  unitType: 'Roll', subTypes: JSON.stringify(['Roll']) },
  { name: 'Aurawill Tape',          category: 'Consumable',  unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: 'Batch Printer Catridge', category: 'Equipment',   unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: '8*12 Cover',             category: 'Cover',       unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: 'Cello Tape 3"',          category: 'Consumable',  unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
  { name: '10*12 Cover',            category: 'Cover',       unitType: 'Pc',   subTypes: JSON.stringify(['Pc']) },
]

async function main() {
  const existing = await db.inventoryItem.findMany({ select: { name: true } })
  const existingNames = new Set(existing.map(i => i.name))
  console.log(`Existing items in prisma/db: ${existing.length}`)

  let added = 0
  for (const p of PRODUCTS) {
    if (existingNames.has(p.name)) {
      // Update to ensure correct data
      await db.inventoryItem.update({ where: { name: p.name }, data: p })
      console.log(`  UPD  ${p.name}`)
    } else {
      await db.inventoryItem.create({ data: p })
      console.log(`  ADD  ${p.name}`)
      added++
    }
  }
  console.log(`\nDone. Added: ${added}, Updated: ${PRODUCTS.length - added}`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
