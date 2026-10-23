import type { MetadataRoute } from 'next';
import { BASE_PATH, siteUrl } from '@/lib/siteConfig';

// Search engines only read robots.txt from the root of a host, so this file is served at
// <site>/phdplacement/robots.txt. It documents the intended rules; the same rules can be copied into
// the root robots.txt of the host. The pages themselves also carry noindex tags, which is what
// actually keeps the private pages out of search results.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [`${BASE_PATH}/auth`, `${BASE_PATH}/auth/register`, `${BASE_PATH}/logo.jpeg`],
        disallow: [`${BASE_PATH}/`],
      },
    ],
    sitemap: siteUrl('/sitemap.xml'),
  };
}
