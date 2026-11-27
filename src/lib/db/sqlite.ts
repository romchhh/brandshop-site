import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const RELATIVE = "data/brandshop.sqlite";
const TMP = "/tmp/brandshop.sqlite";

let dbSingleton: Database.Database | null = null;

function resolveDbPath(): string {
  const preferred = path.join(process.cwd(), RELATIVE);
  try {
    fs.mkdirSync(path.dirname(preferred), { recursive: true });
    // probe write
    const probe = `${preferred}.write-test`;
    fs.writeFileSync(probe, "ok");
    fs.unlinkSync(probe);
    return preferred;
  } catch {
    return TMP;
  }
}

function migrate(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL DEFAULT '',
      email TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      orders_count INTEGER NOT NULL DEFAULT 0,
      total_spent REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
    CREATE INDEX IF NOT EXISTS idx_users_updated ON users(updated_at DESC);

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      saved_at TEXT NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      delivery_method TEXT NOT NULL,
      delivery_label TEXT NOT NULL,
      city TEXT,
      warehouse TEXT,
      payment_method TEXT NOT NULL,
      payment_label TEXT NOT NULL,
      comment TEXT,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL DEFAULT 0,
      promo_code TEXT,
      promo_percent REAL,
      promo_discount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_orders_saved ON orders(saved_at DESC);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(phone);
  `);
}

export function getDb(): Database.Database {
  if (dbSingleton) return dbSingleton;
  const file = resolveDbPath();
  const db = new Database(file);
  migrate(db);
  dbSingleton = db;
  return db;
}

export function dbPath(): string {
  return resolveDbPath();
}
