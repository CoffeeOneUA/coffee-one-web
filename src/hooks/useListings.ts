import { useState, useEffect } from 'react';
import { supabase, type Listing } from '../lib/supabase';

// Спеціальне значення міста оголошення/фільтра — "доступно по всій країні".
export const ALL_UKRAINE = 'Вся Україна';

export interface ListingFilters {
  category?: string;
  brand?: string;
  modelId?: string;
  city?: string;
  condition?: string[];
  groups?: string[];
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sort?: 'newest' | 'price_asc' | 'price_desc';
}

// brands!inner / categories!inner — без "!inner" PostgREST не відкидає
// рядки, чий brand_id/category_id не збігається з фільтром, а лише
// занулює вкладений об'єкт (перевірено напряму на цьому проєкті раніше).
export function useListings(filters: ListingFilters) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    let query = supabase
      .from('listings')
      .select('*, brands!inner(name, slug), categories!inner(name, emoji, slug), profiles(full_name, city, rating, reviews_count)')
      .eq('status', 'approved');

    if (filters.category) query = query.eq('categories.slug', filters.category);
    if (filters.brand) query = query.eq('brands.slug', filters.brand);
    if (filters.modelId) query = query.eq('model_id', filters.modelId);
    // "Вся Україна" як фільтр покупця = без обмеження по місту (видно все).
    // Обране конкретне місто — показуємо і локальні оголошення, і ті, що
    // продавець позначив як доступні по всій Україні.
    if (filters.city && filters.city !== ALL_UKRAINE) {
      query = query.or(`city.eq."${filters.city}",city.eq."${ALL_UKRAINE}"`);
    }
    if (filters.condition && filters.condition.length > 0) query = query.in('condition', filters.condition);
    if (filters.groups && filters.groups.length > 0) query = query.in('groups', filters.groups.map(Number));
    if (filters.priceMin != null) query = query.gte('price_uah', filters.priceMin);
    if (filters.priceMax != null) query = query.lte('price_uah', filters.priceMax);
    if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim()}%`);

    if (filters.sort === 'price_asc') query = query.order('price_uah', { ascending: true });
    else if (filters.sort === 'price_desc') query = query.order('price_uah', { ascending: false });
    else query = query.order('is_top', { ascending: false }).order('created_at', { ascending: false });

    query.then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      else setListings(data ?? []);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { listings, loading, error };
}

export function useListing(id: string | undefined) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase
      .from('listings')
      .select('*, brands(name), categories(name, emoji), profiles(full_name, phone, city, rating, reviews_count)')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setListing(data);
        setLoading(false);
        if (data) supabase.rpc('increment_listing_views', { listing_id: id }).then(() => {});
      });
  }, [id]);

  return { listing, loading };
}
