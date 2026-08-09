import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { StarRating } from '../components/StarRating';

interface Profile {
  full_name: string | null;
  phone: string | null;
  city: string | null;
  avatar_url: string | null;
  rating: number | null;
  reviews_count: number | null;
}

interface MyListing {
  id: string;
  title: string;
  price_uah: number;
  status: string;
  sold_reason: string | null;
  created_at: string;
}

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  approved: { label: 'Активне', className: 'bg-coffee-green-light text-coffee-green' },
  pending: { label: 'На модерації', className: 'bg-coffee-amber-light text-coffee-amber' },
  rejected: { label: 'Відхилено', className: 'bg-coffee-red-light text-coffee-red' },
  sold: { label: 'Продано', className: 'bg-coffee-chip text-coffee-muted' },
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [listings, setListings] = useState<MyListing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: l }] = await Promise.all([
        supabase.from('profiles').select('full_name, phone, city, avatar_url, rating, reviews_count').eq('id', user.id).maybeSingle(),
        supabase.from('listings').select('id, title, price_uah, status, sold_reason, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
      ]);
      setProfile(p);
      setListings(l ?? []);
      setLoading(false);
    })();
  }, [user?.id]);

  async function markSold(id: string, reason: 'marketplace' | 'other') {
    const { error } = await supabase.from('listings').update({ status: 'sold', sold_reason: reason }).eq('id', id);
    if (!error) setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status: 'sold', sold_reason: reason } : l)));
  }

  if (loading) return <div className="text-center py-16 text-coffee-muted">Завантаження…</div>;

  const total = listings.length;
  const activeCount = listings.filter((l) => l.status === 'approved').length;
  const pendingCount = listings.filter((l) => l.status === 'pending').length;
  const soldCount = listings.filter((l) => l.status === 'sold').length;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-coffee-surface rounded-2xl p-6 flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-coffee-blue text-white flex items-center justify-center font-extrabold text-2xl shrink-0 overflow-hidden">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? 'U'
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-coffee-dark text-lg">{profile?.full_name || 'Користувач'}</div>
          <div className="text-coffee-muted text-sm">{user?.email}</div>
          <div className="mt-1"><StarRating rating={profile?.rating} reviewsCount={profile?.reviews_count} size="lg" /></div>
        </div>
        <button onClick={() => signOut()} className="text-coffee-red font-bold text-sm shrink-0">
          Вийти
        </button>
      </div>

      <div className="bg-coffee-surface rounded-2xl p-4 flex items-stretch justify-between mb-6">
        <div className="flex-1 text-center">
          <div className="text-xl font-extrabold text-coffee-dark">{total}</div>
          <div className="text-[11px] text-coffee-muted font-semibold mt-0.5">Оголошень</div>
        </div>
        <div className="w-px bg-coffee-line" />
        <div className="flex-1 text-center">
          <div className="text-xl font-extrabold text-coffee-green">{activeCount}</div>
          <div className="text-[11px] text-coffee-muted font-semibold mt-0.5">Активних</div>
        </div>
        <div className="w-px bg-coffee-line" />
        <div className="flex-1 text-center">
          <div className="text-xl font-extrabold text-coffee-amber">{pendingCount}</div>
          <div className="text-[11px] text-coffee-muted font-semibold mt-0.5">На модерації</div>
        </div>
        <div className="w-px bg-coffee-line" />
        <div className="flex-1 text-center">
          <div className="text-xl font-extrabold text-coffee-muted">{soldCount}</div>
          <div className="text-[11px] text-coffee-muted font-semibold mt-0.5">Продано</div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="font-extrabold text-coffee-dark">Мої оголошення</div>
        <Link to="/add-listing" className="text-coffee-blue font-bold text-sm">
          + Додати оголошення
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="bg-coffee-surface rounded-2xl p-10 text-center text-coffee-muted text-sm">
          У вас ще немає оголошень на маркетплейсі
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((l) => {
            const status = STATUS_LABEL[l.status] ?? { label: l.status, className: 'bg-coffee-chip text-coffee-muted' };
            return (
              <div key={l.id} className="bg-coffee-surface rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/listing/${l.id}`} className="font-bold text-coffee-dark hover:text-coffee-blue">
                    {l.title}
                  </Link>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${status.className}`}>{status.label}</span>
                </div>
                <div className="text-coffee-dark font-extrabold mt-1">{Number(l.price_uah).toLocaleString('uk-UA')} ₴</div>
                {l.status !== 'sold' && (
                  <div className="flex gap-2 mt-3">
                    <Link to={`/add-listing/${l.id}`} className="flex-1 text-center bg-coffee-blue-light text-coffee-blue-dark text-xs font-semibold rounded-lg py-2">
                      ✏️ Редагувати
                    </Link>
                    <button onClick={() => markSold(l.id, 'marketplace')} className="flex-1 bg-coffee-chip text-coffee-dark text-xs font-semibold rounded-lg py-2">
                      Продано на маркетплейсі
                    </button>
                    <button onClick={() => markSold(l.id, 'other')} className="flex-1 bg-coffee-chip text-coffee-dark text-xs font-semibold rounded-lg py-2">
                      Продано деінде
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
