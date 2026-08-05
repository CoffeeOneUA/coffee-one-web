import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  hero_title: string;
  hero_subtitle: string;
  footer_text: string;
  meta_title: string;
  meta_description: string;
  og_image_url: string | null;
}

const DEFAULTS: SiteSettings = {
  site_name: 'Coffee One',
  logo_url: null,
  favicon_url: null,
  hero_title: 'Маркетплейс',
  hero_subtitle: 'Кавове обладнання від перевірених продавців по всій Україні',
  footer_text: 'Coffee One — перший маркетплейс кавового обладнання',
  meta_title: 'Coffee One — маркетплейс кавового обладнання',
  meta_description: 'Купуйте та продавайте кавові машини, кавомолки та аксесуари від перевірених продавців по всій Україні.',
  og_image_url: null,
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);

  useEffect(() => {
    supabase
      .from('site_settings')
      .select('site_name, logo_url, favicon_url, hero_title, hero_subtitle, footer_text, meta_title, meta_description, og_image_url')
      .eq('id', 1)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setSettings({
          site_name: data.site_name || DEFAULTS.site_name,
          logo_url: data.logo_url,
          favicon_url: data.favicon_url,
          hero_title: data.hero_title || DEFAULTS.hero_title,
          hero_subtitle: data.hero_subtitle || DEFAULTS.hero_subtitle,
          footer_text: data.footer_text || DEFAULTS.footer_text,
          meta_title: data.meta_title || DEFAULTS.meta_title,
          meta_description: data.meta_description || DEFAULTS.meta_description,
          og_image_url: data.og_image_url,
        });
      });
  }, []);

  return settings;
}
