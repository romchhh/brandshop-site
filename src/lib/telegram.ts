import { ONE_SIZE, productImageUrl } from "@/lib/catalog";
import type { LastOrder } from "@/lib/order";

function money(n: number) {
  return `${n.toFixed(2)} грн`;
}

function esc(value: string | number | undefined | null): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function paymentText(order: LastOrder) {
  return order.paymentLabel || "Повна оплата на рахунок ФОП";
}

function formatOrderMessage(order: LastOrder): string {
  const subtotal = money(order.subtotal ?? order.total);
  const discount = money(order.promoDiscount ?? 0);
  const promoLine = order.promoCode
    ? `${esc(order.promoCode)}${
        order.promoPercent ? ` (−${order.promoPercent}%)` : ""
      } · ${money(order.promoDiscount ?? 0)}`
    : "0.00 грн";

  const items = order.items
    .map((item, i) => {
      const size =
        item.size && item.size !== ONE_SIZE ? item.size : "Один розмір";
      return [
        `<b>${i + 1}. ${esc(item.title)}</b>`,
        `Артикул: <code>${esc(item.article)}</code>`,
        `Розмір / тип: <b>${esc(size)}</b>`,
        `Кількість: ${item.qty} шт.`,
      ].join("\n");
    })
    .join("\n\n");

  const deliveryBlock =
    order.deliveryMethod === "nova_poshta"
      ? [
          `Місто: <b>${esc(order.city ?? "—")}</b>`,
          `Відділення / адреса: <b>${esc(order.warehouse ?? order.deliveryLabel)}</b>`,
        ].join("\n")
      : `Доставка: <b>${esc(order.deliveryLabel)}</b>`;

  const lines = [
    `📯 <b>Замовлення №${esc(order.number)}</b>`,
    "",
    `<b>Джерело:</b> сайт BrandShop`,
    `<b>Оплата:</b> ${esc(paymentText(order))}`,
    `<b>Сума замовлення:</b> ${subtotal}`,
    `<b>Знижка:</b> ${discount}`,
    `<b>Знижка по промокоду:</b> ${promoLine}`,
    `💵 <b>Сума до сплати: ${money(order.total)}</b>`,
    "",
    `🛒 <b>Товари</b>`,
    items,
    "",
    `👤 <b>Клієнт і доставка</b>`,
    `ПІБ: <b>${esc(order.name)}</b>`,
    `Телефон: <code>${esc(order.phone)}</code>`,
  ];

  if (order.email) {
    lines.push(`Email: <code>${esc(order.email)}</code>`);
  }

  lines.push(deliveryBlock);

  if (order.comment) {
    lines.push("", `💬 <b>Коментар:</b> ${esc(order.comment)}`);
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
      caption: `📷 Фото замовлення №${esc(order.number)}`,
      parse_mode: "HTML",
    });
    return;
  }

  const media = photos.map((url, i) => ({
    type: "photo" as const,
    media: url,
    ...(i === 0
      ? {
          caption: `📷 Фото замовлення №${esc(order.number)}`,
          parse_mode: "HTML",
        }
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
      parse_mode: "HTML",
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
