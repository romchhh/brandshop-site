import { CATEGORY_GROUPS } from "@/lib/catalog";
import {
  defaultPromoCodes,
  normalizePromoList,
  type PromoCode,
} from "@/lib/promo";

export type AdminSettings = {
  /** Ordered category group ids for novinki / rails / catalog «new». */
  groupOrder: string[];
  /** Soft-hidden product ids (still in feed, not shown in storefront). */
  hiddenProductIds: number[];
  /** Promo codes managed in admin. */
  promoCodes: PromoCode[];
  updatedAt: string;
};

const DEFAULT: AdminSettings = {
  groupOrder: CATEGORY_GROUPS.map((g) => g.id),
  hiddenProductIds: [],
  promoCodes: defaultPromoCodes(),
  updatedAt: new Date(0).toISOString(),
};

const RELATIVE = "data/admin-settings.json";
const TMP = "/tmp/brandshop-admin-settings.json";

function paths(pathMod: typeof import("node:path")) {
  return [pathMod.join(process.cwd(), RELATIVE), TMP];
}

export function defaultAdminSettings(): AdminSettings {
  return {
    groupOrder: [...DEFAULT.groupOrder],
    hiddenProductIds: [],
    promoCodes: defaultPromoCodes(),
    updatedAt: new Date().toISOString(),
  };
}

function normalize(raw: Partial<AdminSettings> | null): AdminSettings {
  const base = defaultAdminSettings();
  if (!raw) return base;
  const known = new Set(CATEGORY_GROUPS.map((g) => g.id));
  const aliases: Record<string, string> = { "shoes-summer": "slippers" };
  const order = Array.isArray(raw.groupOrder)
    ? raw.groupOrder
        .map((id) => (typeof id === "string" ? aliases[id] ?? id : ""))
        .filter((id) => id && known.has(id))
    : [];
  const uniqueOrder = [...new Set(order)];
  for (const id of base.groupOrder) {
    if (!uniqueOrder.includes(id)) uniqueOrder.push(id);
  }
  const hidden = Array.isArray(raw.hiddenProductIds)
    ? [
        ...new Set(
          raw.hiddenProductIds
            .map(Number)
            .filter((n) => Number.isFinite(n) && n > 0),
        ),
      ]
    : [];

  // If file has no promoCodes key yet — seed defaults; empty array means "cleared"
  const promoCodes =
    raw.promoCodes === undefined
      ? defaultPromoCodes()
      : normalizePromoList(raw.promoCodes);

  return {
    groupOrder: uniqueOrder,
    hiddenProductIds: hidden,
    promoCodes,
    updatedAt:
      typeof raw.updatedAt === "string" ? raw.updatedAt : base.updatedAt,
  };
}

export async function readAdminSettings(): Promise<AdminSettings> {
  const [{ readFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);
  for (const file of paths(path)) {
    try {
      const raw = JSON.parse(
        await readFile(file, "utf8"),
      ) as Partial<AdminSettings>;
      return normalize(raw);
    } catch {
      /* try next */
    }
  }
  return defaultAdminSettings();
}

export async function writeAdminSettings(
  patch: Partial<AdminSettings>,
): Promise<AdminSettings> {
  const current = await readAdminSettings();
  const next = normalize({
    ...current,
    ...patch,
    updatedAt: new Date().toISOString(),
  });

  const [{ mkdir, rename, writeFile }, path] = await Promise.all([
    import("node:fs/promises"),
    import("node:path"),
  ]);

  const body = JSON.stringify(next, null, 2);
  let saved = false;
  for (const file of paths(path)) {
    try {
      await mkdir(path.dirname(file), { recursive: true });
      const tmp = `${file}.${process.pid}.tmp`;
      await writeFile(tmp, body, "utf8");
      await rename(tmp, file);
      saved = true;
      break;
    } catch {
      /* read-only FS */
    }
  }
  if (!saved) {
    console.warn("[admin] could not persist settings to disk");
  }
  return next;
}
