import type { Metadata } from 'next';
import { ORG_NAME, SITE_DESCRIPTION, SITE_NAME, SOCIAL_IMAGE, openGraphFor, siteOrigin, siteUrl } from '@/lib/siteConfig';

const title = 'Sign in';
const description =
  `Sign in to the ${SITE_NAME} of IIT Guwahati. PhD scholars and placement coordinators sign in with their institute Microsoft account; ` +
  'recruiters sign in with their company account to post job application forms and meet PhD talent.';

// The sign-in page is the public front door of the portal, so it is the one page search engines should index.
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: siteUrl('/auth') },
  robots: { index: true, follow: true },
  openGraph: openGraphFor(title, description, '/auth'),
  twitter: { card: 'summary', title: `${title} | ${SITE_NAME}`, description, images: [siteUrl(SOCIAL_IMAGE.path)] },
};

// Structured data so search engines understand what this site is and who runs it.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl('/auth')}#website`,
      name: SITE_NAME,
      url: siteUrl('/auth'),
      description: SITE_DESCRIPTION,
      inLanguage: 'en-IN',
      publisher: { '@id': `${siteOrigin()}/#ccd` },
    },
    {
      '@type': 'Organization',
      '@id': `${siteOrigin()}/#ccd`,
      name: ORG_NAME,
      url: `${siteOrigin()}/`,
      logo: siteUrl(SOCIAL_IMAGE.path),
      parentOrganization: { '@type': 'CollegeOrUniversity', name: 'Indian Institute of Technology Guwahati', url: `${siteOrigin()}/` },
    },
  ],
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        // JSON.stringify output with "<" escaped cannot break out of the script tag.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
      />
      {children}
    </>
  );
}
