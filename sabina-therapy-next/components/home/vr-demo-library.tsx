import Link from "next/link";

type VrDemoLibraryProps = {
  scenarios: Array<{
    id: string;
    titleEn: string;
    titleAr: string;
    youtubeId: string;
    slug: string;
  }>;
};

export function VrDemoLibrary({ scenarios }: VrDemoLibraryProps) {
  if (!scenarios.length) {
    return null;
  }

  return (
    <section className="section-shell py-12">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">VR Demo Library</h2>
          <p className="text-sm text-slate-600">Top exposure scenarios curated by doctors.</p>
        </div>
        <Link href="/doctor/vr" className="text-sm text-medical-700 underline">
          Explore more
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900">{scenario.titleEn}</p>
            <p className="mt-1 text-xs text-slate-600">{scenario.titleAr}</p>
            <p className="mt-2 text-xs text-slate-500">youtubeId: {scenario.youtubeId}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
