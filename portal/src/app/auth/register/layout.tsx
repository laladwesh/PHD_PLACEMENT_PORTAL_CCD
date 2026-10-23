import type { Metadata } from 'next';
import { SITE_NAME, SOCIAL_IMAGE, openGraphFor, siteUrl } from '@/lib/siteConfig';

const title = 'Recruiter registration';
const description =
  `Register your company on the ${SITE_NAME} of IIT Guwahati to post job application forms (JAFs), reach PhD scholars and run PhD recruitment drives.`;

export const metadata: Metadata = {
  title: { absolute: `${title} | ${SITE_NAME}` },
  description,
  alternates: { canonical: siteUrl('/auth/register') },
  robots: { index: true, follow: true },
  openGraph: openGraphFor(title, description, '/auth/register'),
  twitter: { card: 'summary', title: `${title} | ${SITE_NAME}`, description, images: [siteUrl(SOCIAL_IMAGE.path)] },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
