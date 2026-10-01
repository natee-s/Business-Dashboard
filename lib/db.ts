import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'db');
const DB_PATH = path.join(DB_DIR, 'pharmacy.db');

// Ensure db directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_no TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      sale_datetime TEXT NOT NULL,
      product_code TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL DEFAULT 0,
      unit TEXT,
      cost_per_unit REAL NOT NULL DEFAULT 0,
      price_per_unit REAL NOT NULL DEFAULT 0,
      total_price REAL NOT NULL DEFAULT 0,
      total_cost REAL NOT NULL DEFAULT 0,
      gross_profit REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(receipt_no, product_code, sale_datetime)
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_sale_date ON transactions(sale_date);
    CREATE INDEX IF NOT EXISTS idx_transactions_product_code ON transactions(product_code);
    CREATE INDEX IF NOT EXISTS idx_transactions_receipt_no ON transactions(receipt_no);

    CREATE TABLE IF NOT EXISTS upload_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      uploaded_at TEXT NOT NULL DEFAULT (datetime('now')),
      rows_inserted INTEGER NOT NULL DEFAULT 0,
      rows_skipped INTEGER NOT NULL DEFAULT 0,
      rows_total INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success'
    );
  `);
}
