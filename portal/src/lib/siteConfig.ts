// Branding and SEO constants shared by the page metadata, robots.txt and the sitemap.
export const SITE_NAME = 'PHD Career Portal';
export const ORG_NAME = 'Centre for Career Development, IIT Guwahati';
export const BASE_PATH = '/phdplacement';

export const SITE_DESCRIPTION =
  'The PHD Career Portal of the Centre for Career Development (CCD), IIT Guwahati. PhD scholars register and apply for roles, ' +
  'recruiters post job application forms (JAFs) and meet PhD talent, and the placement team runs PhD placements and internships.';

export const SITE_KEYWORDS = [
  'PHD Career Portal',
  'IIT Guwahati PhD placement',
  'PhD recruitment',
  'hire PhD scholars',
  'IIT Guwahati recruiters',
  'campus recruitment IIT Guwahati',
  'job application form JAF',
  'Centre for Career Development IIT Guwahati',
  'PhD internships',
  'research scientist hiring',
];

// Image used for link previews (public/logo.jpeg is 314 x 317).
export const SOCIAL_IMAGE = { path: '/logo.jpeg', width: 314, height: 317, alt: 'IIT Guwahati logo' };

/**
 * Public origin of the site. Set PUBLIC_ORIGIN to override; otherwise the origin of the Azure redirect
 * URI is used, falling back to the institute's address.
 */
export function siteOrigin(): string {
  for (const value of [process.env.PUBLIC_ORIGIN, process.env.AZURE_AD_REDIRECT_URI]) {
    if (!value) continue;
    try {
      return new URL(value).origin;
    } catch {
      // try the next candidate
    }
  }
  return 'https://iitg.ac.in';
}

/** Absolute URL of a page or file in this app (the app lives under BASE_PATH). */
export const siteUrl = (path = '') => `${siteOrigin()}${BASE_PATH}${path}`;

/** Open Graph block for a public page. A page's openGraph replaces the root one, so it is rebuilt in full. */
export function openGraphFor(title: string, description: string, path: string) {
  return {
    type: 'website' as const,
    siteName: SITE_NAME,
    locale: 'en_IN',
    title: `${title} | ${SITE_NAME}`,
    description,
    url: siteUrl(path),
    images: [{ url: siteUrl(SOCIAL_IMAGE.path), width: SOCIAL_IMAGE.width, height: SOCIAL_IMAGE.height, alt: SOCIAL_IMAGE.alt }],
  };
}
