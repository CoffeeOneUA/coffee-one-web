import { useState, useEffect } from 'react';
import { supabase, type Brand } from '../lib/supabase';

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('brands')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setBrands(data ?? []);
        setLoading(false);
      });
  }, []);

  return { brands, loading };
}
