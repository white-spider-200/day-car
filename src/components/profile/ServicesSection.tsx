import type { ServiceItem } from '../../data/doctorProfileData';

type ServicesSectionProps = {
  items: ServiceItem[];
};

export default function ServicesSection({ items }: ServicesSectionProps) {
  return (
    <section className="rounded-card border border-borderGray bg-white p-5 shadow-card sm:p-6" aria-labelledby="services-heading">
      <h2 id="services-heading" className="text-xl font-bold text-textMain">
        Services
      </h2>

      <div className="mt-5 space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-borderGray bg-white p-4 transition hover:-translate-y-0.5 hover:border-primary-200 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h3 className="text-base font-semibold text-textMain">{item.name}</h3>
              <p className="mt-1 text-sm text-muted">
                {item.price} • {item.duration}
              </p>
            </div>

            <button
              type="button"
              className="focus-outline inline-flex h-10 items-center justify-center rounded-xl border border-borderGray px-4 text-sm font-semibold text-textMain transition hover:border-primary/30 hover:text-primary"
            >
              Book
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
