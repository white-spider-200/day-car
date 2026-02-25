import type { Category } from '../data/homeData';

type CategoryGridProps = {
  categories: Category[];
};

export default function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <section className="section-shell py-14 sm:py-16" aria-labelledby="categories-title">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h2 id="categories-title" className="section-title">
          Popular categories
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <article
            key={category.name}
            className="group rounded-card border border-borderGray bg-white p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:border-blue-200"
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-textMain">{category.name}</h3>
              <span className="rounded-full bg-blueBg px-3 py-1 text-xs font-semibold text-primary">{category.chip}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
