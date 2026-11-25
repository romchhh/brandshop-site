"use client";

import { useState } from "react";
import { useShop } from "./ShopProvider";

export function NewsletterForm() {
  const { showToast } = useShop();
  const [email, setEmail] = useState("");

  function subscribe(e: React.FormEvent) {
    e.preventDefault();
    if (email.includes("@")) {
      showToast("Дякуємо, ми повідомимо про новинки");
      setEmail("");
    }
  }

  return (
    <form
      onSubmit={subscribe}
      className="mx-auto flex max-w-md overflow-hidden rounded-2xl border border-line md:mx-0 md:max-w-none"
    >
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Ваш email"
        className="min-w-0 flex-1 bg-transparent px-3.5 py-3 text-[0.9375rem] outline-none md:px-4 md:py-3.5 md:text-[1rem]"
      />
      <button
        type="submit"
        className="shrink-0 bg-ink px-3.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white transition-colors hover:bg-sale md:px-4 md:text-[0.72rem] md:tracking-[0.16em]"
      >
        Підписатись
      </button>
    </form>
  );
}
