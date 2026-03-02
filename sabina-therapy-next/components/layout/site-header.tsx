"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/components/providers/language-provider";

function roleDashboardPath(role?: string) {
  if (role === "ADMIN") return "/dashboard/admin";
  if (role === "DOCTOR") return "/dashboard/doctor";
  if (role === "USER") return "/dashboard/user";
  return "/login";
}

export function SiteHeader() {
  const { data: session } = useSession();
  const { lang, setLang, dictionary } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-medical-100 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-semibold text-medical-700">
            {dictionary.appName}
          </Link>
          <Link href="/doctors" className="text-sm text-slate-600 hover:text-medical-700">
            {dictionary.viewDoctors}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            type="button"
          >
            {lang === "en" ? "العربية" : "English"}
          </Button>

          {session?.user ? (
            <>
              <Link href={roleDashboardPath(session.user.role)}>
                <Button size="sm">{dictionary.dashboard}</Button>
              </Link>
              <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: "/" })}>
                {dictionary.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button size="sm" variant="outline">
                  {dictionary.login}
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">{dictionary.register}</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
