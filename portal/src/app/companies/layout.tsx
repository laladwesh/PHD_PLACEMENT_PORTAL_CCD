import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Registered Companies' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
