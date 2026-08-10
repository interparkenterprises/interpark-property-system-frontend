'use client';

import { useAuth } from '@/context/AuthContext';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-slate-950">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-slate-950">
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-950">
          <div className="container mx-auto px-4 pb-8 pt-20 sm:px-6 md:px-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
