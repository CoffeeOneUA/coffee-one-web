import { Link } from 'react-router-dom';
import type { Listing } from '../lib/supabase';
import { Icon } from './Icon';
import { pluralGroups } from '../lib/pluralize';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' });
}

interface Props {
  listing: Listing;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export function ListingCard({ listing, isFavorite, onToggleFavorite }: Props) {
  const photo = listing.photos?.[0];

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="group block bg-coffee-surface rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(30,50,80,0.07)] hover:shadow-[0_8px_24px_rgba(30,50,80,0.12)] transition-shadow"
    >
      <div className="relative aspect-[4/3] bg-coffee-blue-light overflow-hidden">
        {listing.is_coffee_one_seller && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-coffee-blue text-white text-[11px] font-bold text-center py-1 flex items-center justify-center gap-1">
            <Icon name="coffeeCup" size={11} /> Продавець Coffee One
          </div>
        )}

        {photo ? (
          <img src={photo} alt={listing.title} className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="coffeeCup" size={48} color="var(--color-coffee-blue-dark)" />
          </div>
        )}

        <div className={`absolute left-2 flex gap-1.5 ${listing.is_coffee_one_seller ? 'top-8' : 'top-2'}`}>
          {listing.is_top && (
            <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-coffee-amber text-white inline-flex items-center gap-1">
              <Icon name="star" size={10} filled /> ТОП
            </span>
          )}
          {listing.is_verified && (
            <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-coffee-green text-white inline-flex items-center gap-1">
              <Icon name="checkCircle" size={11} /> Перевірено
            </span>
          )}
        </div>

        <button
          onClick={(e) => {
            e.preventDefault();
            onToggleFavorite();
          }}
          className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center hover:scale-105 transition-transform"
        >
          <Icon name="heart" size={15} filled={isFavorite} color={isFavorite ? 'var(--color-coffee-red)' : 'var(--color-coffee-muted)'} />
        </button>

        {listing.photos?.length > 1 && (
          <span className="absolute bottom-2 right-2 text-[11px] font-semibold px-2 py-1 rounded-lg bg-black/55 text-white inline-flex items-center gap-1">
            <Icon name="camera" size={11} /> {listing.photos.length}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide">{listing.brands?.name}</div>
        <div className="font-bold text-coffee-dark mt-0.5 line-clamp-2 leading-snug">{listing.title}</div>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-extrabold text-coffee-dark">{Number(listing.price_uah).toLocaleString('uk-UA')} ₴</span>
          <span className="text-xs text-coffee-muted">≈ ${Number(listing.price_usd).toLocaleString()}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {listing.categories?.name && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-coffee-chip text-coffee-dark">{listing.categories.name}</span>
          )}
          {listing.groups ? (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-coffee-chip text-coffee-dark">{listing.groups} {pluralGroups(listing.groups)}</span>
          ) : null}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-coffee-chip text-coffee-dark">
            {listing.condition === 'new' ? 'Нове' : 'Вживане'}
          </span>
          {listing.no_commission && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-coffee-green-light text-coffee-green inline-flex items-center gap-1">
              <Icon name="wallet" size={11} /> Без комісії
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-coffee-line flex items-center justify-between text-xs text-coffee-muted">
          <span className="inline-flex items-center gap-1"><Icon name="pin" size={11} /> {listing.city}</span>
          <span className="inline-flex items-center gap-1"><Icon name="eye" size={11} /> {listing.views ?? 0} · {formatDate(listing.created_at)}</span>
        </div>
      </div>
    </Link>
  );
}
