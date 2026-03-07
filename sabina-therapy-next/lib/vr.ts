export function slugifyScenarioTitle(title: string): string {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "vr-scenario";
}

export function pickLocalizedText(
  lang: "en" | "ar",
  values: { en: string; ar: string }
): string {
  return lang === "ar" ? values.ar : values.en;
}
