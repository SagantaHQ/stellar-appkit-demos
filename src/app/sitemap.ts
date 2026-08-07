import type { MetadataRoute } from 'next';
import { demos } from '@/demos/registry';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://demos.stellar-appkit.saganta.com';
  const now = new Date();

  const routes = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 1,
    },
  ];

  for (const demo of demos) {
    routes.push({
      url: `${baseUrl}/demos/${demo.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    });
  }

  return routes;
}
