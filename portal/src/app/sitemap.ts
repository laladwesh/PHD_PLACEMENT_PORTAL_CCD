import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/siteConfig';

// Only the public pages are listed; everything else sits behind sign-in.
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: siteUrl('/auth'), lastModified, changeFrequency: 'monthly', priority: 1 },
    { url: siteUrl('/auth/register'), lastModified, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
