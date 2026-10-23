import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { ORG_NAME, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SOCIAL_IMAGE, siteOrigin, siteUrl } from "@/lib/siteConfig";

const DEFAULT_TITLE = `${SITE_NAME} | IIT Guwahati`;

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: SITE_KEYWORDS,
  authors: [{ name: ORG_NAME }],
  creator: ORG_NAME,
  publisher: ORG_NAME,
  category: "education",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_IN",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: siteUrl("/auth"),
    images: [{ url: siteUrl(SOCIAL_IMAGE.path), width: SOCIAL_IMAGE.width, height: SOCIAL_IMAGE.height, alt: SOCIAL_IMAGE.alt }],
  },
  twitter: {
    card: "summary",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [siteUrl(SOCIAL_IMAGE.path)],
  },
  // Everything behind sign-in is private, so it is kept out of search engines. The public pages
  // (sign-in and recruiter registration) switch indexing back on in their own layouts.
  robots: { index: false, follow: false, nocache: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1B2A4A",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
