import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.TAMV_SITE_URL || process.env.APP_BASE_URL || 'https://tamv.online').replace(/\/+$/, '');
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/cuenta', '/registro', '/resolver', '/scripts/'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
