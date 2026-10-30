import { Icon } from './Icon';

export function StarRating({ rating, reviewsCount, size = 'sm' }: { rating: number | null | undefined; reviewsCount: number | null | undefined; size?: 'sm' | 'lg' }) {
  // profiles.rating дефолтиться в базі на 5 для щойно зареєстрованих —
  // тож навіть без жодного відгуку є що показати, просто позначаємо, що
  // це ще не підтверджено реальними угодами.
  const value = rating != null ? Number(rating) : 5;
  const rounded = Math.round(value);
  const hasReviews = !!reviewsCount;
  const starSize = size === 'lg' ? 15 : 11;
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-coffee-amber ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
      <span className="inline-flex items-center">
        {Array.from({ length: 5 }, (_, i) => (
          <Icon key={i} name="star" size={starSize} filled={i < rounded} color="var(--color-coffee-amber)" />
        ))}
      </span>
      <span className="text-coffee-dark">{value.toFixed(1)}</span>
      <span className="text-coffee-muted font-medium">{hasReviews ? `(${reviewsCount})` : '· Новий продавець'}</span>
    </span>
  );
}
