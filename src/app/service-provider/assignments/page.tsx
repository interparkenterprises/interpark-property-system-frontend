'use client';

import { ClipboardList } from 'lucide-react';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { FeaturePlaceholder } from '@/components/PageStates';

export default function ProviderServicesPage() {
  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Services</h1>
          <p className="text-xs sm:text-sm text-slate-700 truncate">
            Work assignments allocated to you
          </p>
        </>
      }
    >
      <FeaturePlaceholder
        icon={<ClipboardList className="h-7 w-7" />}
        title="Services is coming soon"
        description="This section will list the service assignments and work allocated to you by the property administrator. The portal API does not expose provider assignments yet, so this page is a placeholder — it does not show sample data."
        points={[
          'Your assigned service jobs and their status will appear here.',
          'In the meantime, the properties you serve are available under My Properties.',
          'Your contracts and certificates remain available under Documents & Files.',
        ]}
        links={[
          { href: '/service-provider/properties', label: 'Go to My Properties' },
          { href: '/service-provider/documents', label: 'Go to Documents & Files' },
        ]}
      />
    </ProviderPortalLayout>
  );
}
