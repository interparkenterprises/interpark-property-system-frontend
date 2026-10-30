'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Building2, LockKeyhole } from 'lucide-react';
import {
  Property,
  ArrearsResponse,
  OverdueTenantsResponse,
  NextPaymentsResponse,
  NextPaymentItem,
  GetPropertyRentReportParams,
  GetPropertyBillsReportParams,
  PaymentStatus,
  BillType,
  InvoiceStatus,
} from '@/types';
import { propertiesAPI, paymentsAPI, tenantsAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { exportPropertyToExcel, ExportSection } from '@/lib/excelGenerator';
import { usePermissions } from '@/hooks/usePermission';
import { PermissionCode } from '@/types';
import { exportCombinedArrearsToPDF } from '@/lib/arrearsPdfGenerator';
import { useBreadcrumbOverride } from '@/components/layout/BreadcrumbContext';
import { TabsContent } from '@/components/ui/tabs';
import { PropertyWorkspaceTabs, type PropertyWorkspaceTab } from '@/components/properties/workspace/PropertyWorkspaceTabs';
import { PropertyFinancialHeader } from './PropertyFinancialHeader';
import { PropertyFinancialSummary } from './PropertyFinancialSummary';
import { PropertyFinancialNavigation, type PropertyFinancialTab } from './PropertyFinancialNavigation';
import { propertyTenantDetailsPermissions } from './access';
import { IncomeDetailsTab } from './tabs/IncomeDetailsTab';
import { CommissionsTab } from './tabs/CommissionsTab';
import { ArrearsOverduesTab } from './tabs/ArrearsOverduesTab';
import { PropertyStatementTab } from './tabs/PropertyStatementTab';
import { UpcomingPaymentsTab } from './tabs/UpcomingPaymentsTab';
import { RentReportTab } from './tabs/RentReportTab';
import { BillsReportTab } from './tabs/BillsReportTab';
import { PropertyStatementExportDialog } from './components/PropertyStatementExportDialog';
import type {
  BillsReportData,
  CollectionStatementData,
  OverdueTenant,
  RentReportData,
} from './types';
import {
  getPropertyFinancialTotals,
  groupPropertyArrearsByTenant,
  groupPropertyIncomeByTenant,
} from './utils/financialPresentation';
import { useFinancialTabState } from './hooks/useFinancialTabState';

type TabType = PropertyFinancialTab;

// Define proper types for Framer Motion variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export function PropertyFinancialWorkspace() {
  const params = useParams();
  const router = useRouter();
  const {
    hasPermission,
    isAdmin,
    isManager,
    canViewProperty,
    canViewCommissions,
    canAccessModule,
    canViewServiceProviders,
    canViewActivations,
  } = usePermissions();
  
  const [property, setProperty] = useState<Property | null>(null);
  const [arrearsData, setArrearsData] = useState<ArrearsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [arrearsLoading, setArrearsLoading] = useState(false);
  const [overdueData, setOverdueData] = useState<OverdueTenantsResponse | null>(null);
  const [overduesLoading, setOverduesLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportingCombinedArrears, setExportingCombinedArrears] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [overdueFilter, setOverdueFilter] = useState<string>('all');
  const [overdueCustomDays, setOverdueCustomDays] = useState<number>(30);
  
  // State for expanded tenant tabs
  const [expandedIncomeTenant, setExpandedIncomeTenant] = useState<string | null>(null);
  const [expandedArrearsTenant, setExpandedArrearsTenant] = useState<string | null>(null);
  const [expandedOverdueTenant, setExpandedOverdueTenant] = useState<string | null>(null);

  const [exportSections, setExportSections] = useState<ExportSection[]>([
    { id: 'propertyInfo', label: 'Property Information', selected: true },
    { id: 'financialSummary', label: 'Financial Summary', selected: true },
    { id: 'unitsAndTenants', label: 'Units & Tenants', selected: true },
    { id: 'incomeRecords', label: 'Income Records', selected: true },
    { id: 'commissionRecords', label: 'Commission Records', selected: true },
    { id: 'serviceProviders', label: 'Service Providers', selected: true },
  ]);
  const [nextPaymentsData, setNextPaymentsData] = useState<NextPaymentsResponse | null>(null);
  const [nextPaymentsLoading, setNextPaymentsLoading] = useState(false);
  const [expandedPaymentTenant, setExpandedPaymentTenant] = useState<string | null>(null);

  // State for Rent Report
  const [rentReportData, setRentReportData] = useState<RentReportData | null>(null);
  const [rentReportLoading, setRentReportLoading] = useState(false);
  const [rentReportFilters, setRentReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    status: '',
    page: 1,
    limit: 100
  });

  // State for Bills Report
  const [billsReportData, setBillsReportData] = useState<BillsReportData | null>(null);
  const [billsReportLoading, setBillsReportLoading] = useState(false);
  const [billsReportFilters, setBillsReportFilters] = useState({
    dateFrom: '',
    dateTo: '',
    billType: '',
    status: '',
    page: 1,
    limit: 100
  });

  // Export loading states
  const [exportingRentReport, setExportingRentReport] = useState(false);
  const [exportingBillsReport, setExportingBillsReport] = useState(false);
  const [exportingUpcomingPayments, setExportingUpcomingPayments] = useState(false);
  const [upcomingDateFrom, setUpcomingDateFrom] = useState<string>('');
  const [upcomingDateTo, setUpcomingDateTo] = useState<string>('');
  const [filteredPayments, setFilteredPayments] = useState<NextPaymentItem[]>([]);
  // State for Collection Statement
  const [collectionStatement, setCollectionStatement] = useState<CollectionStatementData | null>(null);
  const [collectionStatementLoading, setCollectionStatementLoading] = useState(false);
  const [collectionDateFrom, setCollectionDateFrom] = useState<string>(() => {
    const now = new Date();
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    return threeMonthsAgo.toISOString().split('T')[0];
  });
  const [collectionDateTo, setCollectionDateTo] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const propertyId = params.id as string;
  useBreadcrumbOverride(`/properties/${propertyId}`, loading ? 'Loading…' : property?.name ?? 'Property details');
  useBreadcrumbOverride(`/properties/${propertyId}/details`, 'Financial Details');

  // Define which tabs are accessible based on permissions
  const accessibleTabs = useMemo(() => {
    const tabs: { id: TabType; label: string; accessible: boolean }[] = [
      {
        id: 'income',
        label: 'Income Details',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.VIEW_TENANT_FINANCIALS) || hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS)
      },
      {
        id: 'commissions',
        label: 'Commissions',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.VIEW_COMMISSIONS)
      },
      {
        id: 'arrears',
        label: 'Arrears & Overdues',
        accessible: isAdmin || isManager || 
          hasPermission(PermissionCode.VIEW_ARREARS) || 
          hasPermission(PermissionCode.VIEW_OVERDUE_INVOICES) || 
          hasPermission(PermissionCode.VIEW_TENANT_FINANCIALS)
      },
      {
        id: 'payments',
        label: 'Property Statement',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS)
      },
      {
        id: 'UpcomingPayments',
        label: 'Upcoming Payments',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.PREVIEW_PAYMENTS) || hasPermission(PermissionCode.VIEW_TENANT_FINANCIALS)
      },
      {
        id: 'rentReport',
        label: 'Rent Report',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS)
      },
      {
        id: 'billsReport',
        label: 'Bills Report',
        accessible: isAdmin || isManager || hasPermission(PermissionCode.VIEW_BILL_INVOICES)
      },
    ];
    
    return tabs.filter(tab => tab.accessible);
  }, [isAdmin, isManager, hasPermission]);

  const { activeTab, selectTab: handleFinancialTabChange } = useFinancialTabState(accessibleTabs);

  // Fetch Collection Statement
  const fetchCollectionStatement = async () => {
    if (!propertyId) return;
    
    setCollectionStatementLoading(true);
    try {
      const params: { startDate?: string; endDate?: string } = {};
      if (collectionDateFrom) params.startDate = collectionDateFrom;
      if (collectionDateTo) params.endDate = collectionDateTo;
      
      const response = await propertiesAPI.getCollectionStatement(propertyId, params);
      setCollectionStatement(response.data);
    } catch (error) {
      console.error('Error fetching collection statement:', error);
      setCollectionStatement(null);
    } finally {
      setCollectionStatementLoading(false);
    }
  };



  const fetchPropertyDetails = async () => {
    try {
      const data = await propertiesAPI.getById(propertyId);
      setProperty(data);
    } catch (error) {
      console.error('Error fetching property details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchNextPaymentsData function to reset filters
  const fetchNextPaymentsData = async () => {
    setNextPaymentsLoading(true);
    try {
      const data = await tenantsAPI.getNextPaymentsByProperty(propertyId);
      setNextPaymentsData(data);
      // Reset filters when new data loads
      setUpcomingDateFrom('');
      setUpcomingDateTo('');
    } catch (error) {
      console.error('Error fetching next payments:', error);
    } finally {
      setNextPaymentsLoading(false);
    }
  };

  const fetchArrearsData = async () => {
    setArrearsLoading(true);
    try {
      const data = await paymentsAPI.getArrears(propertyId);
      setArrearsData(data);
    } catch (error) {
      console.error('Error fetching arrears data:', error);
    } finally {
      setArrearsLoading(false);
    }
  };

  const fetchOverduesData = async () => {
    setOverduesLoading(true);
    try {
      let data;
      if (overdueFilter === 'all') {
        data = await tenantsAPI.getOverdue(propertyId);
      } else if (overdueFilter === 'custom' && overdueCustomDays) {
        data = await tenantsAPI.getOverdue(propertyId, 'custom', overdueCustomDays);
      } else if (overdueFilter !== 'all' && overdueFilter !== 'custom') {
        data = await tenantsAPI.getOverdue(propertyId, parseInt(overdueFilter));
      } else {
        data = await tenantsAPI.getOverdue(propertyId);
      }
      setOverdueData(data);
    } catch (error) {
      console.error('Error fetching overdue tenants:', error);
    } finally {
      setOverduesLoading(false);
    }
  };

  // Update the fetchRentReport function
  const fetchRentReport = async () => {
    setRentReportLoading(true);
    try {
      const params: GetPropertyRentReportParams = {};
      // Make sure dates are properly formatted
      if (rentReportFilters.dateFrom) {
        const fromDate = new Date(rentReportFilters.dateFrom);
        params.dateFrom = fromDate.toISOString();
      }
      if (rentReportFilters.dateTo) {
        const toDate = new Date(rentReportFilters.dateTo);
        // Set to end of day
        toDate.setHours(23, 59, 59, 999);
        params.dateTo = toDate.toISOString();
      }
      if (rentReportFilters.status) params.status = rentReportFilters.status as PaymentStatus;
      if (rentReportFilters.page) params.page = rentReportFilters.page;
      if (rentReportFilters.limit) params.limit = rentReportFilters.limit;
      
      const response = await paymentsAPI.getPropertyRentPaymentReport(propertyId, params);
      setRentReportData(response.data);
    } catch (error) {
      console.error('Error fetching rent report:', error);
      alert('Failed to fetch rent report');
    } finally {
      setRentReportLoading(false);
    }
  };

  // Fetch Bills Report
  const fetchBillsReport = async () => {
    setBillsReportLoading(true);
    try {
      const params: GetPropertyBillsReportParams = {};
      
      // =============================================
      // FIX: Ensure proper date formatting
      // =============================================
      if (billsReportFilters.dateFrom) {
        const fromDate = new Date(billsReportFilters.dateFrom);
        params.dateFrom = fromDate.toISOString();
      }
      if (billsReportFilters.dateTo) {
        const toDate = new Date(billsReportFilters.dateTo);
        // Set to end of day for inclusive range
        toDate.setHours(23, 59, 59, 999);
        params.dateTo = toDate.toISOString();
      }
      if (billsReportFilters.billType) params.billType = billsReportFilters.billType as BillType;
      if (billsReportFilters.status) params.status = billsReportFilters.status as InvoiceStatus;
      if (billsReportFilters.page) params.page = billsReportFilters.page;
      if (billsReportFilters.limit) params.limit = billsReportFilters.limit;
      
      const response = await paymentsAPI.getPropertyBillsPaymentReport(propertyId, params);
      setBillsReportData(response.data);
    } catch (error) {
      console.error('Error fetching bills report:', error);
      alert('Failed to fetch bills report');
    } finally {
      setBillsReportLoading(false);
    }
  };

  // Update the handleExportRentReport function
  const handleExportRentReport = async () => {
    if (!rentReportData) {
      alert('No rent report data to export');
      return;
    }
    
    setExportingRentReport(true);
    try {
      const { exportRentReportToExcel } = await import('@/lib/excelRentReportGenerator');
      
      // Ensure we have the correct data structure
      const reportData = {
        ...rentReportData,
        // Make sure property info is properly structured
        property: rentReportData.property || {
          id: propertyId,
          name: property?.name || 'Unknown Property',
          address: property?.address || ''
        }
      };
      
      const { buffer, filename } = await exportRentReportToExcel(reportData, {
        periodFrom: rentReportFilters.dateFrom,
        periodTo: rentReportFilters.dateTo,
        status: rentReportFilters.status
      });
      
      // Create blob from buffer
      const uint8Array = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as unknown as ArrayBuffer);
      const blob = new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('Rent report exported successfully!');
    } catch (error) {
      console.error('Error exporting rent report:', error);
      alert('Failed to export rent report');
    } finally {
      setExportingRentReport(false);
    }
  };


  // Export Bills Report to Excel
  const handleExportBillsReport = async () => {
    if (!billsReportData) {
      alert('No bills report data to export');
      return;
    }
    
    setExportingBillsReport(true);
    try {
      const { exportBillsReportToExcel } = await import('@/lib/excelBillsReportGenerator');
      const { buffer, filename } = await exportBillsReportToExcel(billsReportData, {
        periodFrom: billsReportFilters.dateFrom,
        periodTo: billsReportFilters.dateTo,
        billType: billsReportFilters.billType,
        status: billsReportFilters.status
      });
      
      // Create blob from buffer (convert to Uint8Array)
      const uint8Array = new Uint8Array(buffer);
      const blob = new Blob([uint8Array], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);
      
      alert('Bills report exported successfully!');
    } catch (error) {
      console.error('Error exporting bills report:', error);
      alert('Failed to export bills report');
    } finally {
      setExportingBillsReport(false);
    }
  };
  // Update the handleExportUpcomingPayments function to accept date range
  const handleExportUpcomingPayments = async () => {
    if (!nextPaymentsData || !property) {
      alert('No upcoming payments data to export');
      return;
    }

    setExportingUpcomingPayments(true);

    try {
      const { exportUpcomingPaymentsToExcel } = await import('@/lib/excelUpcomingPaymentsGenerator');
      const { buffer, filename } = await exportUpcomingPaymentsToExcel(
        nextPaymentsData,
        {
          propertyName: property.name,
          exportDate: new Date().toLocaleDateString(),
          dateFrom: upcomingDateFrom || undefined,
          dateTo: upcomingDateTo || undefined,
        },
        filteredPayments // Pass filtered payments
      );

      // Create blob and download
      const blobData = buffer instanceof ArrayBuffer ? new Uint8Array(buffer) : new Uint8Array(buffer as unknown as ArrayBuffer);
      const blob = new Blob([blobData], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      alert('Upcoming payments report exported successfully!');
    } catch (error) {
      console.error('Error exporting upcoming payments:', error);
      alert('Failed to export upcoming payments report. Please try again.');
    } finally {
      setExportingUpcomingPayments(false);
    }
  };

  // Add clear filters function
  const clearUpcomingFilters = () => {
    setUpcomingDateFrom('');
    setUpcomingDateTo('');
  };

  useEffect(() => {
    void Promise.resolve().then(fetchPropertyDetails);
  }, [propertyId]);

  useEffect(() => {
    if (activeTab === 'arrears' && !arrearsData) {
      void Promise.resolve().then(fetchArrearsData);
    }
  }, [activeTab, arrearsData]);

  useEffect(() => {
    if (activeTab === 'arrears' && propertyId) {
      void Promise.resolve().then(fetchOverduesData);
    }
  }, [activeTab, propertyId, overdueFilter, overdueCustomDays]);

  useEffect(() => {
    if (activeTab === 'UpcomingPayments' && propertyId) {
      void Promise.resolve().then(fetchNextPaymentsData);
    }
  }, [activeTab, propertyId]);

  useEffect(() => {
    if (activeTab === 'rentReport' && !rentReportData) {
      void Promise.resolve().then(fetchRentReport);
    }
    if (activeTab === 'billsReport' && !billsReportData) {
      void Promise.resolve().then(fetchBillsReport);
    }
  }, [activeTab]);

  // Check if user can access this property
  useEffect(() => {
    if (!loading && property && !canViewProperty(propertyId)) {
      router.push('/unauthorized');
    }
  }, [loading, property, propertyId, canViewProperty, router]);

  
  // Update the useEffect that filters payments
  useEffect(() => {
    if (nextPaymentsData?.payments) {
      // Start with ALL payments (not just non-overdue)
      let filtered = [...nextPaymentsData.payments];
      
      // Apply date filters with proper date handling
      if (upcomingDateFrom) {
        const fromDate = new Date(upcomingDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        
        filtered = filtered.filter(p => {
          const dueDate = new Date(p.payment.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate >= fromDate;
        });
      }
      
      if (upcomingDateTo) {
        const toDate = new Date(upcomingDateTo);
        toDate.setHours(23, 59, 59, 999);
        
        filtered = filtered.filter(p => {
          const dueDate = new Date(p.payment.dueDate);
          dueDate.setHours(0, 0, 0, 0);
          return dueDate <= toDate;
        });
      }
      
      // Sort: overdue first, then by days until due (closest first)
      filtered.sort((a, b) => {
        // Overdue first
        if (a.payment.isOverdue && !b.payment.isOverdue) return -1;
        if (!a.payment.isOverdue && b.payment.isOverdue) return 1;
        // Then by days until due (ascending)
        return a.payment.daysUntilDue - b.payment.daysUntilDue;
      });
      
      queueMicrotask(() => setFilteredPayments(filtered));
    }
  }, [nextPaymentsData, upcomingDateFrom, upcomingDateTo]);

  useEffect(() => {
    // Initial load of collection statement when tab is selected
    if (activeTab === 'payments') {
      void Promise.resolve().then(fetchCollectionStatement);
    }
  }, [activeTab, propertyId]);


  const handleBack = () => {
    router.push(`/properties/${propertyId}`);
  };

  const handleWorkspaceTabChange = (tab: PropertyWorkspaceTab) => {
    if (tab === 'financial') return;
    router.push(tab === 'overview' ? `/properties/${propertyId}` : `/properties/${propertyId}?tab=${tab}`);
  };

  const totals = getPropertyFinancialTotals(property);
  const canViewTenantWorkspace = canAccessModule('tenants')
    || isAdmin
    || isManager
    || propertyTenantDetailsPermissions.some((permission) => hasPermission(permission));

  // Filter overdue tenants based on selected filter
  const filteredOverdueTenants = useMemo(() => {
    const overdueTenants = (overdueData?.tenants ?? []) as OverdueTenant[];
    if (!overdueTenants.length) return [];
    
    if (overdueFilter === 'all') return overdueTenants;
    
    const days = overdueFilter === 'custom' ? overdueCustomDays : parseInt(overdueFilter);
    return overdueTenants.filter((tenant) => {
      const overdueDays = tenant.overdueDetails?.daysOverdue ||
                         (tenant.paymentSummary?.nextPayment?.paymentsBehind || 0) * 30;
      return overdueDays >= days;
    });
  }, [overdueData?.tenants, overdueFilter, overdueCustomDays]);

  // Toggle individual section
  const toggleSection = (sectionId: string) => {
    setExportSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, selected: !section.selected } : section
      )
    );
  };

  // Toggle all sections
  const toggleAllSections = () => {
    const allSelected = exportSections.every((s) => s.selected);
    setExportSections((prev) => prev.map((section) => ({ ...section, selected: !allSelected })));
  };

  // Check if all sections are selected
  const allSectionsSelected = exportSections.every((s) => s.selected);

  // Get selected sections
  const getSelectedSections = () => {
    return exportSections.filter((s) => s.selected).map((s) => s.id);
  };

  // Open export modal
  const handleOpenExportModal = async () => {
    // Ensure we have fresh data
    if (!collectionStatement || collectionDateFrom || collectionDateTo) {
      await fetchCollectionStatement();
    }
    setShowExportModal(true);
  };

  // Close export modal
  const handleCloseExportModal = () => {
    setShowExportModal(false);
  };

  // Combined Arrears & Overdues Export Handler
  const handleExportCombinedArrearsToPDF = async () => {
    if (!property) return;
    
    // Check if we have any data to export with proper null checks
    const hasArrears = arrearsData?.arrears && arrearsData.arrears.length > 0;
    const hasOverdues = overdueData?.tenants && overdueData.tenants.length > 0;
    
    if (!hasArrears && !hasOverdues) {
      alert('No arrears or overdue data to export.');
      return;
    }

    setExportingCombinedArrears(true);

    try {
      const filterDays = overdueFilter !== 'all' 
        ? (overdueFilter === 'custom' ? overdueCustomDays : parseInt(overdueFilter))
        : null;
      
      await exportCombinedArrearsToPDF(
        property,
        arrearsData,
        overdueData,
        filterDays,
        filteredOverdueTenants
      );
      
      alert('Combined arrears report exported successfully!');
    } catch (error) {
      console.error('Error exporting combined arrears report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExportingCombinedArrears(false);
    }
  };

  // Export to Excel using the separated utility
  // Update the exportToExcel function
  const exportToExcel = async () => {
    if (!property) return;

    const selectedSections = getSelectedSections();

    if (selectedSections.length === 0) {
      alert('Please select at least one section to export.');
      return;
    }

    setExporting(true);
    setShowExportModal(false);

    try {
      // Use collection statement data if available, otherwise fallback to property data
      const dataForExport = collectionStatement || property;
      
      const { buffer, filename } = await exportPropertyToExcel(
        property, 
        selectedSections, 
        totals,
        dataForExport
      );
      
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(url);

      alert('Property collection statement exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6" aria-label="Loading property financial details">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-28" />)}
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <EmptyState
        icon={Building2}
        title="Property not found"
        description="Unable to load this property's financial details."
        action={<Button onClick={() => router.push('/properties')}>Back to Properties</Button>}
        className="min-h-[60vh]"
      />
    );
  }

  // Permission check for the entire page
  if (!canViewProperty(propertyId) || accessibleTabs.length === 0) {
    return (
      <EmptyState
        icon={LockKeyhole}
        title="Access denied"
        description="You don't have permission to view this property's financial details."
        action={<Button onClick={handleBack}>Back to Property</Button>}
        className="min-h-[60vh]"
      />
    );
  }

  const groupedIncome = groupPropertyIncomeByTenant(property);
  const groupedArrears = groupPropertyArrearsByTenant(arrearsData);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-w-0 space-y-6"
    >
      <PropertyStatementExportDialog
        open={showExportModal}
        onOpenChange={setShowExportModal}
        property={property}
        sections={exportSections}
        allSectionsSelected={allSectionsSelected}
        onToggleAll={toggleAllSections}
        onToggleSection={toggleSection}
        exporting={exporting}
        onCancel={handleCloseExportModal}
        onExport={exportToExcel}
      />

      <PropertyFinancialHeader property={property} />

      <PropertyWorkspaceTabs
        value="financial"
        onValueChange={handleWorkspaceTabChange}
        canViewFinancial
        canViewUnits={canAccessModule('units')}
        canViewTenants={canViewTenantWorkspace}
        canViewProviders={canViewServiceProviders}
        canViewReports={canAccessModule('reports')}
        canViewActivations={canViewActivations}
      >
        <TabsContent value="financial" className="space-y-6 pt-4">
          {(isAdmin || isManager || hasPermission(PermissionCode.VIEW_TENANT_FINANCIALS)) && (
            <PropertyFinancialSummary
              totals={totals}
              showCommissionMetrics={canViewCommissions}
            />
          )}

          <PropertyFinancialNavigation
            value={activeTab}
            onValueChange={handleFinancialTabChange}
            tabs={accessibleTabs}
          >
      <div key={activeTab}>
        {activeTab === 'income' && <IncomeDetailsTab groupedIncome={groupedIncome} expandedTenantId={expandedIncomeTenant} onExpandedTenantChange={setExpandedIncomeTenant} />}

        {activeTab === 'commissions' && <CommissionsTab property={property} />}

        {activeTab === 'arrears' && (
          <ArrearsOverduesTab
            arrearsData={arrearsData}
            overdueData={overdueData}
            groupedArrears={groupedArrears}
            filteredOverdueTenants={filteredOverdueTenants}
            arrearsLoading={arrearsLoading}
            overduesLoading={overduesLoading}
            exportingCombinedArrears={exportingCombinedArrears}
            overdueFilter={overdueFilter}
            overdueCustomDays={overdueCustomDays}
            expandedArrearsTenant={expandedArrearsTenant}
            expandedOverdueTenant={expandedOverdueTenant}
            setOverdueFilter={setOverdueFilter}
            setOverdueCustomDays={setOverdueCustomDays}
            setExpandedArrearsTenant={setExpandedArrearsTenant}
            setExpandedOverdueTenant={setExpandedOverdueTenant}
            fetchArrearsData={fetchArrearsData}
            fetchOverduesData={fetchOverduesData}
            handleExportCombinedArrearsToPDF={handleExportCombinedArrearsToPDF}
          />
        )}

        {activeTab === 'payments' && (
          <PropertyStatementTab
            collectionStatement={collectionStatement}
            collectionStatementLoading={collectionStatementLoading}
            collectionDateFrom={collectionDateFrom}
            collectionDateTo={collectionDateTo}
            exporting={exporting}
            setCollectionDateFrom={setCollectionDateFrom}
            setCollectionDateTo={setCollectionDateTo}
            fetchCollectionStatement={fetchCollectionStatement}
            handleOpenExportModal={handleOpenExportModal}
          />
        )}

        {activeTab === 'UpcomingPayments' && (
          <UpcomingPaymentsTab
            nextPaymentsData={nextPaymentsData}
            nextPaymentsLoading={nextPaymentsLoading}
            filteredPayments={filteredPayments}
            upcomingDateFrom={upcomingDateFrom}
            upcomingDateTo={upcomingDateTo}
            expandedPaymentTenant={expandedPaymentTenant}
            exportingUpcomingPayments={exportingUpcomingPayments}
            setUpcomingDateFrom={setUpcomingDateFrom}
            setUpcomingDateTo={setUpcomingDateTo}
            setExpandedPaymentTenant={setExpandedPaymentTenant}
            clearUpcomingFilters={clearUpcomingFilters}
            fetchNextPaymentsData={fetchNextPaymentsData}
            handleExportUpcomingPayments={handleExportUpcomingPayments}
          />
        )}

        {activeTab === 'rentReport' && (
          <RentReportTab
            rentReportData={rentReportData}
            rentReportLoading={rentReportLoading}
            exportingRentReport={exportingRentReport}
            rentReportFilters={rentReportFilters}
            setRentReportFilters={setRentReportFilters}
            fetchRentReport={fetchRentReport}
            handleExportRentReport={handleExportRentReport}
          />
        )}

        {activeTab === 'billsReport' && (
          <BillsReportTab
            billsReportData={billsReportData}
            billsReportLoading={billsReportLoading}
            exportingBillsReport={exportingBillsReport}
            billsReportFilters={billsReportFilters}
            setBillsReportFilters={setBillsReportFilters}
            fetchBillsReport={fetchBillsReport}
            handleExportBillsReport={handleExportBillsReport}
          />
        )}

      </div>
          </PropertyFinancialNavigation>
        </TabsContent>
        {canAccessModule('units') && <TabsContent value="units" />}
        {canViewTenantWorkspace && <TabsContent value="tenants" />}
        {canViewServiceProviders && <TabsContent value="providers" />}
        {canAccessModule('reports') && <TabsContent value="reports" />}
        {canViewActivations && <TabsContent value="activations" />}
      </PropertyWorkspaceTabs>
    </motion.div>
  );
}
