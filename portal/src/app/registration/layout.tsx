import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Student Registration' };

export default function SectionLayout({ children }: { children: React.ReactNode }) {
  return children;
}
