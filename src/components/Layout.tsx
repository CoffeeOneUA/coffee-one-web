import { useEffect, type ReactNode } from 'react';
import { Header } from './Header';
import { useSiteSettings } from '../hooks/useSiteSettings';

function setMetaTag(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setFavicon(url: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'icon');
    document.head.appendChild(el);
  }
  el.setAttribute('href', url);
}

// SEO/бренд-теги задаються в адмінці ("Сайт") й проставляються тут через JS —
// працює для браузерної вкладки й для Google (виконує JS), але НЕ гарантує
// прев'ю в ботах соцмереж (Facebook/Telegram зазвичай JS не виконують,
// їм потрібні теги вже в початковому HTML — для цього треба SSR/edge-функція).
function useHeadTags() {
  const settings = useSiteSettings();

  useEffect(() => {
    document.title = settings.meta_title || settings.site_name;
    setMetaTag('name', 'description', settings.meta_description);
    setMetaTag('property', 'og:title', settings.meta_title || settings.site_name);
    setMetaTag('property', 'og:description', settings.meta_description);
    setMetaTag('property', 'og:site_name', settings.site_name);
    if (settings.og_image_url) setMetaTag('property', 'og:image', settings.og_image_url);
    if (settings.favicon_url) setFavicon(settings.favicon_url);
  }, [settings]);

  return settings;
}

export function Layout({ children }: { children: ReactNode }) {
  const settings = useHeadTags();

  return (
    <div className="min-h-screen flex flex-col bg-coffee-bg">
      <Header />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6">{children}</main>
      <footer className="text-center text-xs text-coffee-muted py-8">{settings.footer_text}</footer>
    </div>
  );
}
