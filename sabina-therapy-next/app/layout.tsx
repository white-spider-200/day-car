import type { Metadata } from "next";
import { Cairo, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { AppProviders } from "@/components/providers/app-providers";
import "@/app/globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const cairo = Cairo({ subsets: ["arabic"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Sabina Therapy",
  description: "Therapy and psychiatry booking platform"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${manrope.variable} ${cairo.variable} font-[var(--font-manrope)]`}>
        <AppProviders>
          <SiteHeader />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  );
}
