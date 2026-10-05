import type { UserRole } from '@/lib/types';
import { getSession } from './session';

export interface PortalIdentity {
  role: UserRole | null;
  name: string;
  email: string;
  rollNumber: number | null;
}

export async function getPortalIdentity(): Promise<PortalIdentity> {
  const session = await getSession();
  const role: UserRole | null = session?.role ?? null;
  return {
    role,
    name: session?.name || '',
    email: session?.email || '',
    rollNumber: session?.rollNumber ?? null,
  };
}
