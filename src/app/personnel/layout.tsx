'use client';

import { PersonnelAuthProvider } from '@/context/PersonnelAuthContext';

export default function PersonnelLayout({ children }: { children: React.ReactNode }) {
  return <PersonnelAuthProvider>{children}</PersonnelAuthProvider>;
}
