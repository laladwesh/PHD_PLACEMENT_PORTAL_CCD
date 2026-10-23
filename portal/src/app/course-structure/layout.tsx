import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Course Structure' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
