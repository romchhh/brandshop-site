/**
 * Довідник Нової Пошти (міста, відділення / поштомати).
 * Ключ опційний для getCities / getWarehouses.
 */

const NP_JSON = "https://api.novaposhta.ua/v2.0/json/";

export type NpCity = { ref: string; name: string };
export type NpWarehouse = { ref: string; description: string; number: string };

function getApiKey(): string {
  return (
    process.env.NOVA_POSHTA_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_NOVA_POSHTA_API_KEY?.trim() ||
    ""
  );
}

async function npDirectoryRequest<T>(
  modelName: string,
  calledMethod: string,
  methodProperties: Record<string, unknown>,
): Promise<{ success: boolean; data: T[]; error?: string }> {
  try {
    const res = await fetch(NP_JSON, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: getApiKey(),
        modelName,
        calledMethod,
        methodProperties,
      }),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      success: boolean;
      data?: T[];
      errors?: { message?: string }[] | string[];
    };

    if (!json.success) {
      const first = json.errors?.[0];
      const msg =
        typeof first === "string"
          ? first
          : (first as { message?: string } | undefined)?.message ??
            "Помилка API Нової Пошти";
      return { success: false, data: [], error: msg };
    }

    return { success: true, data: json.data ?? [] };
  } catch {
    return {
      success: false,
      data: [],
      error: "Не вдалося з'єднатися з API Нової Пошти",
    };
  }
}

export async function searchNovaPoshtaCities(
  findByString: string,
  limit = 20,
): Promise<{ cities: NpCity[]; error?: string }> {
  const query = findByString.trim();
  if (query.length < 2) return { cities: [] };

  const result = await npDirectoryRequest<{ Description: string; Ref: string }>(
    "Address",
    "getCities",
    { FindByString: query, Limit: limit },
  );

  if (!result.success) {
    return { cities: [], error: result.error ?? "Не вдалося завантажити міста" };
  }

  return {
    cities: result.data.map((c) => ({ ref: c.Ref, name: c.Description })),
  };
}

export async function searchNovaPoshtaWarehouses(options: {
  cityRef?: string;
  cityName?: string;
  findByString?: string;
  limit?: number;
}): Promise<{ warehouses: NpWarehouse[]; error?: string }> {
  const cityRef = options.cityRef?.trim();
  const cityName = options.cityName?.trim();
  if (!cityRef && !cityName) {
    return { warehouses: [], error: "Оберіть місто" };
  }

  const methodProperties: Record<string, unknown> = {
    Limit: options.limit ?? 50,
  };
  if (cityRef) methodProperties.CityRef = cityRef;
  else methodProperties.CityName = cityName;

  const find = options.findByString?.trim();
  if (find) methodProperties.FindByString = find;

  const result = await npDirectoryRequest<{
    Description: string;
    Ref: string;
    Number?: string;
  }>("Address", "getWarehouses", methodProperties);

  if (!result.success) {
    return {
      warehouses: [],
      error: result.error ?? "Не вдалося завантажити відділення",
    };
  }

  return {
    warehouses: result.data.map((w) => ({
      ref: w.Ref,
      description: w.Description,
      number: w.Number ?? "",
    })),
  };
}

export function normalizeUaPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("0") && d.length === 10) return `+38${d}`;
  if (d.startsWith("380") && d.length >= 12) return `+${d}`;
  if (d.startsWith("380")) return `+${d}`;
  if (d.length === 9) return `+380${d}`;
  return phone.trim().startsWith("+") ? phone.trim() : `+${d}`;
}
