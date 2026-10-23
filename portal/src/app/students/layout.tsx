import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Registered Students' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
