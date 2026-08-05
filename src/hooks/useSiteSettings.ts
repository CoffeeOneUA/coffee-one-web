import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  site_name: string;
  logo_url: string | null;
}

const DEFAULTS: SiteSettings = { site_name: 'Coffee One', logo_url: null };

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('site_name, logo_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSettings({ site_name: data.site_name || DEFAULTS.site_name, logo_url: data.logo_url });
      });
  }, []);

  return settings;
}
