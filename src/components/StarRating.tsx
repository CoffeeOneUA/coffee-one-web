export function StarRating({ rating, reviewsCount, size = 'sm' }: { rating: number | null | undefined; reviewsCount: number | null | undefined; size?: 'sm' | 'lg' }) {
  // profiles.rating дефолтиться в базі на 5 для щойно зареєстрованих —
  // тож навіть без жодного відгуку є що показати, просто позначаємо, що
  // це ще не підтверджено реальними угодами.
  const value = rating != null ? Number(rating) : 5;
  const rounded = Math.round(value);
  const hasReviews = !!reviewsCount;
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-coffee-amber ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
      <span>{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>
      <span className="text-coffee-dark">{value.toFixed(1)}</span>
      <span className="text-coffee-muted font-medium">{hasReviews ? `(${reviewsCount})` : '· Новий продавець'}</span>
    </span>
  );
}
