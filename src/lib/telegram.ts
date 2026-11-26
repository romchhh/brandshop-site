import { ONE_SIZE, productImageUrl } from "@/lib/catalog";
import type { LastOrder } from "@/lib/order";

function money(n: number) {
  return `${n.toFixed(2)} грн`;
}

function paymentText(order: LastOrder) {
  if (order.paymentMethod === "cod") return "Накладений платіж";
  return order.paymentLabel || "Оплата на карту";
}

function formatOrderMessage(order: LastOrder): string {
  const lines: string[] = [
    `📯Замовлення №${order.number}`,
    "",
    `Джерело: сайт BrandShop`,
    `Оплата: ${paymentText(order)}`,
    `Сума замовлення: ${money(order.total)}`,
    `Знижка: 0.00 грн`,
    `Знижка по промокоду: 0.0 грн`,
    `💵Сума до сплати: ${money(order.total)}`,
    "",
    `🛒 Товари`,
  ];

  order.items.forEach((item, i) => {
    const size =
      item.size && item.size !== ONE_SIZE ? item.size : "Один розмір";
    lines.push(
      `${i + 1}. ${item.title}`,
      `   Артикул: ${item.article}`,
      `   Розмір / тип: ${size}`,
      `   Кількість: ${item.qty} шт.`,
      "",
    );
  });

  lines.push(`👤 Клієнт і доставка`);
  lines.push(`ПІБ: ${order.name}`);
  lines.push(`Телефон: ${order.phone}`);

  if (order.email) {
    lines.push(`Email: ${order.email}`);
  }

  if (order.deliveryMethod === "nova_poshta") {
    lines.push(`Місто: ${order.city ?? "—"}`);
    lines.push(
      `Відділення / адреса: ${order.warehouse ?? order.deliveryLabel}`,
    );
  } else {
    lines.push(`Доставка: ${order.deliveryLabel}`);
  }

  if (order.comment) {
    lines.push("", `💬 Коментар: ${order.comment}`);
  }

  return lines.join("\n").trim();
}

async function tgApi(
  token: string,
  method: string,
  body: Record<string, unknown>,
) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const json = (await res.json()) as { ok?: boolean; description?: string };
  if (!res.ok || !json.ok) {
    throw new Error(json.description ?? `Telegram ${method} HTTP ${res.status}`);
  }
  return json;
}

function uniquePhotoUrls(order: LastOrder): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  for (const item of order.items) {
    const url = productImageUrl(item);
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
    if (urls.length >= 10) break; // Telegram media group limit
  }
  return urls;
}

async function sendOrderPhotos(
  token: string,
  chatId: string,
  order: LastOrder,
) {
  const photos = uniquePhotoUrls(order);
  if (!photos.length) return;

  if (photos.length === 1) {
    await tgApi(token, "sendPhoto", {
      chat_id: chatId,
      photo: photos[0],
      caption: `📷 Фото замовлення №${order.number}`,
    });
    return;
  }

  const media = photos.map((url, i) => ({
    type: "photo" as const,
    media: url,
    ...(i === 0
      ? { caption: `📷 Фото замовлення №${order.number}` }
      : {}),
  }));

  await tgApi(token, "sendMediaGroup", {
    chat_id: chatId,
    media,
  });
}

export async function sendOrderToTelegram(
  order: LastOrder,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.TELEGRAM_TOKEN?.trim();
  const chatId =
    process.env.TELEGRAM_CHAT_ID?.trim() || process.env.TELEGRAM_GROUP_ID?.trim();

  if (!token || !chatId) {
    console.error("[telegram] TELEGRAM_TOKEN or TELEGRAM_CHAT_ID missing");
    return { ok: false, error: "Telegram не налаштовано" };
  }

  try {
    await tgApi(token, "sendMessage", {
      chat_id: chatId,
      text: formatOrderMessage(order),
      disable_web_page_preview: true,
    });

    try {
      await sendOrderPhotos(token, chatId, order);
    } catch (photoErr) {
      // Text already delivered — don't fail the whole order on photo issues
      console.error(
        "[telegram] photos failed:",
        photoErr instanceof Error ? photoErr.message : photoErr,
      );
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Network error";
    console.error("[telegram] send error:", message);
    return { ok: false, error: message };
  }
}
