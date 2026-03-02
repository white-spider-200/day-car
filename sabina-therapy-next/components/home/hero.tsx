"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Hero() {
  const [search, setSearch] = useState("");
  const { dictionary } = useLanguage();

  const href = useMemo(() => {
    const q = search.trim();
    if (!q) return "/doctors";
    const params = new URLSearchParams({ q });
    return `/doctors?${params.toString()}`;
  }, [search]);

  return (
    <section className="section-shell py-12 sm:py-16">
      <div className="grid gap-8 rounded-3xl border border-medical-100 bg-white p-8 shadow-sm md:grid-cols-[1.2fr_1fr] md:items-center">
        <div>
          <p className="mb-2 inline-block rounded-full bg-medical-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-medical-700">
            Sabina Therapy
          </p>
          <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
            {dictionary.heroTitle}
          </h1>
          <p className="mt-3 text-base text-slate-600">{dictionary.heroSubtitle}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={dictionary.searchPlaceholder}
            />
            <Link href={href}>
              <Button className="w-full sm:w-auto">{dictionary.viewDoctors}</Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-medical-500 to-medical-700 p-6 text-white">
          <h2 className="text-xl font-semibold">Secure booking in 3 steps</h2>
          <ol className="mt-4 space-y-2 text-sm text-medical-50">
            <li>1. Choose specialty and doctor</li>
            <li>2. Pick your schedule slot</li>
            <li>3. Join session online or in clinic</li>
          </ol>
        </div>
      </div>
    </section>
  );
}
