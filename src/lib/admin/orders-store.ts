import type {
  CheckoutOrderItem,
  DeliveryMethod,
  LastOrder,
  PaymentMethod,
} from "@/lib/order";
import { getDb } from "@/lib/db/sqlite";
import type {
  DashboardStats,
  StoredOrder,
  StoredUser,
} from "@/lib/admin/types";

export type { DashboardStats, StoredOrder, StoredUser };

type OrderRow = {
  id: number;
  number: string;
  user_id: number;
  created_at: string;
  saved_at: string;
  name: string;
  phone: string;
  email: string | null;
  delivery_method: string;
  delivery_label: string;
  city: string | null;
  warehouse: string | null;
  payment_method: string;
  payment_label: string;
  comment: string | null;
  items_json: string;
  subtotal: number;
  promo_code: string | null;
  promo_percent: number | null;
  promo_discount: number;
  total: number;
};

type UserRow = {
  id: number;
  phone: string;
  name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
  orders_count: number;
  total_spent: number;
};

let migratedJson = false;

function rowToOrder(row: OrderRow): StoredOrder {
  let items: CheckoutOrderItem[] = [];
  try {
    items = JSON.parse(row.items_json) as CheckoutOrderItem[];
  } catch {
    items = [];
  }
  return {
    number: row.number,
    createdAt: row.created_at,
    savedAt: row.saved_at,
    userId: row.user_id,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    deliveryMethod: row.delivery_method as DeliveryMethod,
    deliveryLabel: row.delivery_label,
    city: row.city ?? undefined,
    warehouse: row.warehouse ?? undefined,
    paymentMethod: row.payment_method as PaymentMethod,
    paymentLabel: row.payment_label,
    comment: row.comment ?? undefined,
    items,
    subtotal: row.subtotal ?? row.total,
    promoCode: row.promo_code ?? undefined,
    promoPercent: row.promo_percent ?? undefined,
    promoDiscount: row.promo_discount ?? 0,
    total: row.total,
  };
}

function rowToUser(row: UserRow): StoredUser {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ordersCount: row.orders_count,
    totalSpent: row.total_spent,
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+]/g, "").trim() || phone.trim();
}

async function migrateFromJsonOnce() {
  if (migratedJson) return;
  migratedJson = true;

  const db = getDb();
  const count = db.prepare("SELECT COUNT(*) AS c FROM orders").get() as {
    c: number;
  };
  if (count.c > 0) return;

  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const candidates = [
    path.join(process.cwd(), "data/orders.json"),
    "/tmp/brandshop-orders.json",
  ];

  for (const file of candidates) {
    try {
      const raw = JSON.parse(await readFile(file, "utf8")) as Array<
        LastOrder & { savedAt?: string }
      >;
      if (!Array.isArray(raw) || !raw.length) continue;
      for (const order of raw) {
        await saveOrder(order, order.savedAt ?? order.createdAt);
      }
      console.info(`[db] migrated ${raw.length} orders from ${file}`);
      return;
    } catch {
      /* next */
    }
  }
}

function upsertUser(
  phone: string,
  name: string,
  email: string | undefined,
  now: string,
): number {
  const db = getDb();
  const key = normalizePhone(phone);
  const existing = db
    .prepare("SELECT id FROM users WHERE phone = ?")
    .get(key) as { id: number } | undefined;

  if (existing) {
    db.prepare(
      `UPDATE users
       SET name = CASE WHEN ? != '' THEN ? ELSE name END,
           email = COALESCE(?, email),
           updated_at = ?
       WHERE id = ?`,
    ).run(name.trim(), name.trim(), email?.trim() || null, now, existing.id);
    return existing.id;
  }

  const result = db
    .prepare(
      `INSERT INTO users (phone, name, email, created_at, updated_at, orders_count, total_spent)
       VALUES (?, ?, ?, ?, ?, 0, 0)`,
    )
    .run(key, name.trim() || "Клієнт", email?.trim() || null, now, now);
  return Number(result.lastInsertRowid);
}

function refreshUserStats(userId: number) {
  const db = getDb();
  db.prepare(
    `UPDATE users
     SET orders_count = (SELECT COUNT(*) FROM orders WHERE user_id = ?),
         total_spent = (SELECT COALESCE(SUM(total), 0) FROM orders WHERE user_id = ?),
         updated_at = ?
     WHERE id = ?`,
  ).run(userId, userId, new Date().toISOString(), userId);
}

export async function saveOrder(
  order: LastOrder,
  savedAtOverride?: string,
): Promise<void> {
  await migrateFromJsonOnce();
  const db = getDb();
  const now = savedAtOverride ?? new Date().toISOString();
  const userId = upsertUser(order.phone, order.name, order.email, now);

  const payload = {
    number: order.number,
    user_id: userId,
    created_at: order.createdAt || now,
    saved_at: now,
    name: order.name,
    phone: normalizePhone(order.phone),
    email: order.email?.trim() || null,
    delivery_method: order.deliveryMethod,
    delivery_label: order.deliveryLabel,
    city: order.city ?? null,
    warehouse: order.warehouse ?? null,
    payment_method: order.paymentMethod,
    payment_label: order.paymentLabel,
    comment: order.comment ?? null,
    items_json: JSON.stringify(order.items ?? []),
    subtotal: order.subtotal ?? order.total,
    promo_code: order.promoCode ?? null,
    promo_percent: order.promoPercent ?? null,
    promo_discount: order.promoDiscount ?? 0,
    total: order.total,
  };

  db.prepare(
    `INSERT INTO orders (
      number, user_id, created_at, saved_at, name, phone, email,
      delivery_method, delivery_label, city, warehouse,
      payment_method, payment_label, comment, items_json,
      subtotal, promo_code, promo_percent, promo_discount, total
    ) VALUES (
      @number, @user_id, @created_at, @saved_at, @name, @phone, @email,
      @delivery_method, @delivery_label, @city, @warehouse,
      @payment_method, @payment_label, @comment, @items_json,
      @subtotal, @promo_code, @promo_percent, @promo_discount, @total
    )
    ON CONFLICT(number) DO UPDATE SET
      user_id = excluded.user_id,
      saved_at = excluded.saved_at,
      name = excluded.name,
      phone = excluded.phone,
      email = excluded.email,
      delivery_method = excluded.delivery_method,
      delivery_label = excluded.delivery_label,
      city = excluded.city,
      warehouse = excluded.warehouse,
      payment_method = excluded.payment_method,
      payment_label = excluded.payment_label,
      comment = excluded.comment,
      items_json = excluded.items_json,
      subtotal = excluded.subtotal,
      promo_code = excluded.promo_code,
      promo_percent = excluded.promo_percent,
      promo_discount = excluded.promo_discount,
      total = excluded.total`,
  ).run(payload);

  refreshUserStats(userId);
}

export async function listOrders(limit = 100): Promise<StoredOrder[]> {
  await migrateFromJsonOnce();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM orders ORDER BY saved_at DESC LIMIT ?`,
    )
    .all(limit) as OrderRow[];
  return rows.map(rowToOrder);
}

export async function getOrder(number: string): Promise<StoredOrder | null> {
  await migrateFromJsonOnce();
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM orders WHERE number = ?`)
    .get(number) as OrderRow | undefined;
  return row ? rowToOrder(row) : null;
}

export async function listUsers(limit = 100): Promise<StoredUser[]> {
  await migrateFromJsonOnce();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM users ORDER BY updated_at DESC LIMIT ?`,
    )
    .all(limit) as UserRow[];
  return rows.map(rowToUser);
}

export async function getUserOrders(
  userId: number,
  limit = 50,
): Promise<StoredOrder[]> {
  await migrateFromJsonOnce();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM orders WHERE user_id = ? ORDER BY saved_at DESC LIMIT ?`,
    )
    .all(userId, limit) as OrderRow[];
  return rows.map(rowToOrder);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await migrateFromJsonOnce();
  const db = getDb();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const totals = db
    .prepare(
      `SELECT
         COUNT(*) AS orders_total,
         COALESCE(SUM(total), 0) AS revenue_total,
         COALESCE(AVG(total), 0) AS avg_order,
         SUM(CASE WHEN promo_code IS NOT NULL AND promo_code != '' THEN 1 ELSE 0 END) AS promo_orders
       FROM orders`,
    )
    .get() as {
    orders_total: number;
    revenue_total: number;
    avg_order: number;
    promo_orders: number;
  };

  const todayRow = db
    .prepare(
      `SELECT
         COUNT(*) AS orders_today,
         COALESCE(SUM(total), 0) AS revenue_today
       FROM orders
       WHERE saved_at >= ?`,
    )
    .get(todayIso) as { orders_today: number; revenue_today: number };

  const usersTotal = (
    db.prepare(`SELECT COUNT(*) AS c FROM users`).get() as { c: number }
  ).c;

  const recent = db
    .prepare(`SELECT * FROM orders ORDER BY saved_at DESC LIMIT 8`)
    .all() as OrderRow[];

  const topUsers = db
    .prepare(
      `SELECT * FROM users ORDER BY total_spent DESC, orders_count DESC LIMIT 5`,
    )
    .all() as UserRow[];

  return {
    ordersTotal: totals.orders_total,
    ordersToday: todayRow.orders_today,
    revenueTotal: totals.revenue_total,
    revenueToday: todayRow.revenue_today,
    usersTotal,
    avgOrder: totals.avg_order,
    promoOrders: totals.promo_orders,
    recentOrders: recent.map(rowToOrder),
    topUsers: topUsers.map(rowToUser),
  };
}
