-- ─── CREATE TABLES ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "InventoryItem" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name        TEXT NOT NULL,
  category    TEXT NOT NULL,
  "unitType"  TEXT NOT NULL,
  "subTypes"  TEXT NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "InwardEntry" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL REFERENCES "InventoryItem"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  qty         FLOAT NOT NULL,
  unit        TEXT NOT NULL,
  remarks     TEXT,
  date        TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "OutwardEntry" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL REFERENCES "InventoryItem"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  qty         FLOAT NOT NULL,
  unit        TEXT NOT NULL,
  remarks     TEXT,
  date        TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "ClosingEntry" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "itemId"    TEXT NOT NULL REFERENCES "InventoryItem"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  qty         FLOAT NOT NULL,
  unit        TEXT NOT NULL,
  box         TEXT,
  date        TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "Settings" (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  key         TEXT NOT NULL UNIQUE,
  value       TEXT NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── AUTO updatedAt TRIGGER ───────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER inventory_item_updated
  BEFORE UPDATE ON "InventoryItem" FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER inward_entry_updated
  BEFORE UPDATE ON "InwardEntry"   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER outward_entry_updated
  BEFORE UPDATE ON "OutwardEntry"  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER closing_entry_updated
  BEFORE UPDATE ON "ClosingEntry"  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── PRODUCTS FROM Inventory_1.xlsx ──────────────────────────────────────────

INSERT INTO "InventoryItem" (id, name, category, "unitType", "subTypes") VALUES
  (gen_random_uuid()::text, 'Aurawill Health Mix',    'Health',      'Pack', '["50 Pcs Boxes","Loose Pcs in Box","Packed 1 Pc","Packed 2 Pcs","Packed 4 Pcs","Waiting for Repack"]'),
  (gen_random_uuid()::text, 'Aurawill Cover',         'Cover',       'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, '50 Pcs Carton Box',      'Packaging',   'Box',  '["Box"]'),
  (gen_random_uuid()::text, '1 Pc Cover (6.5*11)',    'Packaging',   'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, '2 Pcs Carton Box',       'Packaging',   'Box',  '["Box"]'),
  (gen_random_uuid()::text, '4 Pcs Carton Box',       'Packaging',   'Box',  '["Box"]'),
  (gen_random_uuid()::text, '24 Pcs Amazon Box',      'Packaging',   'Box',  '["Box"]'),
  (gen_random_uuid()::text, 'Wax Ribbon Roll',        'Consumable',  'Roll', '["Roll"]'),
  (gen_random_uuid()::text, 'Label Roll (500 Pcs)',   'Consumable',  'Roll', '["Roll"]'),
  (gen_random_uuid()::text, 'Aurawill Tape',          'Consumable',  'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, 'Batch Printer Catridge', 'Equipment',   'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, '8*12 Cover',             'Cover',       'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, 'Cello Tape 3"',          'Consumable',  'Pc',   '["Pc"]'),
  (gen_random_uuid()::text, '10*12 Cover',            'Cover',       'Pc',   '["Pc"]')
ON CONFLICT DO NOTHING;
