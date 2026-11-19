'use client';

import { Settings } from 'lucide-react';
import ProviderPortalLayout from '@/components/ProviderPortalLayout';
import { FeaturePlaceholder } from '@/components/PageStates';

export default function ProviderSettingsPage() {
  return (
    <ProviderPortalLayout
      title={
        <>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Settings</h1>
          <p className="text-xs sm:text-sm text-slate-700 truncate">Account preferences</p>
        </>
      }
    >
      <FeaturePlaceholder
        icon={<Settings className="h-7 w-7" />}
        title="Settings is coming soon"
        description="Self-service settings for the provider portal are not available yet — there is no provider-portal settings endpoint. Your profile details (name, contact, contract, charge) are managed by the property administrator."
        points={[
          'View your provider details under My Profile.',
          'If your account requires a password change, you are directed to /change-password at login.',
          'Contact the property administrator for any corrections.',
        ]}
        links={[{ href: '/service-provider/profile', label: 'Go to My Profile' }]}
      />
    </ProviderPortalLayout>
  );
}
