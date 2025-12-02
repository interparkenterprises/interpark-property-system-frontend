'use client';

import { useAuth } from '@/context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          {/* Added left padding for mobile to prevent hamburger menu overlap */}
          <div className="container mx-auto px-6 py-8 md:pl-6 pl-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}