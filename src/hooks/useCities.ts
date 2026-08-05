import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface City {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
}

export function useCities() {
  const [cities, setCities] = useState<City[]>([]);

  useEffect(() => {
    supabase
      .from('cities')
      .select('*')
      .order('sort_order')
      .then(({ data }) => setCities(data ?? []));
  }, []);

  return { cities };
}
