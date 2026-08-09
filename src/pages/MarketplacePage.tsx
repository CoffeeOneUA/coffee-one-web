import { useState } from 'react';
import { useListings, type ListingFilters } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { useCity } from '../contexts/CityContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { ListingCard } from '../components/ListingCard';
import { FilterPanel } from '../components/FilterPanel';

const SORT_OPTIONS: { value: NonNullable<ListingFilters['sort']>; label: string }[] = [
  { value: 'newest', label: 'Спочатку нові' },
  { value: 'price_asc', label: 'Спочатку дешевші' },
  { value: 'price_desc', label: 'Спочатку дорожчі' },
];

export default function MarketplacePage() {
  const [filters, setFilters] = useState<ListingFilters>({ sort: 'newest' });
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { city } = useCity();
  const { listings, loading, error } = useListings({ ...filters, search, city });
  const { listingIds: favoriteIds, toggleListingFavorite } = useFavorites();
  const { hero_title, hero_subtitle } = useSiteSettings();

  const activeFilterCount =
    (filters.category ? 1 : 0) +
    (filters.brand ? 1 : 0) +
    (filters.modelId ? 1 : 0) +
    (filters.condition?.length ?? 0) +
    (filters.groups?.length ?? 0) +
    (filters.priceMin != null || filters.priceMax != null ? 1 : 0);

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-coffee-dark tracking-tight">{hero_title}</h1>
        <p className="text-coffee-muted text-sm mt-1">{hero_subtitle}</p>
      </div>

      <div className="flex gap-2 mb-5">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Пошук за назвою…"
          className="flex-1 bg-coffee-surface rounded-xl px-4 py-3 text-sm shadow-[0_2px_8px_rgba(30,50,80,0.06)] outline-none focus:ring-2 focus:ring-coffee-blue"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value as ListingFilters['sort'] })}
          className="bg-coffee-surface rounded-xl px-3 py-3 text-sm font-semibold shadow-[0_2px_8px_rgba(30,50,80,0.06)] outline-none cursor-pointer hidden sm:block"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="lg:hidden bg-coffee-blue text-white rounded-xl px-4 py-3 text-sm font-bold shrink-0"
        >
          Фільтри{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
        </button>
      </div>

      <select
        value={filters.sort}
        onChange={(e) => setFilters({ ...filters, sort: e.target.value as ListingFilters['sort'] })}
        className="sm:hidden w-full mb-5 bg-coffee-surface rounded-xl px-3 py-3 text-sm font-semibold shadow-[0_2px_8px_rgba(30,50,80,0.06)] outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className={`${filtersOpen ? 'block' : 'hidden'} lg:block`}>
          <div className="lg:sticky lg:top-20">
            <FilterPanel filters={filters} onChange={setFilters} onReset={() => setFilters({ sort: filters.sort })} />
          </div>
        </aside>

        <div>
          <div className="text-sm text-coffee-muted mb-3">{loading ? 'Завантаження…' : `${listings.length} оголошень`}</div>

          {error ? (
            <div className="bg-coffee-surface rounded-2xl p-10 text-center text-coffee-red font-semibold">Помилка завантаження</div>
          ) : loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-coffee-surface rounded-2xl aspect-[4/5] animate-pulse" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="bg-coffee-surface rounded-2xl p-14 text-center">
              <div className="text-5xl mb-3">📭</div>
              <div className="font-extrabold text-coffee-dark text-lg mb-1">Оголошень не знайдено</div>
              <div className="text-coffee-muted text-sm">Спробуйте змінити фільтри або пошук</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} isFavorite={favoriteIds.has(l.id)} onToggleFavorite={() => toggleListingFavorite(l.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
