import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getFunctionErrorMessage } from '../lib/functionError';
import { useAuth } from '../contexts/AuthContext';
import { useModels } from '../hooks/useModels';
import { useCities } from '../hooks/useCities';
import { useExchangeRate } from '../hooks/useExchangeRate';

const PAYMENT_POLL_INTERVAL_MS = 2500;
const PAYMENT_POLL_MAX_ATTEMPTS = 48; // ~2 хв
const YEAR_MIN = 1995;
const YEAR_MAX = 2028;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => String(YEAR_MAX - i));
const YEAR_UNKNOWN = 'unknown';

const CONDITIONS = [
  { label: 'Нове', value: 'new' },
  { label: 'Вживане', value: 'used' },
  { label: 'На запчастини', value: 'parts' },
];
const GROUPS = ['1', '2', '3'];
const GATEWAY_LABEL: Record<string, string> = { wayforpay: 'WayForPay', monobank: 'Monobank' };

const SAFE_PAYMENT_EXPLANATION =
  '«Безпечна оплата» — функція маркетплейсу Coffee One, яка гарантує прозорий продаж товару та убезпечує продавця і покупця від зайвих нюансів.\n\n' +
  'Якщо функція увімкнена, ми забезпечуємо повний цикл угоди: фізична перевірка обладнання, логістика, безпечний платіж (гроші "заморожені" у нас, поки обидві сторони не підтвердять успішність угоди), арбітраж спірних випадків.\n\n' +
  'Всю роботу виконуємо ми — ви просто отримуєте кошти на свій рахунок.';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface CategoryOption { id: string; name: string; slug: string; emoji: string }
interface BrandOption { id: string; name: string; slug: string }
interface SubStatus {
  hasSubscription: boolean;
  active: boolean;
  expiresAt?: string;
  listingsAllowed?: number;
  listingsUsed?: number;
  listingsRemaining?: number;
}
interface PhotoItem { file: File; previewUrl: string; uploadedUrl: string | null; uploading: boolean }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-coffee-muted uppercase tracking-wide mb-2">{label}</div>
      {children}
    </div>
  );
}

const selectClass = 'w-full bg-coffee-surface border-2 border-coffee-line rounded-xl px-4 py-3 text-sm font-semibold text-coffee-dark outline-none focus:border-coffee-blue';
const inputClass = 'w-full bg-coffee-surface border-2 border-coffee-line rounded-xl px-4 py-3 text-sm text-coffee-dark outline-none focus:border-coffee-blue';

export default function AddListingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [brandCategoryIds, setBrandCategoryIds] = useState<Record<string, Set<string>>>({});
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [customModel, setCustomModel] = useState(false);
  const [condition, setCondition] = useState('used');
  const [groups, setGroups] = useState('2');
  const [year, setYear] = useState('');
  const [priceUah, setPriceUah] = useState('');
  const [safePayment, setSafePayment] = useState(false);
  const [safePaymentInfoOpen, setSafePaymentInfoOpen] = useState(false);
  const [city, setCity] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<'idle' | 'opening' | 'waiting' | 'creating'>('idle');
  const [availableGateways, setAvailableGateways] = useState<string[] | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [listingFeeUah, setListingFeeUah] = useState(460);
  const [extraListingFeeUah, setExtraListingFeeUah] = useState(55);
  const [commissionPercent, setCommissionPercent] = useState(7);
  const [subStatus, setSubStatus] = useState<SubStatus | null>(null);

  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [needsContactInfo, setNeedsContactInfo] = useState(false);
  const [contactLoaded, setContactLoaded] = useState(false);

  const { models } = useModels(brand || null);
  const { cities } = useCities();
  const { rate: uahRate } = useExchangeRate();

  const selectedCategory = categories.find((c) => c.id === category);
  const visibleBrands = brands.filter((b) => {
    const tagged = brandCategoryIds[b.id];
    return !tagged || tagged.size === 0 || (category && tagged.has(category));
  });

  useEffect(() => {
    (async () => {
      const [{ data: gw }, { data: sub }] = await Promise.all([
        supabase.functions.invoke('payment-gateways'),
        supabase.functions.invoke('get-subscription-status'),
      ]);
      const gateways: string[] = gw?.gateways ?? [];
      setAvailableGateways(gateways);
      setSelectedGateway(gateways[0] ?? null);
      if (gw?.listing_fee_uah) setListingFeeUah(Number(gw.listing_fee_uah));
      if (gw?.extra_listing_fee_uah) setExtraListingFeeUah(Number(gw.extra_listing_fee_uah));
      if (gw?.marketplace_commission_percent != null) setCommissionPercent(Number(gw.marketplace_commission_percent));
      if (sub && !sub.error) setSubStatus(sub);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: categoriesData }, { data: brandsData }, { data: linksData }] = await Promise.all([
        supabase.from('categories').select('id, name, slug, emoji').order('name'),
        supabase.from('brands').select('id, name, slug').order('name'),
        supabase.from('brand_categories').select('brand_id, category_id'),
      ]);
      setCategories(categoriesData ?? []);
      setBrands(brandsData ?? []);
      setCategory((prev) => prev || categoriesData?.[0]?.id || '');

      const map: Record<string, Set<string>> = {};
      for (const row of linksData ?? []) {
        if (!map[row.brand_id]) map[row.brand_id] = new Set();
        map[row.brand_id].add(row.category_id);
      }
      setBrandCategoryIds(map);
    })();
  }, []);

  useEffect(() => {
    if (brand && !visibleBrands.some((b) => b.id === brand)) setBrand('');
  }, [category]);

  useEffect(() => {
    setModel('');
    setCustomModel(false);
  }, [brand]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle();
      const hasName = !!data?.full_name?.trim();
      const hasPhone = !!data?.phone?.trim();
      setNeedsContactInfo(!hasName || !hasPhone);
      setContactName(hasName ? data!.full_name : '');
      setContactPhone(hasPhone ? data!.phone : '');
      setContactLoaded(true);
    })();
  }, [user?.id]);

  const priceNum = Number(priceUah.replace(/\D/g, '')) || 0;
  const commissionAmount = Math.round(priceNum * (commissionPercent / 100));
  const netAmount = priceNum - commissionAmount;
  const subHasSlots = !!subStatus?.active && (subStatus.listingsRemaining ?? 0) > 0;
  const paymentAmount = subHasSlots ? 0 : subStatus?.active ? extraListingFeeUah : listingFeeUah;
  const uploadingAny = photos.some((p) => p.uploading);

  function handleFilesSelected(files: FileList | null) {
    if (!files || !user) return;
    const remaining = 8 - photos.length;
    const toAdd = Array.from(files).slice(0, remaining);

    toAdd.forEach(async (file) => {
      const previewUrl = URL.createObjectURL(file);
      const item: PhotoItem = { file, previewUrl, uploadedUrl: null, uploading: true };
      setPhotos((prev) => [...prev, item]);

      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from('listings').upload(fileName, file, { contentType: file.type, upsert: false });

      if (error) {
        setPhotos((prev) => prev.filter((p) => p !== item));
        alert(`Не вдалося завантажити фото: ${error.message}`);
        return;
      }
      const { data: urlData } = supabase.storage.from('listings').getPublicUrl(fileName);
      setPhotos((prev) => prev.map((p) => (p === item ? { ...p, uploading: false, uploadedUrl: urlData.publicUrl } : p)));
    });
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handlePublish() {
    if (!brand) return alert('Оберіть бренд');
    if (!model) return alert('Введіть модель');
    if (!priceUah) return alert('Введіть ціну');
    if (!city) return alert('Оберіть місто');
    if (!user) return alert('Увійдіть в акаунт');
    if (uploadingAny) return alert('Зачекайте, фото ще завантажується');
    if (needsContactInfo && (!contactName.trim() || !contactPhone.trim())) {
      return alert("Заповніть ім'я та телефон, щоб покупці могли з вами зв'язатись");
    }
    if (paymentAmount > 0 && !selectedGateway) {
      return alert('Наразі жоден спосіб оплати не увімкнений. Спробуйте пізніше.');
    }

    const listingDraft = {
      title: `${brands.find((b) => b.id === brand)?.name} ${model}`,
      brand_id: brand,
      category_id: category,
      price_usd: uahRate ? Math.round((priceNum / uahRate) * 100) / 100 : priceNum,
      price_uah: priceNum,
      condition,
      groups: selectedCategory?.slug === 'machines' ? Number(groups) : null,
      year: year && year !== YEAR_UNKNOWN ? Number(year) : null,
      city: city.trim(),
      description: description.trim(),
      photos: photos.map((p) => p.uploadedUrl).filter(Boolean),
      safe_payment_enabled: safePayment,
    };

    try {
      setLoading(true);
      setStage('opening');

      if (needsContactInfo) {
        await supabase.from('profiles').upsert({ id: user.id, full_name: contactName.trim(), phone: contactPhone.trim() });
      }

      const { data: payment, error: paymentError } = await supabase.functions.invoke('create-listing-payment', {
        body: { listing_draft: listingDraft, gateway: selectedGateway },
      });
      if (paymentError || !payment || payment.error) {
        throw new Error(await getFunctionErrorMessage(paymentError, payment, 'Не вдалося створити рахунок на оплату'));
      }

      if (payment.free) {
        alert("Оголошення подано! ☕ Воно на модерації і з'явиться на маркетплейсі після перевірки.");
        navigate('/profile');
        return;
      }

      window.open(payment.payment_url, '_blank', 'noopener,noreferrer');

      setStage('waiting');
      let status: string | null = null;
      for (let attempt = 0; attempt < PAYMENT_POLL_MAX_ATTEMPTS; attempt++) {
        const { data: check } = await supabase.functions.invoke('check-listing-payment-status', {
          body: { order_reference: payment.order_reference },
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
        alert(
          'Оплата обробляється трохи довше — якщо вже оплатили, оголошення з\'явиться автоматично протягом кількох хвилин.',
        );
        return;
      }

      setStage('creating');
      const { data: listing, error: createError } = await supabase.functions.invoke('create-listing', {
        body: { order_reference: payment.order_reference },
      });
      if (createError || !listing || listing.error) {
        throw new Error(await getFunctionErrorMessage(createError, listing, 'Оплата пройшла, але не вдалося створити оголошення. Зверніться у підтримку.'));
      }

      alert("Оголошення подано! ☕ Воно на модерації і з'явиться на маркетплейсі після перевірки.");
      navigate('/profile');
    } catch (e: any) {
      alert(e.message ?? 'Сталася помилка');
    } finally {
      setLoading(false);
      setStage('idle');
    }
  }

  const subBanner = (() => {
    if (!subStatus) return null;
    if (!subStatus.hasSubscription) {
      return { text: `Це буде ваше перше оголошення. Підписка на 5 оголошень / 30 днів коштує ${listingFeeUah} ₴.`, className: 'bg-coffee-blue-light text-coffee-blue-dark' };
    }
    if (subStatus.active && (subStatus.listingsRemaining ?? 0) > 0) {
      return { text: `Активна підписка: залишилось ${subStatus.listingsRemaining} з ${subStatus.listingsAllowed} оголошень, діє до ${formatDate(subStatus.expiresAt!)}.`, className: 'bg-coffee-green-light text-coffee-green' };
    }
    if (subStatus.active) {
      return { text: `Ви використали всі оголошення підписки (діє до ${formatDate(subStatus.expiresAt!)}). Це оголошення коштуватиме ${extraListingFeeUah} ₴ окремо.`, className: 'bg-coffee-amber-light text-coffee-amber' };
    }
    return { text: `Ваша підписка закінчилась ${formatDate(subStatus.expiresAt!)}. Потрібна нова — ${listingFeeUah} ₴ (5 оголошень / 30 днів).`, className: 'bg-coffee-red-light text-coffee-red' };
  })();

  return (
    <div className="max-w-2xl mx-auto pb-16">
      <h1 className="text-2xl font-extrabold text-coffee-dark tracking-tight mb-1">Нове оголошення</h1>
      <p className="text-coffee-muted text-sm mb-5">Розмістіть обладнання на маркетплейсі Coffee One</p>

      {subBanner && <div className={`rounded-xl px-4 py-3 text-sm font-semibold mb-5 ${subBanner.className}`}>{subBanner.text}</div>}

      <div className="flex flex-col gap-5">
        <Field label={`Фото (${photos.length}/8)`}>
          <div className="flex flex-wrap gap-2.5">
            {photos.map((p, i) => (
              <div key={p.previewUrl} className="relative w-24 h-24 rounded-xl overflow-hidden bg-coffee-blue-light">
                <img src={p.previewUrl} className="w-full h-full object-cover" alt="" />
                {p.uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs">…</div>}
                <button onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white text-xs flex items-center justify-center">✕</button>
              </div>
            ))}
            {photos.length < 8 && (
              <label className="w-24 h-24 rounded-xl border-2 border-dashed border-coffee-line bg-coffee-surface flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-coffee-blue transition-colors">
                <span className="text-2xl text-coffee-blue leading-none">+</span>
                <span className="text-[11px] font-semibold text-coffee-blue">Фото</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFilesSelected(e.target.files)} />
              </label>
            )}
          </div>
        </Field>

        <Field label="Категорія">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${category === c.id ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'}`}
              >
                {c.emoji} {c.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Бренд">
          <div className="flex flex-wrap gap-1.5">
            {visibleBrands.map((b) => (
              <button
                key={b.id}
                onClick={() => setBrand(b.id)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${brand === b.id ? 'bg-coffee-dark text-white border-coffee-dark' : 'bg-coffee-chip text-coffee-dark border-coffee-line hover:border-coffee-blue'}`}
              >
                {b.name}
              </button>
            ))}
            {visibleBrands.length === 0 && <span className="text-xs text-coffee-muted">Для цієї категорії ще немає прив'язаних брендів</span>}
          </div>
        </Field>

        <Field label="Модель">
          {models.length > 0 && !customModel ? (
            <>
              <select value={model} onChange={(e) => setModel(e.target.value)} className={selectClass}>
                <option value="">Оберіть модель</option>
                {models.map((m) => (
                  <option key={m.id} value={m.name}>{m.name}</option>
                ))}
              </select>
              <button onClick={() => { setCustomModel(true); setModel(''); }} className="text-xs font-semibold text-coffee-blue mt-2">
                Немає в списку — вписати вручну
              </button>
            </>
          ) : (
            <>
              <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Напр. Linea PB" className={inputClass} />
              {models.length > 0 && (
                <button onClick={() => setCustomModel(false)} className="text-xs font-semibold text-coffee-blue mt-2">← Обрати зі списку</button>
              )}
            </>
          )}
        </Field>

        <Field label="Стан">
          <div className="grid grid-cols-3 gap-1.5 bg-coffee-surface border-2 border-coffee-line rounded-xl p-1">
            {CONDITIONS.map((c) => (
              <button
                key={c.value}
                onClick={() => setCondition(c.value)}
                className={`text-xs font-semibold py-2 rounded-lg ${condition === c.value ? 'bg-coffee-blue text-white' : 'text-coffee-muted hover:text-coffee-dark'}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </Field>

        {selectedCategory?.slug === 'machines' && (
          <Field label="Кількість груп">
            <div className="grid grid-cols-3 gap-1.5 bg-coffee-surface border-2 border-coffee-line rounded-xl p-1">
              {GROUPS.map((g) => (
                <button key={g} onClick={() => setGroups(g)} className={`text-xs font-semibold py-2 rounded-lg ${groups === g ? 'bg-coffee-blue text-white' : 'text-coffee-muted hover:text-coffee-dark'}`}>
                  {g}
                </button>
              ))}
            </div>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Рік випуску">
            <select value={year} onChange={(e) => setYear(e.target.value)} className={selectClass}>
              <option value="">Оберіть рік</option>
              <option value={YEAR_UNKNOWN}>Не визначено</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Ціна, ₴">
            <input
              value={priceUah}
              onChange={(e) => setPriceUah(e.target.value.replace(/\D/g, ''))}
              placeholder="350 000"
              inputMode="numeric"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="bg-coffee-chip rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-coffee-dark">Безпечна оплата</span>
            <button
              onClick={() => setSafePayment((v) => !v)}
              className={`relative w-11 h-6 rounded-full transition-colors ${safePayment ? 'bg-coffee-blue' : 'bg-coffee-line'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${safePayment ? 'translate-x-5' : ''}`} />
            </button>
          </div>
          <p className="text-xs text-coffee-muted font-semibold mt-2 leading-relaxed">
            Комісія маркетплейсу {commissionPercent}% стягується тільки якщо скористаєтесь функцією «Безпечна оплата». За домовленості напряму з покупцем комісії немає.
          </p>
          <button onClick={() => setSafePaymentInfoOpen(true)} className="text-xs font-semibold text-coffee-blue mt-1.5">
            Що це таке? →
          </button>
          {safePayment && priceNum > 0 && (
            <p className="text-sm font-extrabold text-coffee-dark mt-2.5">
              З «Безпечною оплатою»: {netAmount.toLocaleString('uk-UA')} ₴ на руки (комісія {commissionAmount.toLocaleString('uk-UA')} ₴)
            </p>
          )}
        </div>

        <Field label="Місто">
          <select value={city} onChange={(e) => setCity(e.target.value)} className={selectClass}>
            <option value="">Оберіть місто</option>
            {cities.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Опис">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Стан, ТО, комплектація, доставка…"
            rows={4}
            className={`${inputClass} resize-none`}
          />
        </Field>

        {contactLoaded && needsContactInfo && (
          <div className="bg-coffee-surface rounded-xl p-4 border-2 border-coffee-line">
            <div className="font-extrabold text-coffee-dark mb-1">Контактні дані</div>
            <p className="text-xs text-coffee-muted mb-3">Покупці бачитимуть ці дані, щоб зв'язатись з вами. Збережемо в профіль — наступного разу вписувати не треба.</p>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Ім'я" className={`${inputClass} mb-2`} />
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+380 67 000 00 00" className={inputClass} />
          </div>
        )}

        {paymentAmount > 0 && availableGateways != null && availableGateways.length > 1 && (
          <Field label="Спосіб оплати">
            <div className="grid gap-1.5 bg-coffee-surface border-2 border-coffee-line rounded-xl p-1" style={{ gridTemplateColumns: `repeat(${availableGateways.length}, 1fr)` }}>
              {availableGateways.map((gw) => (
                <button key={gw} onClick={() => setSelectedGateway(gw)} className={`text-sm font-semibold py-2 rounded-lg ${selectedGateway === gw ? 'bg-coffee-blue text-white' : 'text-coffee-muted hover:text-coffee-dark'}`}>
                  {GATEWAY_LABEL[gw] ?? gw}
                </button>
              ))}
            </div>
          </Field>
        )}
        {paymentAmount > 0 && availableGateways != null && availableGateways.length === 0 && (
          <p className="text-sm text-coffee-red text-center font-semibold">Наразі оплата тимчасово недоступна — жоден спосіб оплати не увімкнений.</p>
        )}

        <button
          onClick={handlePublish}
          disabled={loading || (paymentAmount > 0 && !selectedGateway)}
          className="bg-coffee-blue text-white font-bold rounded-xl py-4 hover:bg-coffee-blue-dark transition-colors disabled:opacity-60"
        >
          {loading
            ? { opening: 'Секунду…', waiting: 'Очікуємо підтвердження оплати…', creating: 'Публікуємо…', idle: '' }[stage]
            : paymentAmount > 0
              ? `Оплатити ${paymentAmount} ₴ і опублікувати`
              : 'Опублікувати безкоштовно'}
        </button>
        <p className="text-center text-xs text-coffee-muted -mt-2">
          {paymentAmount > 0 ? "Після оплати оголошення пройде модерацію і з'явиться на маркетплейсі." : "Це оголошення входить у вашу активну підписку. Після публікації воно пройде модерацію."}
        </p>
      </div>

      {safePaymentInfoOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSafePaymentInfoOpen(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="font-extrabold text-coffee-dark text-lg mb-3">Безпечна оплата</div>
            <p className="text-sm text-coffee-dark leading-relaxed whitespace-pre-line">{SAFE_PAYMENT_EXPLANATION}</p>
            <button onClick={() => setSafePaymentInfoOpen(false)} className="w-full bg-coffee-blue text-white font-bold rounded-xl py-3 mt-5">
              Готово
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
