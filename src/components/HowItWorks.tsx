const steps = [
  {
    title: 'Search',
    description: 'Filter by specialty, location, online sessions, language, and availability.'
  },
  {
    title: 'Compare',
    description: 'Read profiles, prices, ratings, and reviews to find your match.'
  },
  {
    title: 'Book',
    description: 'Pick a time slot and confirm your appointment in seconds.'
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="section-shell py-14 sm:py-16" aria-labelledby="how-title">
      <h2 id="how-title" className="section-title">
        How it works
      </h2>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <article key={step.title} className="rounded-card border border-borderGray bg-white p-5 shadow-card">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {index + 1}
            </span>
            <h3 className="mt-4 text-lg font-semibold text-textMain">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
