import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Job Applications' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
