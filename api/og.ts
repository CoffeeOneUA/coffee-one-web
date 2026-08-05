// Serverless-функція (Vercel Edge Function), яку vercel.json підставляє
// замість index.html для всіх безкрапкових SPA-маршрутів (rewrite, не
// redirect — адреса в браузері не міняється). Підставляє реальні
// SEO/OG-теги в HTML ДО того, як він піде клієнту — на відміну від
// Layout.tsx, який робить те саме через document.title/meta вже ПІСЛЯ
// завантаження React. Боти прев'ю посилань (Facebook/Telegram/Twitter)
// JS не виконують і бачать лише те, що прийшло тут.
//
// Важливо: файл index.html фетчиться напряму за шляхом /index.html
// (реальний статичний файл, без крапки в маршруті йому не загрожує
// потрапити під той самий SPA-rewrite) — інакше був би нескінченний цикл.

export const config = { runtime: 'edge' };

interface SiteSettings {
  site_name: string;
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  favicon_url: string | null;
}

interface ListingPreview {
  title: string;
  city: string;
  price_uah: number;
  photos: string[] | null;
}

const FALLBACK_FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%E2%98%95%3C/text%3E%3C/svg%3E";

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function fetchJson<T>(url: string, anonKey: string): Promise<T | null> {
  try {
    const res = await fetch(url, { headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? (data[0] ?? null) : data;
  } catch {
    return null;
  }
}

export default async function handler(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const supabaseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  const htmlRes = await fetch(`${url.origin}/index.html`);
  let html = await htmlRes.text();

  if (!supabaseUrl || !anonKey) {
    // Змінні середовища не налаштовані на Vercel — віддаємо шаблон із
    // безпечними значеннями за замовчуванням замість "сирих" токенів.
    html = fillTemplate(html, {
      title: 'Coffee One',
      description: 'Маркетплейс кавового обладнання',
      siteName: 'Coffee One',
      image: '',
      favicon: FALLBACK_FAVICON,
      ogType: 'website',
      url: request.url,
    });
    return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
  }

  const listingMatch = url.pathname.match(/^\/listing\/([^/]+)/);

  const [settings, listing] = await Promise.all([
    fetchJson<SiteSettings>(
      `${supabaseUrl}/rest/v1/site_settings?id=eq.1&select=site_name,meta_title,meta_description,og_image_url,favicon_url`,
      anonKey,
    ),
    listingMatch
      ? fetchJson<ListingPreview>(
          `${supabaseUrl}/rest/v1/listings?id=eq.${listingMatch[1]}&select=title,city,price_uah,photos`,
          anonKey,
        )
      : Promise.resolve(null),
  ]);

  const siteName = settings?.site_name || 'Coffee One';
  const title = listing
    ? `${listing.title} — ${siteName}`
    : settings?.meta_title || `${siteName} — маркетплейс кавового обладнання`;
  const description = listing
    ? `${Number(listing.price_uah).toLocaleString('uk-UA')} ₴ · ${listing.city} — дивіться на ${siteName}`
    : settings?.meta_description || 'Купуйте та продавайте кавове обладнання від перевірених продавців по всій Україні.';
  const image = listing?.photos?.[0] || settings?.og_image_url || '';

  html = fillTemplate(html, {
    title,
    description,
    siteName,
    image,
    favicon: settings?.favicon_url || FALLBACK_FAVICON,
    ogType: listing ? 'product' : 'website',
    url: request.url,
  });

  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

function fillTemplate(
  html: string,
  data: { title: string; description: string; siteName: string; image: string; favicon: string; ogType: string; url: string },
): string {
  return html
    .replace(/__TITLE__/g, escapeHtml(data.title))
    .replace(/__DESCRIPTION__/g, escapeHtml(data.description))
    .replace(/__SITE_NAME__/g, escapeHtml(data.siteName))
    .replace(/__OG_IMAGE__/g, escapeHtml(data.image))
    .replace(/__FAVICON_URL__/g, escapeHtml(data.favicon))
    .replace(/__OG_TYPE__/g, data.ogType)
    .replace(/__OG_URL__/g, escapeHtml(data.url))
    .replace(/__TWITTER_CARD__/g, data.image ? 'summary_large_image' : 'summary');
}
