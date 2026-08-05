import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../hooks/useConversations';
import { StarRating } from '../components/StarRating';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/Kyiv' });
}

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { listing, loading } = useListing(id);
  const { listingIds: favoriteIds, toggleListingFavorite } = useFavorites();
  const { user, isAuthenticated } = useAuth();
  const [activePhoto, setActivePhoto] = useState(0);
  const [contacting, setContacting] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);

  if (loading) {
    return <div className="text-center py-24 text-coffee-muted">Завантаження…</div>;
  }
  if (!listing) {
    return (
      <div className="text-center py-24">
        <div className="text-coffee-red font-bold mb-4">Оголошення не знайдено</div>
        <Link to="/" className="text-coffee-blue font-semibold">← До маркетплейсу</Link>
      </div>
    );
  }

  const isOwner = !!user && listing.user_id === user.id;
  const liked = favoriteIds.has(listing.id);
  const photos = listing.photos ?? [];

  async function goToChat(openOffer: boolean) {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (!listing || contacting) return;
    setContacting(true);
    const conversationId = await getOrCreateConversation(listing.id, listing.user_id);
    setContacting(false);
    if (conversationId) navigate(`/chats/${conversationId}${openOffer ? '?offer=1' : ''}`);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-8">
      {/* Photos */}
      <div>
        <div className="relative aspect-video bg-coffee-blue-light rounded-2xl overflow-hidden">
          {photos.length > 0 ? (
            <img src={photos[activePhoto]} alt={listing.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">☕</div>
          )}
          <button
            onClick={() => toggleListingFavorite(listing.id)}
            className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-lg"
          >
            <span className={liked ? 'text-coffee-red' : 'text-coffee-muted'}>{liked ? '♥' : '♡'}</span>
          </button>
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p}
                onClick={() => setActivePhoto(i)}
                className={`shrink-0 w-20 aspect-video rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-coffee-blue' : 'border-transparent'}`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        <div className="text-3xl font-extrabold text-coffee-dark tracking-tight">
          {Number(listing.price_uah).toLocaleString('uk-UA')} ₴
          <span className="text-base font-semibold text-coffee-muted ml-2">≈ ${Number(listing.price_usd).toLocaleString()}</span>
        </div>
        <h1 className="text-lg font-bold text-coffee-dark mt-1">{listing.title}</h1>

        <div className="flex flex-wrap gap-3 mt-3 text-sm text-coffee-muted">
          <span>📍 {listing.city}</span>
          <span>🕐 {formatDate(listing.created_at)}</span>
          <span>👁 {listing.views ?? 0} переглядів</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-5">
          {[
            { k: 'Бренд', v: listing.brands?.name ?? '—' },
            { k: 'Категорія', v: listing.categories?.name ?? '—' },
            { k: 'Групи', v: listing.groups ? `${listing.groups} групи` : '—' },
            { k: 'Рік', v: listing.year ? String(listing.year) : '—' },
            { k: 'Стан', v: listing.condition === 'new' ? 'Нове' : 'Вживане' },
            { k: 'Місто', v: listing.city },
          ].map((s) => (
            <div key={s.k} className="bg-coffee-surface rounded-xl p-3">
              <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide">{s.k}</div>
              <div className="font-bold text-coffee-dark mt-0.5">{s.v}</div>
            </div>
          ))}
        </div>

        {listing.description && (
          <>
            <div className="font-extrabold text-coffee-dark mt-6 mb-2">Опис</div>
            <div className="bg-coffee-surface rounded-xl p-4 text-sm leading-relaxed text-coffee-dark whitespace-pre-wrap">{listing.description}</div>
          </>
        )}

        <div className="font-extrabold text-coffee-dark mt-6 mb-2">Продавець</div>
        <div className="bg-coffee-surface rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-coffee-blue text-white flex items-center justify-center font-extrabold text-lg shrink-0">
            {listing.profiles?.full_name?.[0]?.toUpperCase() ?? 'К'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-coffee-dark">{isOwner ? 'Це ваше оголошення' : listing.profiles?.full_name ?? 'Продавець'}</div>
            <div className="mt-0.5"><StarRating rating={listing.profiles?.rating} reviewsCount={listing.profiles?.reviews_count} /></div>
          </div>
        </div>

        {!isOwner && (
          <div className="flex flex-col sm:flex-row gap-2.5 mt-4">
            <button
              onClick={() => goToChat(false)}
              disabled={contacting}
              className="flex-1 border-2 border-coffee-blue text-coffee-blue font-bold rounded-xl py-3 hover:bg-coffee-blue-light transition-colors disabled:opacity-50"
            >
              💬 Написати
            </button>
            <button
              onClick={() => setOfferOpen(true)}
              disabled={contacting}
              className="flex-1 border-2 border-coffee-blue text-coffee-blue font-bold rounded-xl py-3 hover:bg-coffee-blue-light transition-colors disabled:opacity-50"
            >
              💰 Пропозиція
            </button>
          </div>
        )}

        {offerOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setOfferOpen(false)}>
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="font-extrabold text-coffee-dark mb-3">Запропонувати ціну</div>
              <input
                autoFocus
                value={offerAmount}
                onChange={(e) => setOfferAmount(e.target.value.replace(/[^\d]/g, ''))}
                placeholder="Сума в ₴"
                className="w-full border-2 border-coffee-line rounded-xl px-4 py-3 font-bold text-lg outline-none focus:border-coffee-blue"
              />
              <div className="flex gap-2.5 mt-4">
                <button onClick={() => setOfferOpen(false)} className="flex-1 bg-coffee-chip text-coffee-dark font-bold rounded-xl py-3">
                  Скасувати
                </button>
                <button
                  onClick={async () => {
                    if (!isAuthenticated) { navigate('/login'); return; }
                    const conversationId = await getOrCreateConversation(listing.id, listing.user_id);
                    if (conversationId) navigate(`/chats/${conversationId}?offer=${offerAmount}`);
                  }}
                  disabled={!offerAmount}
                  className="flex-1 bg-coffee-blue text-white font-bold rounded-xl py-3 disabled:opacity-50"
                >
                  Надіслати
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
