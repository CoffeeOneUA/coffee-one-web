import { useEffect, useState } from 'react';
import { supabase, type Listing } from '../lib/supabase';
import { useFavorites } from '../hooks/useFavorites';
import { ListingCard } from '../components/ListingCard';

export default function FavoritesPage() {
  const { listingIds, loading: favLoading, toggleListingFavorite } = useFavorites();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favLoading) return;
    const ids = Array.from(listingIds);
    if (ids.length === 0) {
      setListings([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from('listings')
      .select('*, brands(name), categories(name, emoji)')
      .in('id', ids)
      .then(({ data }) => {
        setListings(data ?? []);
        setLoading(false);
      });
  }, [favLoading, Array.from(listingIds).join(',')]);

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-coffee-dark tracking-tight mb-5">Обране</h1>

      {loading ? (
        <div className="text-coffee-muted text-center py-16">Завантаження…</div>
      ) : listings.length === 0 ? (
        <div className="bg-coffee-surface rounded-2xl p-14 text-center">
          <div className="text-5xl mb-3">🤍</div>
          <div className="font-extrabold text-coffee-dark text-lg mb-1">Обраного поки немає</div>
          <div className="text-coffee-muted text-sm">Тапніть на сердечко на оголошенні, щоб додати його сюди</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} isFavorite onToggleFavorite={() => toggleListingFavorite(l.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
