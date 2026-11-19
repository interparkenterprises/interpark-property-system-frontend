import type { NavItem } from '@/components/DashboardShell';
import {
  LayoutDashboard,
  User,
  Building2,
  FileText,
  ClipboardList,
  Receipt,
  BarChart3,
  Bell,
  Settings,
} from 'lucide-react';

/**
 * Sidebar navigation for the Service Provider Portal.
 *
 * Every entry maps to a real route under app/service-provider/*.
 *
 * Sections backed by `providerPortalAPI` (real data):
 *   - Dashboard, My Profile (getProfile), My Properties (getProperties),
 *     Documents & Files (getAttachments + upload/update/delete/preview/download).
 *
 * Sections without any provider-portal endpoint yet render honest placeholders:
 *   - Services (assignments), Invoices, Reports, Notifications, Settings.
 * No badge is shown on Notifications because there is no API to count unread
 * items — a hardcoded number would be misleading.
 */
export const PROVIDER_NAV_ITEMS: NavItem[] = [
  {
    href: '/service-provider/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },

  {
    href: '/service-provider/properties',
    label: 'My Properties',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    href: '/service-provider/documents',
    label: 'Documents & Files',
    icon: <FileText className="h-5 w-5" />,
  },
  {
    href: '/service-provider/assignments',
    label: 'Services',
    icon: <ClipboardList className="h-5 w-5" />,
  },
 /**{
    href: '/service-provider/invoices',
    label: 'Invoices',
    icon: <Receipt className="h-5 w-5" />,
  },
  {
    href: '/service-provider/reports',
    label: 'Reports',
    icon: <BarChart3 className="h-5 w-5" />,
  }, **/
  {
    href: '/service-provider/notifications',
    label: 'Notifications',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    href: '/service-provider/settings',
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
  },
  {
    href: '/service-provider/profile',
    label: 'My Profile',
    icon: <User className="h-5 w-5" />,
  },
];
