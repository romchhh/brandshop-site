import type { LastOrder } from "@/lib/order";

export type StoredOrder = LastOrder & {
  savedAt: string;
};

const RELATIVE = "data/orders.json";
const TMP = "/tmp/brandshop-orders.json";
const MAX_ORDERS = 500;

function paths(pathMod: typeof import("node:path")) {
  return [pathMod.join(process.cwd(), RELATIVE), TMP];
}

async function readAll(): Promise<StoredOrder[]> {
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  for (const file of paths(path)) {
    try {
      const raw = JSON.parse(await readFile(file, "utf8")) as StoredOrder[];
      if (Array.isArray(raw)) return raw;
    } catch {
      /* next */
    }
  }
  return [];
}

async function writeAll(orders: StoredOrder[]) {
  const [{ mkdir, rename, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  const body = JSON.stringify(orders, null, 2);
  for (const file of paths(path)) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, file);
      return;
    } catch {
      /* next */
    }
  }
  console.warn("[admin] could not persist orders to disk");
}

export async function listOrders(limit = 100): Promise<StoredOrder[]> {
  const all = await readAll();
  return all.slice(0, limit);
}

export async function saveOrder(order: LastOrder): Promise<void> {
  const all = await readAll();
  const entry: StoredOrder = { ...order, savedAt: new Date().toISOString() };
  const next = [entry, ...all.filter((o) => o.number !== order.number)].slice(
    0,
    MAX_ORDERS,
  );
  await writeAll(next);
}

export async function getOrder(number: string): Promise<StoredOrder | null> {
  const all = await readAll();
  return all.find((o) => o.number === number) ?? null;
}
