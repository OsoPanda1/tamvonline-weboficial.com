import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.TAMV_SITE_URL || process.env.APP_BASE_URL || 'https://tamv.online').replace(/\/+$/, '');
  const updated = new Date('2026-10-27T00:00:00.000Z');
  return [
    { url: base, lastModified: updated, changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/catalogo`, lastModified: updated, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/recursos`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/membresia`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/politica-editorial`, lastModified: updated, changeFrequency: 'yearly', priority: 0.7 },
    { url: `${base}/contribuir`, lastModified: updated, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/terminos`, lastModified: updated, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/privacidad`, lastModified: updated, changeFrequency: 'yearly', priority: 0.4 },
    { url: `${base}/auditoria`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/investigacion`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/miembros`, lastModified: updated, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/vetra`, lastModified: updated, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/roadmap`, lastModified: updated, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/hcu`, lastModified: updated, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/miembros`, lastModified: updated, changeFrequency: 'weekly', priority: 0.8 },
  ];
}
