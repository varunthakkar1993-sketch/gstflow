import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/editor', '/quote-editor', '/expenses', '/clients', '/profile', '/templates', '/quotes'],
    },
    sitemap: 'https://paavti.com/sitemap.xml',
  };
}
