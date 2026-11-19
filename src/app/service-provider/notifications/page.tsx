'use client';

import { Bell } from 'lucide-react';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { FeaturePlaceholder } from '@/components/PageStates';

export default function ProviderNotificationsPage() {
  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Notifications</h1>
          <p className="text-xs sm:text-sm text-slate-700 truncate">Alerts and updates</p>
        </>
      }
    >
      <FeaturePlaceholder
        icon={<Bell className="h-7 w-7" />}
        title="Notifications is coming soon"
        description="This section will collect alerts about your assignments, documents and contract. There is no provider-portal notifications endpoint yet, so this page is a placeholder — it does not show sample data or an unread count."
        points={[
          'Assignment and document alerts will appear here once enabled.',
          'Account-status notices are shown at the top of the Dashboard today.',
        ]}
        links={[{ href: '/service-provider/dashboard', label: 'Go to Dashboard' }]}
      />
    </ProviderPortalLayout>
  );
}
