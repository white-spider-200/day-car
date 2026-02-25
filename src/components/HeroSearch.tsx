import type { FormEvent } from 'react';

const trustPills = ['Verified doctors', 'Privacy-first', 'Secure booking'];

const stats = [
  { label: 'Available doctors', value: '128' },
  { label: 'Online sessions', value: '74' },
  { label: 'Avg. rating', value: '4.8/5' },
  { label: 'Next slot', value: 'Today 6:30 PM' }
];

export default function HeroSearch() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blueBg/50 to-blueBg/80 py-14 sm:py-20">
      <div className="section-shell grid items-start gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-textMain sm:text-5xl">
            Find the right psychologist for you.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg">
            Search verified doctors by specialty, city, language, and availability. Book online or in-person
            sessions.
          </p>

          <form
            className="mt-8 rounded-hero border border-borderGray bg-white p-4 shadow-soft sm:p-5"
            aria-label="Search doctors"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">Specialty / Issue</span>
                <input
                  type="text"
                  placeholder="Anxiety, Depression, Couples..."
                  className="focus-outline h-12 w-full rounded-2xl border border-borderGray bg-white px-4 text-sm text-textMain placeholder:text-slate-400"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-muted">City or Mode</span>
                <input
                  type="text"
                  placeholder="Amman or Online"
                  className="focus-outline h-12 w-full rounded-2xl border border-borderGray bg-white px-4 text-sm text-textMain placeholder:text-slate-400"
                />
              </label>

              <button
                type="submit"
                className="focus-outline h-12 rounded-2xl bg-primary px-6 text-sm font-semibold text-white transition hover:bg-primaryDark"
              >
                Search
              </button>
            </div>
          </form>

          <ul className="mt-4 flex flex-wrap gap-2" aria-label="Trust indicators">
            {trustPills.map((pill) => (
              <li
                key={pill}
                className="inline-flex items-center gap-2 rounded-full border border-borderGray bg-white/90 px-3 py-2 text-xs font-medium text-muted shadow-sm"
              >
                <span className="inline-block h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                {pill}
              </li>
            ))}
          </ul>
        </div>

        <aside className="rounded-hero border border-borderGray bg-white/95 p-5 shadow-soft sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Platform snapshot</h2>
          <ul className="mt-4 space-y-4" aria-label="Platform stats">
            {stats.map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-4 border-b border-borderGray pb-3 last:border-none last:pb-0">
                <span className="text-sm text-muted">{item.label}</span>
                <span className="text-sm font-bold text-textMain">{item.value}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
