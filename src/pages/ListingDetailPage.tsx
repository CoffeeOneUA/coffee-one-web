import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useFavorites } from '../hooks/useFavorites';
import { useAuth } from '../contexts/AuthContext';
import { getOrCreateConversation } from '../hooks/useConversations';
import { getFunctionErrorMessage } from '../lib/functionError';
import { supabase } from '../lib/supabase';
import { StarRating } from '../components/StarRating';

const PAYMENT_POLL_INTERVAL_MS = 2500;
const PAYMENT_POLL_MAX_ATTEMPTS = 48; // ~2 хв

const GATEWAY_LABEL: Record<string, string> = { wayforpay: 'WayForPay', monobank: 'Monobank' };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const touchStartXRef = useRef(0);
  const [contacting, setContacting] = useState(false);
  const [offerAmount, setOfferAmount] = useState('');
  const [offerOpen, setOfferOpen] = useState(false);

  const [safeDeliveryOpen, setSafeDeliveryOpen] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null);
  const [availableGateways, setAvailableGateways] = useState<string[] | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [purchaseStage, setPurchaseStage] = useState<'idle' | 'opening' | 'waiting' | 'confirming'>('idle');

  useEffect(() => {
    if (!safeDeliveryOpen || !listing || deliveryFee !== null) return;
    (async () => {
      const [{ data: category }, { data: gw }] = await Promise.all([
        supabase.from('categories').select('safe_delivery_fee_uah').eq('id', listing.category_id).maybeSingle(),
        supabase.functions.invoke('payment-gateways'),
      ]);
      setDeliveryFee(listing.no_commission ? 0 : Number(category?.safe_delivery_fee_uah ?? 0));
      const gateways: string[] = gw?.gateways ?? [];
      setAvailableGateways(gateways);
      if (gateways.length === 1) setSelectedGateway(gateways[0]);
    })();
  }, [safeDeliveryOpen, listing, deliveryFee]);

  useEffect(() => {
    if (!lightboxOpen || !listing) return;
    const total = listing.photos?.length ?? 0;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setLightboxOpen(false);
      else if (total > 1 && e.key === 'ArrowLeft') setActivePhoto((i) => (i - 1 + total) % total);
      else if (total > 1 && e.key === 'ArrowRight') setActivePhoto((i) => (i + 1) % total);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxOpen, listing]);

  async function handleSafeDeliveryBuy() {
    if (!listing || !selectedGateway) {
      alert('Наразі жоден спосіб оплати не увімкнений. Спробуйте пізніше.');
      return;
    }
    try {
      setPurchaseStage('opening');
      const { data: result, error } = await supabase.functions.invoke('buy-with-safe-delivery', {
        body: { listing_id: listing.id, gateway: selectedGateway },
      });
      if (error || !result || result.error) {
        throw new Error(await getFunctionErrorMessage(error, result, 'Не вдалося оформити покупку'));
      }

      window.open(result.payment_url, '_blank', 'noopener,noreferrer');

      setPurchaseStage('waiting');
      let status: string | null = null;
      for (let attempt = 0; attempt < PAYMENT_POLL_MAX_ATTEMPTS; attempt++) {
        const { data: check } = await supabase.functions.invoke('check-safe-delivery-payment-status', {
          body: { order_reference: result.order_reference },
        });
        status = check?.status ?? null;
        if (status === 'paid' || status === 'failed') break;
        await sleep(PAYMENT_POLL_INTERVAL_MS);
      }

      if (status === 'failed') {
        alert('Оплату не завершено. Спробуйте оплатити ще раз.');
        return;
      }
      if (status !== 'paid') {
        alert('Оплата обробляється трохи довше — перевірте статус за кілька хвилин у своїх повідомленнях.');
        return;
      }

      setPurchaseStage('confirming');
      const { data: confirmed, error: confirmError } = await supabase.functions.invoke('confirm-safe-delivery-purchase', {
        body: { order_reference: result.order_reference },
      });
      if (confirmError || !confirmed || confirmed.error) {
        throw new Error(
          await getFunctionErrorMessage(confirmError, confirmed, 'Оплата пройшла, але не вдалося оформити покупку. Зверніться у підтримку.'),
        );
      }

      alert("Куплено! 🚚 Оплату прийнято, кошти в безпечному утриманні Coffee One. Деталі — у чаті з продавцем.");
      navigate(`/chats/${confirmed.conversation_id}`);
    } catch (e: any) {
      alert(e.message ?? 'Сталася помилка');
    } finally {
      setPurchaseStage('idle');
    }
  }

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

  function prevPhoto() {
    setActivePhoto((i) => (i - 1 + photos.length) % photos.length);
  }
  function nextPhoto() {
    setActivePhoto((i) => (i + 1) % photos.length);
  }

  // Свайп по фото — і на головному зображенні, і в лайтбоксі.
  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) < 40 || photos.length < 2) return;
    if (deltaX > 0) prevPhoto();
    else nextPhoto();
  }

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
        <div
          className="relative aspect-[4/3] bg-coffee-blue-light rounded-2xl overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {listing.is_coffee_one_seller && (
            <div className="absolute top-0 left-0 right-0 z-10 bg-coffee-blue text-white text-xs font-bold text-center py-1.5">
              ☕ Продавець Coffee One
            </div>
          )}
          {photos.length > 0 ? (
            <img
              src={photos[activePhoto]}
              alt={listing.title}
              onClick={() => setLightboxOpen(true)}
              className="w-full h-full object-cover cursor-zoom-in"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-8xl">☕</div>
          )}
          <button
            onClick={() => toggleListingFavorite(listing.id)}
            className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-white/90 flex items-center justify-center text-lg"
          >
            <span className={liked ? 'text-coffee-red' : 'text-coffee-muted'}>{liked ? '♥' : '♡'}</span>
          </button>
          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                aria-label="Попереднє фото"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-lg hover:bg-white transition-colors"
              >
                ‹
              </button>
              <button
                onClick={nextPhoto}
                aria-label="Наступне фото"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center text-lg hover:bg-white transition-colors"
              >
                ›
              </button>
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 bg-black/55 text-white text-[11px] font-semibold px-2 py-1 rounded-lg">
                {activePhoto + 1}/{photos.length}
              </div>
            </>
          )}
        </div>
        {photos.length > 1 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {photos.map((p, i) => (
              <button
                key={p}
                onClick={() => setActivePhoto(i)}
                className={`shrink-0 w-20 aspect-[4/3] rounded-lg overflow-hidden border-2 ${i === activePhoto ? 'border-coffee-blue' : 'border-transparent'}`}
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
          <div className="w-12 h-12 rounded-full bg-coffee-blue text-white flex items-center justify-center font-extrabold text-lg shrink-0 overflow-hidden">
            {listing.profiles?.avatar_url ? (
              <img src={listing.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              listing.profiles?.full_name?.[0]?.toUpperCase() ?? 'К'
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-coffee-dark">{isOwner ? 'Це ваше оголошення' : listing.profiles?.full_name ?? 'Продавець'}</div>
            <div className="mt-0.5"><StarRating rating={listing.profiles?.rating} reviewsCount={listing.profiles?.reviews_count} /></div>
          </div>
          {!isOwner && listing.profiles?.phone && (
            <a
              href={`tel:${listing.profiles.phone}`}
              title="Зателефонувати"
              className="w-11 h-11 rounded-full bg-coffee-blue text-white flex items-center justify-center text-lg shrink-0 hover:bg-coffee-blue-dark transition-colors"
            >
              📞
            </a>
          )}
        </div>

        {!isOwner && (
          <div className="flex flex-col gap-2.5 mt-4">
            {/* Безпечна доставка не потребує згоди продавця — покупець вмикає
                й оплачує її самостійно, доступна на будь-якому оголошенні. */}
            <button
              onClick={() => {
                if (!isAuthenticated) { navigate('/login'); return; }
                setSafeDeliveryOpen(true);
              }}
              className="w-full bg-coffee-dark text-white font-extrabold rounded-xl py-3.5 hover:opacity-90 transition-opacity"
            >
              🚚 Купити з безпечною доставкою
              {listing.no_commission && (
                <div className="text-coffee-green text-xs font-bold mt-0.5">💰 Без комісії — все включено у вартість</div>
              )}
            </button>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => goToChat(false)}
                disabled={contacting}
                className="flex-1 border-2 border-coffee-blue text-coffee-blue font-bold rounded-xl py-3 hover:bg-coffee-blue-light transition-colors disabled:opacity-50"
              >
                💬 Написати
              </button>
              <button
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); return; }
                  setOfferOpen(true);
                }}
                disabled={contacting}
                className="flex-1 border-2 border-coffee-blue text-coffee-blue font-bold rounded-xl py-3 hover:bg-coffee-blue-light transition-colors disabled:opacity-50"
              >
                💰 Пропозиція
              </button>
            </div>
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

        {safeDeliveryOpen && (
          <div
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => purchaseStage === 'idle' && setSafeDeliveryOpen(false)}
          >
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
              <div className="font-extrabold text-coffee-dark text-lg mb-4">Купити з безпечною доставкою</div>

              {deliveryFee === null ? (
                <div className="text-coffee-muted text-sm py-4 text-center">Завантаження…</div>
              ) : (
                <>
                  <div className="bg-coffee-surface rounded-xl p-4">
                    <div className="flex items-center justify-between text-sm py-1">
                      <span className="text-coffee-muted">Ціна товару</span>
                      <span className="font-bold text-coffee-dark">{Number(listing.price_uah).toLocaleString('uk-UA')} ₴</span>
                    </div>
                    <div className="flex items-center justify-between text-sm py-1">
                      <span className="text-coffee-muted">Безпечна доставка</span>
                      <span className="font-bold text-coffee-dark">{deliveryFee > 0 ? `${deliveryFee.toLocaleString('uk-UA')} ₴` : 'Безкоштовно'}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-coffee-line">
                      <span className="font-bold text-coffee-dark">До сплати</span>
                      <span className="font-extrabold text-coffee-dark text-lg">
                        {(Number(listing.price_uah) + deliveryFee).toLocaleString('uk-UA')} ₴
                      </span>
                    </div>
                  </div>

                  {listing.no_commission && (
                    <div className="bg-coffee-green-light rounded-xl p-3 mt-3">
                      <p className="text-coffee-green text-xs font-semibold leading-relaxed">
                        💰 Без комісії — це товар від Coffee One, тож доставка нічого не коштує. Ціна, яку ви бачите, це все, що ви платите.
                      </p>
                    </div>
                  )}

                  <p className="text-coffee-muted text-xs leading-relaxed mt-3">
                    Гроші «заморожуються» у Coffee One, поки ви не отримаєте товар і не підтвердите угоду. Ми беремо на
                    себе логістику й арбітраж спірних випадків.
                  </p>

                  {availableGateways != null && availableGateways.length > 1 && (
                    <div className="mt-4">
                      <div className="text-xs font-bold text-coffee-muted uppercase tracking-wide mb-1.5">Спосіб оплати</div>
                      <div className="grid gap-1.5 bg-coffee-surface border-2 border-coffee-line rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${availableGateways.length}, 1fr)` }}>
                        {availableGateways.map((gw) => (
                          <button
                            key={gw}
                            onClick={() => setSelectedGateway(gw)}
                            className={`text-sm font-semibold py-2 rounded-lg ${selectedGateway === gw ? 'bg-coffee-blue text-white' : 'text-coffee-muted hover:text-coffee-dark'}`}
                          >
                            {GATEWAY_LABEL[gw] ?? gw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {availableGateways != null && availableGateways.length === 0 && (
                    <p className="text-coffee-red text-xs font-semibold mt-3">Наразі жоден спосіб оплати не увімкнений. Спробуйте пізніше.</p>
                  )}

                  <div className="flex gap-2.5 mt-4">
                    <button
                      onClick={() => setSafeDeliveryOpen(false)}
                      disabled={purchaseStage !== 'idle'}
                      className="flex-1 bg-coffee-chip text-coffee-dark font-bold rounded-xl py-3 disabled:opacity-50"
                    >
                      Скасувати
                    </button>
                    <button
                      onClick={handleSafeDeliveryBuy}
                      disabled={purchaseStage !== 'idle' || !selectedGateway}
                      className="flex-1 bg-coffee-blue text-white font-bold rounded-xl py-3 disabled:opacity-50"
                    >
                      {purchaseStage === 'idle' && 'Оплатити'}
                      {purchaseStage === 'opening' && 'Секунду…'}
                      {purchaseStage === 'waiting' && 'Очікуємо оплату…'}
                      {purchaseStage === 'confirming' && 'Оформлюємо…'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {lightboxOpen && photos.length > 0 && (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <button
              onClick={() => setLightboxOpen(false)}
              aria-label="Закрити"
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-xl"
            >
              ✕
            </button>
            <img
              src={photos[activePhoto]}
              alt={listing.title}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[92vw] max-h-[85vh] object-contain"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  aria-label="Попереднє фото"
                  className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl"
                >
                  ‹
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  aria-label="Наступне фото"
                  className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-2xl"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
                  {activePhoto + 1}/{photos.length}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
