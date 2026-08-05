export function StarRating({ rating, reviewsCount, size = 'sm' }: { rating: number | null | undefined; reviewsCount: number | null | undefined; size?: 'sm' | 'lg' }) {
  if (!reviewsCount) {
    return <span className={size === 'lg' ? 'text-sm text-coffee-muted' : 'text-xs text-coffee-muted'}>Новий продавець</span>;
  }
  const rounded = Math.round(Number(rating));
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-coffee-amber ${size === 'lg' ? 'text-base' : 'text-xs'}`}>
      <span>{'★'.repeat(rounded)}{'☆'.repeat(5 - rounded)}</span>
      <span className="text-coffee-dark">{Number(rating).toFixed(1)}</span>
      <span className="text-coffee-muted font-medium">({reviewsCount})</span>
    </span>
  );
}
