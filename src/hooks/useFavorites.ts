import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export function useFavorites() {
  const { user, isAuthenticated } = useAuth();
  const [listingIds, setListingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setListingIds(new Set());
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase.from('favorites').select('listing_id').eq('user_id', user.id);
    setListingIds(new Set((data ?? []).map((f) => f.listing_id).filter(Boolean)));
    setLoading(false);
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  async function toggleListingFavorite(listingId: string) {
    if (!user) return;
    const isFav = listingIds.has(listingId);
    setListingIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(listingId) : next.add(listingId);
      return next;
    });
    if (isFav) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('listing_id', listingId);
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, listing_id: listingId });
    }
  }

  return { listingIds, loading, toggleListingFavorite, refetch: fetchFavorites };
}
