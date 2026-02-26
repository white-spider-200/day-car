import { useMemo, useState } from 'react';
import type { ReviewItem } from '../../data/doctorProfileData';

type RatingDistribution = {
  stars: number;
  count: number;
};

type ReviewsSectionProps = {
  averageRating: number;
  totalReviews: number;
  distribution: RatingDistribution[];
  reviews: ReviewItem[];
};

type SortOption = 'newest' | 'highest';

function initialsFromAuthor(author: string) {
  return author
    .replace('Anonymous', 'A')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function ReviewsSection({ averageRating, totalReviews, distribution, reviews }: ReviewsSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const sortedReviews = useMemo(() => {
    const items = [...reviews];

    if (sortBy === 'highest') {
      items.sort((a, b) => b.rating - a.rating);
      return items;
    }

    items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return items;
  }, [reviews, sortBy]);

  const maxCount = useMemo(() => Math.max(...distribution.map((item) => item.count)), [distribution]);

  return (
    <section className="rounded-card border border-borderGray bg-white p-5 shadow-card sm:p-6" aria-labelledby="reviews-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="reviews-heading" className="text-xl font-bold text-textMain">
          Reviews
        </h2>

        <label className="text-sm text-muted">
          Sort by{' '}
          <select
            className="focus-outline ml-2 rounded-lg border border-borderGray bg-white px-3 py-1.5 text-sm text-textMain"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
          >
            <option value="newest">Newest</option>
            <option value="highest">Highest rating</option>
          </select>
        </label>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[260px_1fr]">
        <aside className="rounded-2xl border border-borderGray bg-slate-50/60 p-4">
          <p className="text-3xl font-extrabold text-textMain">{averageRating.toFixed(1)}/5</p>
          <p className="mt-1 text-sm text-muted">Based on {totalReviews} reviews</p>

          <ul className="mt-4 space-y-2" aria-label="Rating distribution">
            {distribution.map((item) => (
              <li key={item.stars} className="grid grid-cols-[36px_1fr_36px] items-center gap-2 text-xs text-muted">
                <span>{item.stars}★</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-primary-100">
                  <span
                    className="block h-full rounded-full bg-primary"
                    style={{ width: `${(item.count / maxCount) * 100}%` }}
                    aria-hidden="true"
                  />
                </span>
                <span className="text-right">{item.count}</span>
              </li>
            ))}
          </ul>
        </aside>

        <div className="space-y-3">
          {sortedReviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-borderGray p-4 transition hover:border-primary-200">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-primaryBg text-xs font-bold text-primary">
                  {initialsFromAuthor(review.author)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-textMain">{review.author}</h3>
                      <p className="text-xs text-muted">{review.date}</p>
                    </div>
                    <p className="text-sm font-semibold text-textMain">⭐ {review.rating.toFixed(1)}</p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-muted">{review.text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
