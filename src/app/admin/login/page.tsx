"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { AdminBtn, AdminInput } from "@/components/admin/adminUi";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Помилка входу");
        return;
      }
      const next = search.get("next") || "/admin";
      router.replace(next.startsWith("/admin") ? next : "/admin");
      router.refresh();
    } catch {
      setError("Мережева помилка");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 20%, rgba(140,47,57,0.45), transparent), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(140,47,57,0.2), transparent)",
        }}
      />
      <form
        onSubmit={onSubmit}
        className="relative w-full max-w-[400px] rounded-[1.35rem] border border-white/10 bg-white p-7 shadow-[0_24px_80px_rgba(0,0,0,0.35)] sm:p-8"
      >
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-mute">
          BrandShop Admin
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Вхід до панелі
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-mute">
          Керування каталогом, новинками та замовленнями.
        </p>

        <label className="mt-7 block text-sm font-medium text-ink">
          Пароль
          <div className="mt-2">
            <AdminInput
              type="password"
              value={password}
              onChange={setPassword}
              autoFocus
              required
              placeholder="••••••••"
            />
          </div>
        </label>

        {error ? (
          <p className="mt-3 text-sm font-medium text-sale" role="alert">
            {error}
          </p>
        ) : null}

        <AdminBtn
          type="submit"
          disabled={loading}
          className="mt-5 !h-11 w-full"
        >
          {loading ? "Вхід…" : "Увійти"}
        </AdminBtn>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <LoginForm />
    </Suspense>
  );
}
