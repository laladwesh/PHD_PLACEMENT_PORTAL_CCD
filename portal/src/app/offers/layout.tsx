import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Offers' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
