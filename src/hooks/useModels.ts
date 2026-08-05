import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface ModelOption {
  id: string;
  brand_id: string;
  name: string;
}

export function useModels(brandId: string | null) {
  const [models, setModels] = useState<ModelOption[]>([]);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      return;
    }
    supabase
      .from('models')
      .select('id, brand_id, name')
      .eq('brand_id', brandId)
      .order('name')
      .then(({ data }) => setModels(data ?? []));
  }, [brandId]);

  return { models };
}
