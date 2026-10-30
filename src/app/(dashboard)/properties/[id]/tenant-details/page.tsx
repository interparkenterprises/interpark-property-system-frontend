'use client';
import { useEffect, useState, useMemo, JSX } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Tenant, Invoice, InvoiceStatus, PaymentReport, PaymentPreview, CreatePaymentReportResponse, PaymentStatus, BillInvoice, PaymentPolicy, DemandLetter, CreatePaymentReportRequest } from '@/types';
import { tenantsAPI, invoicesAPI, paymentsAPI, billInvoicesAPI, demandLettersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog,  DialogContent,  DialogDescription,  DialogFooter,  DialogHeader,  DialogTitle,} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';
import { useWhatsApp } from '@/hooks/useWhatsApp';
import { generateBillInvoiceReportPDF, generateComprehensiveReportPDF } from '@/lib/pdfGenerator';
import { formatDateToOrdinal } from '@/lib/dateUtils';
import { useGlobalPermissions } from '@/app/providers/PermissionsProvider';
import { PermissionCode } from '@/types';
import { AttachmentSection } from '@/components/tenant/AttachmentSection';
import { useBreadcrumbOverride, useBreadcrumbRouteTrail } from '@/components/layout/BreadcrumbContext';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DetailItem, DetailList } from '@/components/ui/detail-list';
import { PageHeader } from '@/components/ui/page-header';
import { formatExactKes } from '@/lib/numberFormat';
import { ChevronRight } from 'lucide-react';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Permission hooks - using the centralized permission system
  const { 
    permissions,
    isAdmin, 
    isManager,
    hasPermission,
  } = useGlobalPermissions();
  
  // ==============================================
  // PAGE ACCESS PERMISSION CHECK
  // ==============================================
  const tenantDetailsAccessPermissions = useMemo(() => [
    PermissionCode.VIEW_TENANT_FINANCIALS,
    PermissionCode.VIEW_INVOICES,
    PermissionCode.VIEW_PAYMENT_REPORTS,
    PermissionCode.VIEW_BILL_INVOICES,
    PermissionCode.VIEW_DEMAND_LETTERS,
    PermissionCode.VIEW_OVERDUE_INVOICES,
    PermissionCode.RECORD_PAYMENTS,
    PermissionCode.CREATE_INVOICES,
    PermissionCode.CREATE_BILL_INVOICE,
    PermissionCode.DOWNLOAD_INVOICES,
    PermissionCode.CREATE_DEMAND_LETTER,
    PermissionCode.SEND_DEMAND_LETTERS,
    PermissionCode.AUTO_GENERATE_DEMAND_LETTER,
    PermissionCode.DOWNLOAD_DEMAND_LETTER,
  ], []);

  const canAccessTenantDetailsPage = useMemo(() => {
    if (isAdmin || isManager) return true;
    return tenantDetailsAccessPermissions.some(permission => hasPermission(permission));
  }, [isAdmin, isManager, hasPermission, tenantDetailsAccessPermissions]);

  // Redirect if user doesn't have permission
  useEffect(() => {
    if (!canAccessTenantDetailsPage) {
      router.push('/unauthorized');
    }
  }, [canAccessTenantDetailsPage, router]);
  
  // ==============================================
  // PERMISSION CHECKS FOR SPECIFIC FEATURES
  // ADMIN and MANAGER have full access
  // USER has limited access based on their permissions
  // Using centralized permission checks
  // ==============================================
  
  const canViewInvoices = isAdmin || isManager || 
    hasPermission(PermissionCode.VIEW_INVOICES) ||
    hasPermission(PermissionCode.CREATE_INVOICES) ||
    hasPermission(PermissionCode.DOWNLOAD_INVOICES);
    
  const canCreateInvoices = isAdmin || isManager || hasPermission(PermissionCode.CREATE_INVOICES);
  
  const canViewPayments = isAdmin || isManager ||
    hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS) ||
    hasPermission(PermissionCode.RECORD_PAYMENTS);
    
  const canCreatePayments = isAdmin || isManager || hasPermission(PermissionCode.RECORD_PAYMENTS);
  const canDownloadPaymentReports = isAdmin || isManager || hasPermission(PermissionCode.VIEW_PAYMENT_REPORTS);
  
  const canViewBillInvoices = isAdmin || isManager || hasPermission(PermissionCode.VIEW_BILL_INVOICES);
  const canDownloadBillInvoices = isAdmin || isManager || hasPermission(PermissionCode.DOWNLOAD_BILL_INVOICE);
  
  const canViewDemandLetters = isAdmin || isManager ||
    hasPermission(PermissionCode.VIEW_DEMAND_LETTERS) ||
    hasPermission(PermissionCode.SEND_DEMAND_LETTERS) ||
    hasPermission(PermissionCode.AUTO_GENERATE_DEMAND_LETTER) ||
    hasPermission(PermissionCode.DOWNLOAD_DEMAND_LETTER);
    
  const canCreateDemandLetters = isAdmin || isManager ||
    hasPermission(PermissionCode.CREATE_DEMAND_LETTER) ||
    hasPermission(PermissionCode.AUTO_GENERATE_DEMAND_LETTER);
  
  const canViewOverdueInvoices = isAdmin || isManager || hasPermission(PermissionCode.VIEW_OVERDUE_INVOICES);
  
  const canViewComprehensiveReport = isAdmin || isManager;
  
  // State declarations
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentReports, setPaymentReports] = useState<PaymentReport[]>([]);
  const [billInvoices, setBillInvoices] = useState<BillInvoice[]>([]);
  const [demandLetters, setDemandLetters] = useState<DemandLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setInvoicesLoading] = useState(false);
  const [, setPaymentReportsLoading] = useState(false);
  const [, setBillInvoicesLoading] = useState(false);
  const [, setDemandLettersLoading] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showDemandLetterDialog, setShowDemandLetterDialog] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingBillPDF, setGeneratingBillPDF] = useState(false);
  const [generatingComprehensivePDF, setGeneratingComprehensivePDF] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [createMissingInvoices, setCreateMissingInvoices] = useState<boolean>(true);
  const [autoGenerateBalanceInvoice, setAutoGenerateBalanceInvoice] = useState<boolean>(true);
  const [updateExistingInvoices, setUpdateExistingInvoices] = useState<boolean>(true);
  const [generatingDemandLetter, setGeneratingDemandLetter] = useState(false);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Invoice[]>([]);
  const [outstandingBillInvoices] = useState<BillInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedBillInvoiceIds, setSelectedBillInvoiceIds] = useState<string[]>([]);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(true);
  const [paymentPreview, setPaymentPreview] = useState<PaymentPreview | null>(null);
  const [allocatedInvoices, setAllocatedInvoices] = useState<CreatePaymentReportResponse['invoices']>([]);
  const [overpaymentDetails, setOverpaymentDetails] = useState<CreatePaymentReportResponse['overpayment'] | null>(null);
  const [showPaymentAllocation, setShowPaymentAllocation] = useState(false);
  const [, setCalculatingPreview] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    dueDate: '',
    notes: '',
  });
  
  const [paymentForm, setPaymentForm] = useState({
    paymentPeriod: '',
    datePaid: new Date().toISOString().split('T')[0],
    amountPaid: '',
    notes: '',
    status: 'PAID' as PaymentStatus,
  });

  const [demandLetterForm, setDemandLetterForm] = useState({
    demandPeriod: '',
    notes: '',
  });

  const tenantId = params.id as string;
  const tenantWorkspaceHref = tenant?.unit?.propertyId ? `/properties/${tenant.unit.propertyId}?tab=tenants` : '/properties';
  useBreadcrumbOverride(`/properties/${tenantId}`, loading ? 'Loading…' : tenant?.unit?.property?.name ?? 'Property details', tenant?.unit?.propertyId ? `/properties/${tenant.unit.propertyId}` : '/properties');
  useBreadcrumbRouteTrail([
    { label: 'Tenants', href: tenantWorkspaceHref },
    { label: loading ? 'Loading…' : tenant?.fullName ?? 'Tenant details' },
  ], `/properties/${tenantId}`, tenantWorkspaceHref);

  // Fetch payment preview when amount changes
  useEffect(() => {
    const fetchPreview = async () => {
      if (!tenantId || !paymentForm.amountPaid || parseFloat(paymentForm.amountPaid) <= 0) {
        setPaymentPreview(null);
        return;
      }

      try {
        setCalculatingPreview(true);
        const preview = await paymentsAPI.previewPayment(tenantId);
        setPaymentPreview(preview);
      } catch (error) {
        console.error('Error fetching payment preview:', error);
      } finally {
        setCalculatingPreview(false);
      }
    };

    const timeoutId = setTimeout(fetchPreview, 500);
    return () => clearTimeout(timeoutId);
  }, [paymentForm.amountPaid, tenantId]);

  // Helper functions for payment period handling based on tenant's start date
  const getQuarterPeriods = (tenantStartDate: string, numQuarters: number = 8) => {
    const startDate = new Date(tenantStartDate);
    const periods = [];
    
    for (let i = 0; i < numQuarters; i++) {
      const quarterStart = new Date(startDate);
      quarterStart.setMonth(startDate.getMonth() + (i * 3));
      
      const quarterEnd = new Date(startDate);
      quarterEnd.setMonth(startDate.getMonth() + ((i + 1) * 3) - 1);
      
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      periods.push({
        quarter: `Q${i + 1}`,
        startMonth: monthNames[quarterStart.getMonth()],
        endMonth: monthNames[quarterEnd.getMonth()],
        startYear: quarterStart.getFullYear(),
        endYear: quarterEnd.getFullYear(),
        display: `${monthNames[quarterStart.getMonth()]} ${quarterStart.getFullYear()} - ${monthNames[quarterEnd.getMonth()]} ${quarterEnd.getFullYear()}`,
        startDate: quarterStart,
        endDate: quarterEnd,
        value: `${quarterStart.getFullYear()}-Q${i + 1}`
      });
    }
    
    return periods;
  };

  const getAnnualPeriods = (tenantStartDate: string, numYears: number = 5) => {
    const startDate = new Date(tenantStartDate);
    const periods = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < numYears; i++) {
      const yearStart = new Date(startDate);
      yearStart.setFullYear(startDate.getFullYear() + i);
      
      const yearEnd = new Date(startDate);
      yearEnd.setFullYear(startDate.getFullYear() + i + 1);
      yearEnd.setMonth(yearEnd.getMonth() - 1);
      
      periods.push({
        year: yearStart.getFullYear(),
        display: `${monthNames[yearStart.getMonth()]} ${yearStart.getFullYear()} - ${monthNames[yearEnd.getMonth()]} ${yearEnd.getFullYear()}`,
        startDate: yearStart,
        endDate: yearEnd,
        value: yearStart.getFullYear().toString()
      });
    }
    
    return periods;
  };

  const getCurrentPeriod = (tenantStartDate: string, paymentPolicy: string) => {
    const now = new Date();
    const startDate = new Date(tenantStartDate);
    
    if (paymentPolicy === 'MONTHLY') {
      return now.toISOString().slice(0, 7); // YYYY-MM
    } else if (paymentPolicy === 'QUARTERLY') {
      const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + 
                        (now.getMonth() - startDate.getMonth());
      const quarterIndex = Math.floor(monthsDiff / 3);
      const yearOffset = Math.floor((startDate.getMonth() + quarterIndex * 3) / 12);
      const year = startDate.getFullYear() + yearOffset;
      return `${year}-Q${quarterIndex + 1}`;
    } else if (paymentPolicy === 'ANNUAL') {
      // Check if we're past the anniversary date this year
      const currentYearAnniversary = new Date(now.getFullYear(), startDate.getMonth(), startDate.getDate());
      const yearOffset = now >= currentYearAnniversary ? 0 : 1;
      return (now.getFullYear() - yearOffset).toString();
    }
    
    return '';
  };

  const fetchTenant = async () => {
    try {
      const data = await tenantsAPI.getById(tenantId);
      setTenant(data);
    } catch (error) {
      console.error('Error fetching tenant:', error);
      toast.error('Failed to load tenant details');
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    if (!canViewInvoices) return;
    
    try {
      setInvoicesLoading(true);
      const response = await invoicesAPI.getInvoicesByTenant(tenantId, {
        page: 1,
        limit: 1000,
      });
      setInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      toast.error('Failed to load invoices');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const fetchPaymentReports = async () => {
    if (!canViewPayments) return;
    
    try {
      setPaymentReportsLoading(true);
      const reports = await paymentsAPI.getPaymentsByTenant(tenantId);
      if (Array.isArray(reports)) {
        setPaymentReports(reports);
      } else {
        console.warn('Unexpected response from payments API:', reports);
        setPaymentReports([]);
      }
    } catch (error) {
      console.error('Error fetching payment reports:', error);
      toast.error('Failed to load payment reports');
      setPaymentReports([]);
    } finally {
      setPaymentReportsLoading(false);
    }
  };

  const fetchBillInvoices = async () => {
    if (!canViewBillInvoices) return;
    
    try {
      setBillInvoicesLoading(true);
      const response = await billInvoicesAPI.getByTenant(tenantId, {
        page: 1,
        limit: 1000,
      });
      setBillInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching bill invoices:', error);
    } finally {
      setBillInvoicesLoading(false);
    }
  };
  
  const fetchDemandLetters = async () => {
    if (!canViewDemandLetters) return;
    
    try {
      setDemandLettersLoading(true);
      const response = await demandLettersAPI.getAll({ tenantId });
      setDemandLetters(response.data || []);
    } catch (error) {
      console.error('Error fetching demand letters:', error);
      toast.error('Failed to load demand letters');
    } finally {
      setDemandLettersLoading(false);
    }
  };
  
  const handleViewOverdueInvoices = () => {
    if (!canViewOverdueInvoices) {
      toast.error('You do not have permission to view overdue invoices');
      return;
    }
    router.push(`/properties/${tenantId}/tenant-details/overdue-invoices`);
  };

  const fetchOutstandingInvoices = async () => {
    if (!tenantId || !canViewPayments) return;
    
    try {
      setLoadingOutstanding(true);
      const data = await paymentsAPI.getOutstandingInvoices(tenantId, true);
      setOutstandingInvoices(data.rentInvoices || []);
    } catch (error) {
      console.error('Error fetching outstanding invoices:', error);
      toast.error('Failed to load outstanding invoices');
    } finally {
      setLoadingOutstanding(false);
    }
  };

  // Fetch the tenant workspace data after the request helpers are available.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchTenant();
      if (canViewInvoices) void fetchInvoices();
      if (canViewBillInvoices) void fetchBillInvoices();
      if (canViewPayments) {
        void fetchPaymentReports();
        void fetchOutstandingInvoices();
      }
      if (canViewDemandLetters) void fetchDemandLetters();
    }, 0);

    return () => window.clearTimeout(timer);
    // The permission booleans and tenant id are the intended reload boundary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId, canViewInvoices, canViewBillInvoices, canViewPayments, canViewDemandLetters]);

  const calculatePaymentAmounts = () => {
    if (paymentPreview) {
      return {
        rent: paymentPreview.rent.amount,
        serviceCharge: paymentPreview.serviceCharge.inclusiveAmount || paymentPreview.serviceCharge.amount,
        vat: paymentPreview.vat.total,
        totalDue: paymentPreview.totalDue,
        monthlyEquivalent: paymentPreview.monthlyEquivalent
      };
    }

    if (!tenant) return { rent: 0, serviceCharge: 0, vat: 0, totalDue: 0, monthlyEquivalent: 0 };

    const monthlyRent = tenant.rent;
    let monthlyServiceCharge = 0;
    
    if (tenant.serviceCharge) {
      switch (tenant.serviceCharge.type) {
        case 'FIXED':
          monthlyServiceCharge = tenant.serviceCharge.fixedAmount || 0;
          break;
        case 'PERCENTAGE':
          monthlyServiceCharge = (monthlyRent * (tenant.serviceCharge.percentage || 0)) / 100;
          break;
        case 'PER_SQ_FT':
          monthlyServiceCharge = (tenant.unit?.sizeSqFt || 0) * (tenant.serviceCharge.perSqFtRate || 0);
          break;
      }
    }

    const monthlySubtotal = monthlyRent + monthlyServiceCharge;
    let monthlyVat = 0;
    
    if (tenant.vatType === 'INCLUSIVE' && tenant.vatRate) {
      monthlyVat = monthlySubtotal - (monthlySubtotal / (1 + tenant.vatRate / 100));
    } else if (tenant.vatType === 'EXCLUSIVE' && tenant.vatRate) {
      monthlyVat = (monthlySubtotal * tenant.vatRate) / 100;
    }

    const monthlyTotalDue = tenant.vatType === 'INCLUSIVE' ? monthlySubtotal : monthlySubtotal + monthlyVat;

    let multiplier = 1;
    switch (tenant.paymentPolicy) {
      case 'MONTHLY': multiplier = 1; break;
      case 'QUARTERLY': multiplier = 3; break;
      case 'ANNUAL': multiplier = 12; break;
    }

    const periodRent = monthlyRent * multiplier;
    const periodServiceCharge = monthlyServiceCharge * multiplier;
    const periodVat = monthlyVat * multiplier;
    const periodTotalDue = monthlyTotalDue * multiplier;

    return { 
      rent: periodRent,
      serviceCharge: periodServiceCharge, 
      vat: periodVat, 
      totalDue: periodTotalDue,
      monthlyEquivalent: monthlyTotalDue
    };
  };

  const calculateSelectedBalance = () => {
    const rentBalance = outstandingInvoices
      .filter(inv => selectedInvoiceIds.includes(inv.id))
      .reduce((sum, inv) => sum + inv.balance, 0);
    
    const billBalance = outstandingBillInvoices
      .filter(bi => selectedBillInvoiceIds.includes(bi.id))
      .reduce((sum, bi) => sum + bi.balance, 0);
    
    return { rentBalance, billBalance, total: rentBalance + billBalance };
  };

  const calculatePaymentStatus = (): { status: PaymentStatus; details: string } => {
    const amountPaid = parseFloat(paymentForm.amountPaid) || 0;
    const selectedBalance = calculateSelectedBalance().total;
    const monthlyTotal = totalDue;
    
    if (amountPaid === 0) {
      return { status: 'UNPAID', details: 'No payment amount entered' };
    }
    
    if (amountPaid > selectedBalance && selectedBalance > 0) {
      const excess = amountPaid - selectedBalance;
      return { 
        status: 'PAID', 
        details: `Full payment + Ksh ${excess.toLocaleString()} overpayment/excess` 
      };
    }
    
    if (amountPaid >= monthlyTotal) {
      return { 
        status: 'PAID', 
        details: amountPaid > monthlyTotal 
          ? `Full payment with Ksh ${(amountPaid - monthlyTotal).toLocaleString()} excess` 
          : 'Full payment' 
      };
    }
    
    if (amountPaid > 0 && amountPaid < monthlyTotal) {
      const percentage = ((amountPaid / monthlyTotal) * 100).toFixed(1);
      return { 
        status: 'PARTIAL', 
        details: `Partial payment (${percentage}% of monthly due)` 
      };
    }
    
    return { status: 'UNPAID', details: 'Payment amount insufficient' };
  };

  const handleCreatePayment = async () => {
    if (!paymentForm.paymentPeriod || !paymentForm.amountPaid) {
      toast.error('Please fill in the payment period and amount');
      return;
    }

    const amountPaid = parseFloat(paymentForm.amountPaid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    if (!canCreatePayments) {
      toast.error('You do not have permission to record payments');
      return;
    }

    try {
      setCreatingPayment(true);
      
      const paymentData: CreatePaymentReportRequest = {
        tenantId: tenantId!,
        amountPaid,
        notes: paymentForm.notes || undefined,
        paymentPeriod: paymentForm.paymentPeriod,
        invoiceIds: selectedInvoiceIds,
        createMissingInvoices,
        updateExistingInvoices,
        handleOverpayment: true
      };

      const response = await paymentsAPI.createPaymentReport(paymentData);
      
      setAllocatedInvoices(response.invoices);
      setOverpaymentDetails(response.overpayment || null);
      setShowPaymentAllocation(true);
      
      let successMessage = `Payment of Ksh ${amountPaid.toLocaleString()} recorded successfully!`;
      
      if (response.overpayment?.totalOverpayment) {
        successMessage += ` (Overpayment: Ksh ${response.overpayment.totalOverpayment.toLocaleString()})`;
      }
      
      if (response.commission) {
        successMessage += ` Commission: Ksh ${response.commission.commissionAmount.toLocaleString()}`;
      }
      
      toast.success(successMessage);
      
      setPaymentForm({
        paymentPeriod: '',
        datePaid: new Date().toISOString().split('T')[0],
        amountPaid: '',
        notes: '',
        status: 'PAID',
      });
      setSelectedInvoiceIds([]);
      setSelectedBillInvoiceIds([]);
      setShowInvoiceSelection(true);
      setCreateMissingInvoices(true);
      setAutoGenerateBalanceInvoice(true);
      setUpdateExistingInvoices(true);
      setPaymentPreview(null);
      
      fetchPaymentReports();
      fetchInvoices();
      fetchOutstandingInvoices();
      
    } catch (error) {
      console.error('Error creating payment report:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create payment report');
    } finally {
      setCreatingPayment(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!invoiceForm.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    if (!tenant) {
      toast.error('Tenant information not available');
      return;
    }

    if (!canCreateInvoices) {
      toast.error('You do not have permission to generate invoices');
      return;
    }

    try {
      setGenerating(true);
      toast.loading(`Generating ${tenant.paymentPolicy} invoice...`);
      
      await invoicesAPI.generateInvoice({
        tenantId,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes || `${tenant.paymentPolicy} rent invoice for ${tenant.fullName}`,
      });
      
      toast.dismiss();
      toast.success(`${tenant.paymentPolicy} invoice generated successfully!`);
      setShowInvoiceDialog(false);
      setInvoiceForm({ dueDate: '', notes: '' });
      fetchInvoices();
      fetchOutstandingInvoices();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.dismiss();
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateDemandLetter = async () => {
    if (!tenant) {
      toast.error('Tenant information not available');
      return;
    }

    if (!canCreateDemandLetters) {
      toast.error('You do not have permission to generate demand letters');
      return;
    }

    try {
      setGeneratingDemandLetter(true);
      toast.loading('Generating demand letter...');
      
      const demandLetter = await demandLettersAPI.autoGenerate(tenantId);
      
      toast.dismiss();
      toast.success(`Demand letter ${demandLetter.letterNumber} generated successfully!`);
      setShowDemandLetterDialog(false);
      setDemandLetterForm({ demandPeriod: '', notes: '' });
      fetchDemandLetters();
      
      if (demandLetter.documentUrl) {
        await demandLettersAPI.downloadPDF(demandLetter.id);
      }
    } catch (error) {
      console.error('Error generating demand letter:', error);
      toast.dismiss();
      toast.error(error instanceof Error ? error.message : 'Failed to generate demand letter');
    } finally {
      setGeneratingDemandLetter(false);
    }
  };

const { downloadAllPaymentReports } = useWhatsApp();

const handleDownloadPaymentReport = async () => {
  if (!tenant) return;

  if (!canDownloadPaymentReports) {
    toast.error('You do not have permission to download payment reports');
    return;
  }

  try {
    setGeneratingPDF(true);
    toast.loading('Generating payment report PDF...');
    const result = await downloadAllPaymentReports(tenant.id, tenant.fullName);
    toast.dismiss();
    if (result.success) {
      toast.success('Payment report downloaded successfully!');
    } else {
      toast.error(result.message || 'Failed to download payment report');
    }
  } catch (error) {
    console.error('Error downloading payment report:', error);
    toast.dismiss();
    toast.error('Failed to download payment report');
  } finally {
    setGeneratingPDF(false);
  }
};

  const handleDownloadBillPaymentReport = async () => {
    if (!tenant) return;
    
    if (!canDownloadBillInvoices) {
      toast.error('You do not have permission to download bill invoices');
      return;
    }

    try {
      setGeneratingBillPDF(true);
      toast.loading('Generating bill payment report PDF...');
      await generateBillInvoiceReportPDF(tenant, billInvoices);
      toast.dismiss();
      toast.success('Bill payment report downloaded successfully!');
    } catch (error) {
      console.error('Error generating bill payment report:', error);
      toast.dismiss();
      toast.error('Failed to generate bill payment report');
    } finally {
      setGeneratingBillPDF(false);
    }
  };

  const handleDownloadComprehensiveReport = async () => {
    if (!tenant) return;

    if (!canViewComprehensiveReport) {
      toast.error('You do not have permission to download comprehensive reports');
      return;
    }

    try {
      setGeneratingComprehensivePDF(true);
      toast.loading('Generating comprehensive report PDF...');
      
      const invoicesResponse = await invoicesAPI.getInvoicesByTenant(tenantId);
      
      await generateComprehensiveReportPDF(
        tenant, 
        paymentReports, 
        billInvoices,
        invoicesResponse.data
      );
      
      toast.dismiss();
      toast.success('Comprehensive report downloaded successfully!');
    } catch (error) {
      console.error('Error generating comprehensive report:', error);
      toast.dismiss();
      toast.error('Failed to generate comprehensive report');
    } finally {
      setGeneratingComprehensivePDF(false);
    }
  };

  const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNPAID':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentPolicyColor = (policy: PaymentPolicy) => {
    switch (policy) {
      case 'MONTHLY':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'QUARTERLY':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ANNUAL':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="text-center"
        >
          <div className="relative w-16 h-16 mx-auto mb-4">
            <motion.div
              className="absolute inset-0 border-4 border-primary/20 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div
              className="absolute inset-0 border-4 border-t-primary border-r-transparent border-b-transparent border-l-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
          <p className="text-lg font-medium text-gray-800">Loading tenant details...</p>
        </motion.div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-heading-color mb-2">Tenant Not Found</h2>
        <p className="text-gray-800 mb-6">The tenant you are looking for does not exist.</p>
        <Button onClick={() => router.push(tenantWorkspaceHref)}>Go Back</Button>
      </motion.div>
    );
  }

  const { totalDue } = calculatePaymentAmounts();
  const partialPaymentsCount = paymentReports.filter(p => p.status === 'PARTIAL' && p.arrears > 0).length;

  // ==============================================
  // ACTION BUTTONS CONFIGURATION
  // ==============================================
  interface ActionButtonConfig {
    id: string;
    label: string;
    icon: JSX.Element;
    onClick: () => void;
    variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'info';
    permission: boolean;
    badge?: number;
    badgeColor?: string;
    description?: string;
    group?: 'invoices' | 'payments' | 'bills' | 'demand' | 'reports';
  }

  const actionButtons: ActionButtonConfig[] = [
    // Invoices Group
    {
      id: 'generate-invoice',
      label: 'Generate Invoice',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => {
        if (tenant.paymentSummary?.nextPayment?.dueDate) {
          setInvoiceForm(previous => ({
            ...previous,
            dueDate: new Date(tenant.paymentSummary!.nextPayment.dueDate).toISOString().split('T')[0],
          }));
        }
        setShowInvoiceDialog(true);
      },
      variant: 'primary',
      permission: isAdmin || isManager || permissions.invoices.canCreate,
      description: 'Create new invoice',
      group: 'invoices'
    },
    {
      id: 'view-invoices',
      label: 'View Invoices',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => router.push(`/properties/${tenantId}/tenant-details/invoices`),
      variant: 'outline',
      permission: isAdmin || isManager || permissions.invoices.canView,
      badge: invoices.length,
      badgeColor: 'blue',
      description: `View all ${invoices.length} invoices`,
      group: 'invoices'
    },
    // Payments Group
    {
      id: 'record-payment',
      label: 'Record Payment',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => {
        if (!paymentForm.paymentPeriod) {
          const currentPeriod = getCurrentPeriod(tenant.rentStart || '', tenant.paymentPolicy);
          if (currentPeriod) setPaymentForm(previous => ({ ...previous, paymentPeriod: currentPeriod }));
        }
        setShowCreatePaymentDialog(true);
      },
      variant: 'success',
      permission: isAdmin || isManager || permissions.payments.canCreate,
      description: 'Record new payment',
      group: 'payments'
    },
    {
      id: 'payment-reports',
      label: 'Payment Reports',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => router.push(`/properties/${tenantId}/tenant-details/payment-reports`),
      variant: 'info',
      permission: isAdmin || isManager || permissions.payments.canView,
      badge: paymentReports.length,
      badgeColor: 'green',
      description: partialPaymentsCount > 0 
        ? `${partialPaymentsCount} partial payments` 
        : `View all ${paymentReports.length} reports`,
      group: 'payments'
    },
    // Bills Group
    {
      id: 'bill-invoices',
      label: 'Bill Invoices',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => router.push(`/properties/${tenantId}/tenant-details/bill-invoices`),
      variant: 'warning',
      permission: isAdmin || isManager || permissions.billInvoices.canView,
      badge: billInvoices.length,
      badgeColor: 'purple',
      description: `View all ${billInvoices.length} bill invoices`,
      group: 'bills'
    },
    {
      id: 'my-bills',
      label: 'My Bills',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      onClick: () => router.push(`/properties/${params.id}/tenant-details/bills`),
      variant: 'secondary',
      permission: true, // Available to all logged in users
      description: 'View your bills',
      group: 'bills'
    },
    // Demand Letters Group
    {
      id: 'demand-letter',
      label: 'Demand Letter',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      onClick: () => setShowDemandLetterDialog(true),
      variant: 'danger',
      permission: isAdmin || isManager || permissions.demandLetters.canCreate,
      description: 'Generate demand letter',
      group: 'demand'
    },
    {
      id: 'view-demand-letters',
      label: 'View Demand Letters',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => router.push(`/properties/${tenantId}/tenant-details/demand-letters`),
      variant: 'outline',
      permission: isAdmin || isManager || permissions.demandLetters.canView,
      badge: demandLetters.length,
      badgeColor: 'orange',
      description: `View all ${demandLetters.length} demand letters`,
      group: 'demand'
    },
    {
      id: 'overdue-invoices',
      label: 'Overdue Invoices',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.82 15.27A1 1 0 002.34 20h19.32a1 1 0 00.87-1.5L13.71 3.86a1 1 0 00-1.42 0z" />
        </svg>
      ),
      onClick: handleViewOverdueInvoices,
      variant: 'outline',
      permission: canViewOverdueInvoices,
      description: 'Review overdue rent invoices',
      group: 'demand'
    },
  ];

  // Filter buttons based on permissions
  const visibleButtons = actionButtons.filter(btn => btn.permission);
  const financialRecordIds = new Set([
    'view-invoices',
    'payment-reports',
    'bill-invoices',
    'my-bills',
    'view-demand-letters',
    'overdue-invoices',
  ]);
  const quickActionIds = new Set(['generate-invoice', 'record-payment', 'demand-letter']);
  const financialRecords = visibleButtons.filter(button => financialRecordIds.has(button.id));
  const quickActions = visibleButtons.filter(button => quickActionIds.has(button.id));

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      <PageHeader
        title={tenant.fullName}
        description={`${tenant.unit?.property?.name ?? 'Property'} · Unit ${tenant.unit?.unitNo ?? '—'}`}
        leading={
          <div className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-lg font-semibold text-primary" aria-hidden="true">
            {tenant.fullName.charAt(0).toUpperCase()}
          </div>
        }
        actions={
          <Button variant="outline" onClick={() => router.push(tenantWorkspaceHref)}>
            Back to tenants
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardDescription>Monthly rent</CardDescription><CardTitle className="text-xl" title={formatExactKes(tenant.rent ?? 0)}>{formatExactKes(tenant.rent ?? 0)}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Payment amount</CardDescription><CardTitle className="text-xl" title={formatExactKes(tenant.rentInfo?.paymentAmount ?? totalDue)}>{formatExactKes(tenant.rentInfo?.paymentAmount ?? totalDue)}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Security deposit</CardDescription><CardTitle className="text-xl" title={formatExactKes(tenant.deposit ?? 0)}>{formatExactKes(tenant.deposit ?? 0)}</CardTitle></CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardDescription>Payment policy</CardDescription><CardTitle className="text-xl"><Badge variant="info">{tenant.paymentPolicy}</Badge></CardTitle></CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial records</CardTitle>
          <CardDescription>Review invoices, payments, bills and collection documents.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="divide-y divide-border rounded-md border border-border">
            {financialRecords.map((record) => (
              <button
                type="button"
                key={record.id}
                onClick={record.onClick}
                className="group flex w-full items-center gap-3 px-4 py-3 text-left transition-colors first:rounded-t-md last:rounded-b-md hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground" aria-hidden="true">{record.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground">{record.label}</span>
                  {record.description && <span className="mt-0.5 block text-xs text-muted-foreground">{record.description}</span>}
                </span>
                {record.badge !== undefined && <Badge variant="neutral">{record.badge}</Badge>}
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Create an invoice, record a payment or generate a demand letter.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {quickActions.map((action, index) => (
              <Button
                key={action.id}
                variant={index === 0 ? 'default' : 'outline'}
                className="justify-start sm:justify-center"
                onClick={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal information</CardTitle><CardDescription>Contact and account identifiers.</CardDescription></CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Full name">{tenant.fullName}</DetailItem>
              <DetailItem label="Contact">{tenant.contact || '—'}</DetailItem>
              <DetailItem label="Email">{tenant.email || '—'}</DetailItem>
              <DetailItem label="KRA PIN">{tenant.KRAPin || '—'}</DetailItem>
              <DetailItem label="P.O. Box">{tenant.POBox || '—'}</DetailItem>
              <DetailItem label="Status"><Badge variant={tenant.status === 'ACTIVE' ? 'success' : 'neutral'}>{tenant.status}</Badge></DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Lease information</CardTitle><CardDescription>Lease dates, escalation and billing terms.</CardDescription></CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Lease term">{tenant.leaseTerm || '—'}</DetailItem>
              <DetailItem label="Term start">{tenant.termStart ? new Date(tenant.termStart).toLocaleDateString() : '—'}</DetailItem>
              <DetailItem label="Rent start">{tenant.rentStart ? new Date(tenant.rentStart).toLocaleDateString() : '—'}</DetailItem>
              <DetailItem label="Escalation">{tenant.escalationRate ? `${tenant.escalationRate}% ${tenant.escalationFrequency ? `· ${tenant.escalationFrequency.replace('_', ' ').toLowerCase()}` : ''}` : 'None'}</DetailItem>
              <DetailItem label="Service charge">
                {tenant.serviceCharge?.type === 'FIXED' && formatExactKes(tenant.serviceCharge.fixedAmount ?? 0)}
                {tenant.serviceCharge?.type === 'PERCENTAGE' && `${tenant.serviceCharge.percentage ?? 0}%`}
                {tenant.serviceCharge?.type === 'PER_SQ_FT' && `${formatExactKes(tenant.serviceCharge.perSqFtRate ?? 0)} per sq ft`}
                {!tenant.serviceCharge && '—'}
              </DetailItem>
              <DetailItem label="VAT">{tenant.vatRate ? `${tenant.vatRate}% · ${tenant.vatType}` : tenant.vatType}</DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Payment position</CardTitle><CardDescription>Current period and next expected payment.</CardDescription></CardHeader>
          <CardContent>
            <DetailList>
              <DetailItem label="Status"><Badge variant={tenant.paymentSummary?.status === 'UP_TO_DATE' ? 'success' : tenant.paymentSummary?.status === 'OVERDUE' ? 'destructive' : 'warning'}>{tenant.paymentSummary?.status?.replaceAll('_', ' ') ?? 'Unavailable'}</Badge></DetailItem>
              <DetailItem label="Next due">{tenant.paymentSummary?.nextPayment?.dueDate ? new Date(tenant.paymentSummary.nextPayment.dueDate).toLocaleDateString() : '—'}</DetailItem>
              <DetailItem label="Next amount">{formatExactKes(tenant.paymentSummary?.nextPayment?.amount ?? totalDue)}</DetailItem>
              <DetailItem label="Outstanding">{formatExactKes(tenant.paymentSummary?.paymentHistory?.outstandingBalance ?? 0)}</DetailItem>
              <DetailItem label="Current period">{tenant.paymentSummary?.currentPeriod ? `${new Date(tenant.paymentSummary.currentPeriod.periodStart).toLocaleDateString()} – ${new Date(tenant.paymentSummary.currentPeriod.periodEnd).toLocaleDateString()}` : '—'}</DetailItem>
            </DetailList>
          </CardContent>
        </Card>

        {tenant.unit && (
          <Card>
            <CardHeader><CardTitle>Unit information</CardTitle><CardDescription>The unit assigned to this tenant.</CardDescription></CardHeader>
            <CardContent>
              <DetailList>
                <DetailItem label="Unit number">{tenant.unit.unitNo || '—'}</DetailItem>
                <DetailItem label="Unit type">{tenant.unit.unitType || '—'}</DetailItem>
                <DetailItem label="Floor">{tenant.unit.floor || '—'}</DetailItem>
                <DetailItem label="Size">{tenant.unit.sizeSqFt ? `${tenant.unit.sizeSqFt.toLocaleString()} sq ft` : '—'}</DetailItem>
                <DetailItem label="Bedrooms">{tenant.unit.bedrooms ?? '—'}</DetailItem>
                <DetailItem label="Bathrooms">{tenant.unit.bathrooms ?? '—'}</DetailItem>
              </DetailList>
            </CardContent>
          </Card>
        )}
      </div>

      {(canDownloadPaymentReports || canDownloadBillInvoices || canViewComprehensiveReport) && (
        <Card>
          <CardHeader><CardTitle>Reports</CardTitle><CardDescription>Download the existing tenant financial reports.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {canDownloadPaymentReports && <Button variant="outline" disabled={generatingPDF} onClick={handleDownloadPaymentReport}>Payment report</Button>}
            {canDownloadBillInvoices && <Button variant="outline" disabled={generatingBillPDF} onClick={handleDownloadBillPaymentReport}>Bill payment report</Button>}
            {canViewComprehensiveReport && <Button variant="outline" disabled={generatingComprehensivePDF} onClick={handleDownloadComprehensiveReport}>Comprehensive report</Button>}
          </CardContent>
        </Card>
      )}

      <AttachmentSection
        tenantId={tenantId}
        isAdmin={isAdmin}
        isManager={isManager}
        canEdit={canCreateInvoices || canCreatePayments}
        canDelete={isAdmin || isManager}
      />

      {/* Generate Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
            <DialogTitle>Generate Invoice</DialogTitle>
            <DialogDescription>
              Create a {tenant.paymentPolicy.toLowerCase()} invoice for {tenant.fullName}
              {tenant.unit?.unitNo ? ` · Unit ${tenant.unit.unitNo}` : ''}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <section className="space-y-3 rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="invoice-context-heading">
                <div>
                  <h3 id="invoice-context-heading" className="text-sm font-semibold text-foreground">Invoice context</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">The invoice continues to use the tenant billing policy and existing backend calculation.</p>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
                  <span className="text-sm text-muted-foreground">Payment policy</span>
                  <Badge variant="info">{tenant.paymentPolicy}</Badge>
                </div>
                {tenant.paymentSummary?.nextPayment && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <p className="text-xs font-medium text-muted-foreground">Next payment due</p>
                    <p className="text-sm font-semibold text-foreground">{formatDateToOrdinal(tenant.paymentSummary.nextPayment.dueDate)}</p>
                    <p className="text-xs text-muted-foreground">{tenant.paymentSummary.nextPayment.timeRemaining?.formatted || 'Due soon'}</p>
                  </div>
                )}
              </section>

              <section className="space-y-5" aria-labelledby="invoice-details-heading">
                <div>
                  <h3 id="invoice-details-heading" className="text-sm font-semibold text-foreground">Invoice details</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Confirm the due date and add any information that should appear with this invoice.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date <span className="text-destructive">*</span></Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={invoiceForm.dueDate}
                    onChange={(event) => setInvoiceForm({ ...invoiceForm, dueDate: event.target.value })}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">The next payment due date is used as the existing default.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder={`Add any additional notes (e.g., ${tenant.paymentPolicy} rent for ${new Date(tenant.paymentSummary?.nextPayment?.dueDate || new Date()).toLocaleDateString('default', { month: 'long', year: 'numeric' })})`}
                    value={invoiceForm.notes}
                    onChange={(event) => setInvoiceForm({ ...invoiceForm, notes: event.target.value })}
                    className="min-h-28"
                  />
                </div>
              </section>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <Button variant="outline" onClick={() => setShowInvoiceDialog(false)} disabled={generating}>Cancel</Button>
            <Button onClick={handleGenerateInvoice} disabled={generating || !invoiceForm.dueDate} loading={generating}>
              {generating ? 'Generating…' : 'Generate Invoice'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
        <DialogContent className="flex h-[min(90dvh,900px)] w-[calc(100vw-2rem)] max-w-6xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-5 py-4 sm:px-6">
              <DialogTitle>Record Payment</DialogTitle>
              <DialogDescription>
                Record a new payment for {tenant.fullName}{tenant.unit?.unitNo ? ` · Unit ${tenant.unit.unitNo}` : ''}
                {paymentPreview?.existingCredit ? (
                  <span className="ml-2 inline-flex rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    Credit Available: Ksh {paymentPreview.existingCredit.toLocaleString()}
                  </span>
                ) : null}
              </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(20rem,2fr)] lg:items-start">
              <div className="min-w-0 space-y-4">
              {/* Payment Preview Section */}
              {paymentPreview && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    Payment Preview ({tenant.paymentPolicy})
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                    {/* Rent Card */}
                    <div className="rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground font-medium text-xs">
                        {tenant.paymentPolicy === 'MONTHLY' && 'Monthly Rent'}
                        {tenant.paymentPolicy === 'QUARTERLY' && 'Quarterly Rent'}
                        {tenant.paymentPolicy === 'ANNUAL' && 'Annual Rent'}
                      </p>
                      <p className="text-foreground font-bold text-base">Ksh {paymentPreview.rent.amount.toLocaleString()}</p>
                      {paymentPreview.rent.vatType !== 'NOT_APPLICABLE' && (
                        <div className="mt-1">
                          <p className="text-xs text-muted-foreground">
                            {paymentPreview.rent.vatType} ({paymentPreview.rent.vatRate}%)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            VAT: Ksh {paymentPreview.rent.vatAmount.toLocaleString()}
                          </p>
                        </div>
                      )}
                      {tenant.paymentPolicy !== 'MONTHLY' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          (Ksh {tenant.rent?.toLocaleString()}/month)
                        </p>
                      )}
                    </div>

                    {/* Service Charge Card */}
                    <div className="rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground font-medium text-xs">Service Charge</p>
                      {paymentPreview.serviceCharge.hasVat ? (
                        <>
                          <p className="text-foreground font-bold text-base">
                            Ksh {paymentPreview.serviceCharge.inclusiveAmount.toLocaleString()}
                          </p>
                          <div className="mt-1">
                            <p className="text-xs text-muted-foreground">
                              {paymentPreview.serviceCharge.vatType} ({paymentPreview.serviceCharge.vatRate}%)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              VAT: Ksh {paymentPreview.serviceCharge.vatAmount.toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Excl. VAT: Ksh {paymentPreview.serviceCharge.exclusiveAmount.toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-foreground font-bold text-base">
                          Ksh {paymentPreview.serviceCharge.amount.toLocaleString()}
                        </p>
                      )}
                      {paymentPreview.serviceCharge.type === 'PERCENTAGE' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {paymentPreview.serviceCharge.percentage}% of rent
                        </p>
                      )}
                      {paymentPreview.serviceCharge.type === 'FIXED' && (
                        <p className="text-xs text-muted-foreground mt-1">Fixed amount</p>
                      )}
                      {paymentPreview.serviceCharge.type === 'PER_SQ_FT' && (
                        <p className="text-xs text-muted-foreground mt-1">Per sq ft</p>
                      )}
                    </div>

                    {/* VAT Breakdown Card */}
                    <div className="rounded-md border border-border bg-muted/20 p-3">
                      <p className="text-muted-foreground font-medium text-xs">VAT Breakdown</p>
                      <div className="space-y-1 mt-1">
                        {paymentPreview.vat.rent.hasVat && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">Rent VAT:</span>
                            <span className="font-semibold text-foreground">
                              Ksh {paymentPreview.vat.rent.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {paymentPreview.vat.serviceCharge.hasVat && (
                          <div className="flex justify-between text-xs">
                            <span className="text-muted-foreground">SC VAT:</span>
                            <span className="font-semibold text-foreground">
                              Ksh {paymentPreview.vat.serviceCharge.amount.toLocaleString()}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-bold border-t pt-1 mt-1">
                          <span className="text-muted-foreground">Total VAT:</span>
                          <span className="text-primary">Ksh {paymentPreview.vat.total.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Total Due Card */}
                    <div className="rounded-md border border-primary/20 bg-primary/10 p-3">
                      <p className="text-primary font-medium text-xs">
                        Total {tenant.paymentPolicy === 'MONTHLY' ? 'Monthly' : tenant.paymentPolicy === 'QUARTERLY' ? 'Quarterly' : 'Annual'} Due
                      </p>
                      <p className="text-primary font-bold text-lg">Ksh {paymentPreview.totalDue.toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Credit Information */}
                  {paymentPreview.existingCredit > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="rounded-md border border-success/20 bg-success/10 p-2">
                        <p className="text-xs font-medium text-success">Credit Available</p>
                        <p className="font-bold text-success">Ksh {paymentPreview.existingCredit.toLocaleString()}</p>
                      </div>
                      <div className="rounded-md border border-success/20 bg-success/10 p-2">
                        <p className="text-xs font-medium text-success">Net Due After Credit</p>
                        <p className="font-bold text-success">Ksh {paymentPreview.netDueAfterCredit.toLocaleString()}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Outstanding Invoices Section */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-foreground">Outstanding Invoices</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowInvoiceSelection(!showInvoiceSelection)}
                    className="text-sm"
                  >
                    {showInvoiceSelection ? 'Hide' : 'Show'}
                  </Button>
                </div>
                
                {showInvoiceSelection && (
                  <>
                    {loadingOutstanding ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      </div>
                    ) : (
                      <>
                        {(selectedInvoiceIds.length > 0 || selectedBillInvoiceIds.length > 0) && (
                          <div className="mb-4 rounded-md border border-border bg-muted/20 p-3">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span className="font-semibold text-foreground">
                                Selected: {selectedInvoiceIds.length + selectedBillInvoiceIds.length} invoice(s)
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoiceIds([]);
                                  setSelectedBillInvoiceIds([]);
                                }}
                                className="text-xs text-primary hover:text-primary hover:bg-muted"
                              >
                                Clear All
                              </Button>
                            </div>
                            <div className="space-y-1 text-xs">
                              {calculateSelectedBalance().rentBalance > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Rent Balance:</span>
                                  <span className="font-semibold text-red-600">Ksh {calculateSelectedBalance().rentBalance.toLocaleString()}</span>
                                </div>
                              )}
                              {calculateSelectedBalance().billBalance > 0 && (
                                <div className="flex justify-between text-muted-foreground">
                                  <span>Bill Balance:</span>
                                  <span className="font-semibold text-red-600">Ksh {calculateSelectedBalance().billBalance.toLocaleString()}</span>
                                </div>
                              )}
                              <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                                <span className="text-foreground">Total Selected Balance:</span>
                                <span className="text-red-700">Ksh {calculateSelectedBalance().total.toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {outstandingInvoices.length > 0 && (
                          <div className="mb-4">
                            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                              <span className="size-2 rounded-full bg-primary"></span>
                              Rent Invoices ({outstandingInvoices.length})
                            </h4>
                            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                              {outstandingInvoices.map((invoice) => (
                                <motion.label
                                  key={invoice.id}
                                  whileHover={{ scale: 1.01 }}
                                  className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors ${
                                    selectedInvoiceIds.includes(invoice.id)
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border bg-background hover:bg-muted/40'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedInvoiceIds.includes(invoice.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedInvoiceIds([...selectedInvoiceIds, invoice.id]);
                                      } else {
                                        setSelectedInvoiceIds(selectedInvoiceIds.filter(id => id !== invoice.id));
                                      }
                                    }}
                                    className="mt-1 size-4 rounded border-border text-primary focus:ring-ring"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                                      <span className="font-semibold text-sm text-foreground truncate">
                                        {invoice.invoiceNumber}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentPolicyColor(invoice.paymentPolicy)}`}>
                                          {invoice.paymentPolicy}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                          {invoice.status}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                      <div>
                                        <span className="font-medium">Period:</span> {invoice.paymentPeriod}
                                      </div>
                                      <div>
                                        <span className="font-medium">Due:</span> {new Date(invoice.dueDate).toLocaleDateString()}
                                      </div>
                                      <div>
                                        <span className="font-medium">Total:</span> Ksh {invoice.totalDue.toLocaleString()}
                                      </div>
                                      <div>
                                        <span className="font-medium">Balance:</span>{' '}
                                        <span className="text-red-600 font-bold">
                                          Ksh {invoice.balance.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </motion.label>
                              ))}
                            </div>
                          </div>
                        )}

                        {outstandingInvoices.length === 0 && outstandingBillInvoices.length === 0 && (
                          <div className="rounded-md border border-dashed border-border bg-muted/20 px-4 py-8 text-center">
                            <p className="text-sm font-medium text-foreground">No outstanding invoices</p>
                            <p className="mt-1 text-xs text-muted-foreground">There are no invoice balances available for selection.</p>
                          </div>
                        )}

                        {selectedInvoiceIds.length === 0 && selectedBillInvoiceIds.length === 0 && 
                        (outstandingInvoices.length > 0 || outstandingBillInvoices.length > 0) && (
                          <div className="mt-4 rounded-md border border-border bg-muted/30 p-3">
                            <div className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-muted-foreground">
                                <strong>Auto-Allocation Mode:</strong> Payment will be automatically applied to the oldest outstanding invoices first (FIFO).
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              </div>
              <div className="min-w-0 space-y-4">
              {/* Payment Policy Header */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-1">Payment Policy</h3>
                    <p className="text-2xl font-bold text-foreground">
                      {tenant.paymentPolicy === 'MONTHLY' && 'Monthly Payment'}
                      {tenant.paymentPolicy === 'QUARTERLY' && 'Quarterly Payment'}
                      {tenant.paymentPolicy === 'ANNUAL' && 'Annual Payment'}
                    </p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                    {tenant.paymentPolicy}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {tenant.paymentPolicy === 'MONTHLY' && 'Payment due every month'}
                  {tenant.paymentPolicy === 'QUARTERLY' && 'Payment due every 3 months'}
                  {tenant.paymentPolicy === 'ANNUAL' && 'Payment due once per year'}
                </p>
                {tenant.rentStart && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Rent start date: {new Date(tenant.rentStart).toLocaleDateString()}
                  </p>
                )}
              </div>

              {/* Payment Options Section */}
              <div className="rounded-lg border border-border bg-card p-4">
                <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Payment Options
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3">
                    <div>
                      <Label htmlFor="createMissingInvoices" className="text-sm font-semibold text-foreground">
                        Create Missing Invoice
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Automatically create an invoice if none exists for the period
                      </p>
                    </div>
                    <Switch
                      id="createMissingInvoices"
                      checked={createMissingInvoices}
                      onCheckedChange={setCreateMissingInvoices}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3">
                    <div>
                      <Label htmlFor="autoGenerateBalanceInvoice" className="text-sm font-semibold text-foreground">
                        Generate Balance Invoice
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Create a new invoice for remaining balance if payment is partial
                      </p>
                    </div>
                    <Switch
                      id="autoGenerateBalanceInvoice"
                      checked={autoGenerateBalanceInvoice}
                      onCheckedChange={setAutoGenerateBalanceInvoice}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between gap-4 rounded-md border border-border bg-muted/20 p-3">
                    <div>
                      <Label htmlFor="updateExistingInvoices" className="text-sm font-semibold text-foreground">
                        Update Existing Invoices
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        Apply payment to existing unpaid invoices for the same period
                      </p>
                    </div>
                    <Switch
                      id="updateExistingInvoices"
                      checked={updateExistingInvoices}
                      onCheckedChange={setUpdateExistingInvoices}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Form Fields - DYNAMIC BASED ON PAYMENT POLICY */}
              <div className="space-y-5 rounded-lg border border-border bg-card p-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Payment entry</h3>
                  <p className="mt-1 text-xs text-muted-foreground">Select the payment period, enter the received amount and add any supporting notes.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentPeriod" className="text-sm font-semibold text-foreground">
                    Payment Period <span className="text-red-500">*</span>
                  </Label>
                  
                  {/* Current Period Indicator */}
                  {tenant.rentStart && (
                    <div className="p-3 bg-success/10 border border-success/20 rounded-lg mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                        <p className="text-sm text-success">
                          <span className="font-semibold">Current {tenant.paymentPolicy} Period:</span>{' '}
                          {tenant.paymentPolicy === 'MONTHLY' && new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          {tenant.paymentPolicy === 'QUARTERLY' && getQuarterPeriods(tenant.rentStart, 1)[0]?.display}
                          {tenant.paymentPolicy === 'ANNUAL' && getAnnualPeriods(tenant.rentStart, 1)[0]?.display}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Monthly - Month picker */}
                  {tenant.paymentPolicy === 'MONTHLY' && (
                    <div>
                      <Input
                        id="paymentPeriod"
                        type="month"
                        value={paymentForm.paymentPeriod}
                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriod: e.target.value })}
                        className="w-full text-foreground"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Select the month for this payment
                      </p>
                    </div>
                  )}
                  
                  {/* Quarterly - Quarter selection based on tenant's start date */}
                  {tenant.paymentPolicy === 'QUARTERLY' && tenant.rentStart && (
                    <div>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Year
                          </Label>
                          <select
                            value={paymentForm.paymentPeriod ? paymentForm.paymentPeriod.split('-')[0] : ''}
                            onChange={(e) => {
                              const year = e.target.value;
                              const currentQuarter = paymentForm.paymentPeriod?.split('-')[1] || 'Q1';
                              setPaymentForm({ ...paymentForm, paymentPeriod: `${year}-${currentQuarter}` });
                            }}
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {getQuarterPeriods(tenant.rentStart, 8).map((period, index) => (
                              <option key={index} value={period.startYear}>
                                {period.startYear} ({period.display})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">
                            Quarter
                          </Label>
                          <select
                            value={paymentForm.paymentPeriod?.split('-')[1] || 'Q1'}
                            onChange={(e) => {
                              const quarter = e.target.value;
                              const currentYear = paymentForm.paymentPeriod?.split('-')[0] || new Date().getFullYear().toString();
                              setPaymentForm({ ...paymentForm, paymentPeriod: `${currentYear}-${quarter}` });
                            }}
                            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {getQuarterPeriods(tenant.rentStart, 8).map((period, index) => (
                              <option key={index} value={period.quarter}>
                                {period.quarter} ({period.display})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Quick quarter buttons based on tenant's start date */}
                      <div className="flex gap-2 flex-wrap">
                        {getQuarterPeriods(tenant.rentStart, 4).map((period, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setPaymentForm({ ...paymentForm, paymentPeriod: period.value })}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                              paymentForm.paymentPeriod === period.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:bg-muted'
                            }`}
                          >
                            {period.quarter} ({period.display})
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Quarters are calculated from rent start date: {new Date(tenant.rentStart).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  
                  {/* Annual - Year selection based on tenant's start date */}
                  {tenant.paymentPolicy === 'ANNUAL' && tenant.rentStart && (
                    <div>
                      <div>
                        <Label className="text-xs text-muted-foreground">
                          Year
                        </Label>
                        <select
                          value={paymentForm.paymentPeriod}
                          onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriod: e.target.value })}
                          className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          {getAnnualPeriods(tenant.rentStart, 5).map((period, index) => (
                            <option key={index} value={period.value}>
                              {period.display}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Quick year buttons based on tenant's start date */}
                      <div className="flex gap-2 flex-wrap mt-3">
                        {getAnnualPeriods(tenant.rentStart, 5).map((period, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => setPaymentForm({ ...paymentForm, paymentPeriod: period.value })}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${
                              paymentForm.paymentPeriod === period.value
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-background text-foreground hover:bg-muted'
                            }`}
                          >
                            {period.display}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Years are calculated from rent start date: {new Date(tenant.rentStart).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountPaid" className="text-sm font-semibold text-foreground">
                    Amount Paid <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">Ksh</span>
                    <Input
                      id="amountPaid"
                      type="number"
                      placeholder={`Enter amount (${tenant.paymentPolicy === 'MONTHLY' ? 'monthly' : tenant.paymentPolicy === 'QUARTERLY' ? 'quarterly' : 'annual'} payment)`}
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      className="w-full text-foreground pl-12 text-lg font-semibold"
                      required
                    />
                  </div>
                  
                  {paymentForm.amountPaid && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 p-3 bg-muted/30 rounded-lg border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Payment Status:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          calculatePaymentStatus().status === 'PAID' 
                            ? 'bg-green-100 text-success border border-green-300'
                            : calculatePaymentStatus().status === 'PARTIAL'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {calculatePaymentStatus().status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{calculatePaymentStatus().details}</p>
                      
                      {parseFloat(paymentForm.amountPaid) > 0 && parseFloat(paymentForm.amountPaid) < totalDue && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Payment Progress</span>
                            <span>{((parseFloat(paymentForm.amountPaid) / totalDue) * 100).toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div 
                              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${Math.min((parseFloat(paymentForm.amountPaid) / totalDue) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                      
                      {parseFloat(paymentForm.amountPaid) > totalDue && (
                        <div className="rounded border border-warning/20 bg-warning/10 p-2 text-xs text-warning">
                          <span className="font-semibold">⚠️ Overpayment:</span> Excess of Ksh {(parseFloat(paymentForm.amountPaid) - totalDue).toLocaleString()} will be handled according to your overpayment settings.
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNotes" className="text-sm font-semibold text-foreground">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="paymentNotes"
                    placeholder={`Add any additional notes about this ${tenant.paymentPolicy === 'MONTHLY' ? 'monthly' : tenant.paymentPolicy === 'QUARTERLY' ? 'quarterly' : 'annual'} payment...`}
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="min-h-20 text-foreground"
                  />
                </div>
              </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 border-t border-border bg-muted/20 px-5 py-4 sm:px-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePaymentDialog(false);
                setSelectedInvoiceIds([]);
                setSelectedBillInvoiceIds([]);
                setPaymentPreview(null);
              }}
              disabled={creatingPayment}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={creatingPayment || !paymentForm.paymentPeriod || !paymentForm.amountPaid}
              loading={creatingPayment}
              className="min-w-24"
            >
              {creatingPayment
                ? 'Processing…'
                : `Record ${tenant.paymentPolicy === 'MONTHLY' ? 'Monthly' : tenant.paymentPolicy === 'QUARTERLY' ? 'Quarterly' : 'Annual'} Payment`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Allocation Result Dialog */}
      <Dialog open={showPaymentAllocation} onOpenChange={setShowPaymentAllocation}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Payment Allocation Details</DialogTitle>
            <DialogDescription>
              Detailed breakdown of how your payment was allocated
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {allocatedInvoices.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Invoices Paid/Updated</h3>
                <div className="space-y-2">
                  {allocatedInvoices.map((inv) => (
                    <div key={inv.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-900">{inv.invoiceNumber}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          inv.newStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                          inv.newStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {inv.newStatus}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Previous Balance</p>
                          <p className="font-semibold">Ksh {(inv.previousBalance ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Payment Applied</p>
                          <p className="font-semibold text-green-600">Ksh {(inv.paymentApplied ?? 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">New Balance</p>
                          <p className="font-semibold text-red-600">Ksh {inv.newBalance.toLocaleString()}</p>
                        </div>
                      </div>
                      {inv.selectionType && (
                        <div className="mt-2 text-xs text-gray-500">
                          Allocation Method: {inv.selectionType.replace(/_/g, ' ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {overpaymentDetails && overpaymentDetails.totalOverpayment > 0 && (
              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-200">
                <h3 className="text-lg font-semibold text-amber-900 mb-3">Overpayment Handling</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-800">Total Overpayment:</span>
                    <span className="font-bold text-amber-900">Ksh {overpaymentDetails.totalOverpayment.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-800">Applied to Current Period:</span>
                    <span className="font-semibold text-amber-900">Ksh {overpaymentDetails.currentPeriodPayment.toLocaleString()}</span>
                  </div>
                  
                  {overpaymentDetails.allocations.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-semibold text-amber-800 mb-2">Allocations:</p>
                      <div className="space-y-2">
                        {overpaymentDetails.allocations.map((alloc, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border border-amber-200 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-700">{alloc.type.replace(/_/g, ' ')}</span>
                              <span className="font-semibold">Ksh {(alloc.amountCovered ?? alloc.amount ?? 0).toLocaleString()}</span>
                            </div>
                            {alloc.period && <div className="text-xs text-gray-500">Period: {alloc.period}</div>}
                            {alloc.invoiceNumber && <div className="text-xs text-gray-500">Invoice: {alloc.invoiceNumber}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowPaymentAllocation(false)} className="bg-blue-600 hover:bg-blue-700">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demand Letter Generation Dialog */}
      <Dialog open={showDemandLetterDialog} onOpenChange={setShowDemandLetterDialog}>
        <DialogContent className="flex max-h-[90dvh] w-[calc(100vw-2rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 px-5 py-4 sm:px-6">
            <DialogTitle>Generate Demand Letter</DialogTitle>
            <DialogDescription>
              Create a demand letter for {tenant.fullName}
              {tenant.unit?.unitNo ? ` · Unit ${tenant.unit.unitNo}` : ''} using the existing overdue invoice calculation.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
              <div className="min-w-0 space-y-4">
                <section className="rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="demand-generation-heading">
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-warning/10 text-warning" aria-hidden="true">
                      <svg className="size-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <h3 id="demand-generation-heading" className="text-sm font-semibold text-foreground">Automatic generation</h3>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        The system will fetch this tenant&apos;s overdue invoices and calculate the total outstanding amount automatically.
                      </p>
                      {(isAdmin || isManager || permissions.demandLetters.canView) && (
                        <Button
                          onClick={handleViewOverdueInvoices}
                          variant="link"
                          size="sm"
                          disabled={loadingOutstanding}
                          loading={loadingOutstanding}
                          className="mt-3"
                        >
                          View overdue invoices
                        </Button>
                      )}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-border p-4" aria-labelledby="demand-contents-heading">
                  <h3 id="demand-contents-heading" className="text-sm font-semibold text-foreground">Letter contents</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {[
                      'All overdue invoices with dates and amounts',
                      'Total outstanding balance',
                      'Tenant and property information',
                      'Payment instructions and deadline',
                      'Legal notice and consequences',
                    ].map((item) => (
                      <li key={item} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              <div className="min-w-0 space-y-4">
                <section className="space-y-2" aria-labelledby="demand-notes-heading">
                  <div>
                    <h3 id="demand-notes-heading" className="text-sm font-semibold text-foreground">Additional notes</h3>
                    <p className="mt-1 text-xs text-muted-foreground">Add optional instructions or details to incorporate into the letter.</p>
                  </div>
                  <Label htmlFor="demand-notes" className="sr-only">Additional notes</Label>
                  <Textarea
                    id="demand-notes"
                    placeholder="For example: Include a 14-day payment deadline or mention a previous payment arrangement."
                    value={demandLetterForm.notes}
                    onChange={(event) => setDemandLetterForm({ ...demandLetterForm, notes: event.target.value })}
                    className="min-h-40 resize-y"
                  />
                  <p className="text-xs text-muted-foreground">These notes will be incorporated into the demand letter content.</p>
                </section>

                <section className="rounded-lg border border-border bg-muted/20 p-4" aria-labelledby="demand-reminders-heading">
                  <h3 id="demand-reminders-heading" className="text-sm font-semibold text-foreground">Before you generate</h3>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    <li>The demand letter will be saved to the tenant documents.</li>
                    <li>A notification will be sent to the tenant.</li>
                    <li>You can preview the letter before finalizing.</li>
                    <li>The letter will use the current date.</li>
                  </ul>
                </section>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 px-5 py-4 sm:px-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowDemandLetterDialog(false);
                setDemandLetterForm({ demandPeriod: '', notes: '' });
              }}
              disabled={generatingDemandLetter}
            >
              Cancel
            </Button>
            {(isAdmin || isManager || permissions.demandLetters.canCreate) && (
              <Button
                onClick={handleGenerateDemandLetter}
                disabled={generatingDemandLetter}
                variant="destructive"
                loading={generatingDemandLetter}
              >
                {generatingDemandLetter ? 'Generating…' : 'Generate Demand Letter'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </motion.div>
  );
}
