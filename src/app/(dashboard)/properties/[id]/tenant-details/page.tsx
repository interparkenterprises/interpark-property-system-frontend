'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Tenant, Invoice, InvoiceStatus, PaymentReport, PaymentStatus, BillInvoice, PaymentPolicy, DemandLetter, DemandLetterStatus, CreatePaymentReportRequest } from '@/types';
import { tenantsAPI, invoicesAPI, paymentsAPI, billInvoicesAPI, demandLettersAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';
import { generatePaymentReportPDF, generateBillInvoiceReportPDF, generateComprehensiveReportPDF } from '@/lib/pdfGenerator';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentReports, setPaymentReports] = useState<PaymentReport[]>([]);
  const [billInvoices, setBillInvoices] = useState<BillInvoice[]>([]);
  const [demandLetters, setDemandLetters] = useState<DemandLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [paymentReportsLoading, setPaymentReportsLoading] = useState(false);
  const [billInvoicesLoading, setBillInvoicesLoading] = useState(false);
  const [demandLettersLoading, setDemandLettersLoading] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showInvoicesList, setShowInvoicesList] = useState(false);
  const [showPaymentReportsDialog, setShowPaymentReportsDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showBillInvoicesDialog, setShowBillInvoicesDialog] = useState(false);
  const [showPartialPaymentInvoiceDialog, setShowPartialPaymentInvoiceDialog] = useState(false);
  const [showDemandLetterDialog, setShowDemandLetterDialog] = useState(false);
  const [showDemandLettersListDialog, setShowDemandLettersListDialog] = useState(false);
  const [selectedPartialPayment, setSelectedPartialPayment] = useState<PaymentReport | null>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingBillPDF, setGeneratingBillPDF] = useState(false);
  const [generatingComprehensivePDF, setGeneratingComprehensivePDF] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [generatingPartialInvoice, setGeneratingPartialInvoice] = useState(false);
  const [createMissingInvoices, setCreateMissingInvoices] = useState<boolean>(true);
  const [autoGenerateBalanceInvoice, setAutoGenerateBalanceInvoice] = useState<boolean>(true);
  const [updateExistingInvoices, setUpdateExistingInvoices] = useState<boolean>(true);
  const [generatingDemandLetter, setGeneratingDemandLetter] = useState(false);
  const [outstandingInvoices, setOutstandingInvoices] = useState<Invoice[]>([]);
  const [outstandingBillInvoices, setOutstandingBillInvoices] = useState<BillInvoice[]>([]);
  const [selectedInvoiceIds, setSelectedInvoiceIds] = useState<string[]>([]);
  const [selectedBillInvoiceIds, setSelectedBillInvoiceIds] = useState<string[]>([]);
  const [loadingOutstanding, setLoadingOutstanding] = useState(false);
  const [showInvoiceSelection, setShowInvoiceSelection] = useState(true);
  const [overdueInvoices, setOverdueInvoices] = useState<Invoice[]>([]);
  const [showOverdueInvoicesDialog, setShowOverdueInvoicesDialog] = useState(false);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null); // Add state for tracking deletion
  const [deletingBillInvoiceId, setDeletingBillInvoiceId] = useState<string | null>(null);
  
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

  const [partialInvoiceForm, setPartialInvoiceForm] = useState({
    dueDate: '',
    notes: '',
  });
  const [demandLetterForm, setDemandLetterForm] = useState({
    demandPeriod: '',
    notes: '',
  });

  const tenantId = params.id as string;

  useEffect(() => {
    fetchTenant();
    fetchInvoices();
    fetchPaymentReports();
    fetchBillInvoices();
    fetchDemandLetters();
    fetchOutstandingInvoices(); 
  }, [tenantId]);

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
    try {
      setInvoicesLoading(true);
      
      const response = await invoicesAPI.getInvoicesByTenant(tenantId, {
        page: 1,
        limit: 1000, // Large number to get all
        //sortBy: 'createdAt',
        //sortOrder: 'desc'
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
    try {
      setBillInvoicesLoading(true);
      // If API supports pagination, get all pages
      const response = await billInvoicesAPI.getByTenant(tenantId, {
        page: 1,
        limit: 1000, // Increase limit to get more invoices
      });
      setBillInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching bill invoices:', error);
    } finally {
      setBillInvoicesLoading(false);
    }
  };
  const fetchDemandLetters = async () => {
    try {
      setDemandLettersLoading(true);
      const response = await demandLettersAPI.getAll({ tenantId });
      setDemandLetters(response.data || []); // Extract data from response
    } catch (error) {
      console.error('Error fetching demand letters:', error);
      toast.error('Failed to load demand letters');
    } finally {
      setDemandLettersLoading(false);
    }
  };
  const fetchOverdueInvoices = async () => {
    try {
      const response = await demandLettersAPI.getOverdueInvoices(tenantId);
      // The API returns an object with invoices array and other properties
      return response?.invoices || []; // Extract invoices array from response
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      toast.error('Failed to load overdue invoices');
      return [];
    }
  };

  const handleViewOverdueInvoices = async () => {
    try {
      setLoadingOutstanding(true);
      const overdue = await fetchOverdueInvoices();
      setOverdueInvoices(overdue);
      
      if (overdue.length === 0) {
        toast.info('No overdue invoices found for this tenant');
      } else {
        setShowOverdueInvoicesDialog(true);
        toast.success(`Found ${overdue.length} overdue invoice(s)`);
      }
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
      toast.error('Failed to load overdue invoices');
    } finally {
      setLoadingOutstanding(false);
    }
  };

  const fetchOutstandingInvoices = async () => {
    if (!tenantId) return;
    
    try {
      setLoadingOutstanding(true);
      const data = await paymentsAPI.getOutstandingInvoices(tenantId, true);
      setOutstandingInvoices(data.rentInvoices || []);
      setOutstandingBillInvoices(data.billInvoices || []);
    } catch (error) {
      console.error('Error fetching outstanding invoices:', error);
      toast.error('Failed to load outstanding invoices');
    } finally {
      setLoadingOutstanding(false);
    }
  };



  const calculatePaymentAmounts = () => {
    if (!tenant) return { rent: 0, serviceCharge: 0, vat: 0, totalDue: 0 };

    const rent = tenant.rent;
    let serviceCharge = 0;
    if (tenant.serviceCharge) {
      switch (tenant.serviceCharge.type) {
        case 'FIXED':
          serviceCharge = tenant.serviceCharge.fixedAmount || 0;
          break;
        case 'PERCENTAGE':
          serviceCharge = (rent * (tenant.serviceCharge.percentage || 0)) / 100;
          break;
        case 'PER_SQ_FT':
          serviceCharge = (tenant.unit?.sizeSqFt || 0) * (tenant.serviceCharge.perSqFtRate || 0);
          break;
      }
    }

    const subtotal = rent + serviceCharge;
    let vat = 0;
    if (tenant.vatType === 'INCLUSIVE' && tenant.vatRate) {
      vat = subtotal - (subtotal / (1 + tenant.vatRate / 100));
    } else if (tenant.vatType === 'EXCLUSIVE' && tenant.vatRate) {
      vat = (subtotal * tenant.vatRate) / 100;
    }

    const totalDue = tenant.vatType === 'INCLUSIVE' ? subtotal : subtotal + vat;
    return { rent, serviceCharge, vat, totalDue };
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

    try {
      setCreatingPayment(true);
      
      // Create the request object with selected invoices
      const paymentData: CreatePaymentReportRequest = {
        tenantId: tenantId!,
        amountPaid,
        notes: paymentForm.notes || undefined,
        paymentPeriod: paymentForm.paymentPeriod,
        // Use selected invoice IDs (empty array if none selected)
        invoiceIds: selectedInvoiceIds,
        billInvoiceIds: selectedBillInvoiceIds,
        autoGenerateBalanceInvoice,
        createMissingInvoices,
        updateExistingInvoices
      };

      const response = await paymentsAPI.createPaymentReport(paymentData);
      
      toast.success('Payment report created successfully!');
      
      setShowCreatePaymentDialog(false);
      
      // Reset form and selections
      setPaymentForm({
        paymentPeriod: '',
        datePaid: new Date().toISOString().split('T')[0],
        amountPaid: '',
        notes: '',
        status: 'PAID',
      });
      
      // Reset invoice selections
      setSelectedInvoiceIds([]);
      setSelectedBillInvoiceIds([]);
      setShowInvoiceSelection(true);
      
      // Reset switches to default
      setCreateMissingInvoices(true);
      setAutoGenerateBalanceInvoice(true);
      setUpdateExistingInvoices(true);
      
      // Refresh data
      fetchPaymentReports();
      fetchInvoices();
      
    } catch (error) {
      console.error('Error creating payment report:', error);
      toast.error('Failed to create payment report');
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

    try {
      setGenerating(true);
      
      // The invoice will automatically use the tenant's payment policy from the backend
      // Display the payment policy being used
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
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.dismiss();
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  const handleGeneratePartialPaymentInvoice = async () => {
    if (!selectedPartialPayment) {
      toast.error('No payment selected');
      return;
    }

    if (!partialInvoiceForm.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    if (!tenant) {
      toast.error('Tenant information not available');
      return;
    }

    try {
      setGeneratingPartialInvoice(true);
      
      // Display the payment policy being used
      toast.loading(`Generating ${tenant.paymentPolicy} balance invoice...`);
      
      await invoicesAPI.generateFromPartialPayment({
        paymentReportId: selectedPartialPayment.id,
        dueDate: partialInvoiceForm.dueDate,
        notes: partialInvoiceForm.notes || `Balance invoice for ${selectedPartialPayment.paymentPeriod} (${tenant.paymentPolicy})`,
      });
      
      toast.dismiss();
      toast.success(`${tenant.paymentPolicy} balance invoice generated successfully!`);
      setShowPartialPaymentInvoiceDialog(false);
      setPartialInvoiceForm({ dueDate: '', notes: '' });
      setSelectedPartialPayment(null);
      fetchInvoices();
      fetchPaymentReports();
    } catch (error: any) {
      console.error('Error generating partial payment invoice:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to generate balance invoice');
    } finally {
      setGeneratingPartialInvoice(false);
    }
  };
  const handleGenerateDemandLetter = async () => {
    if (!tenant) {
      toast.error('Tenant information not available');
      return;
    }

    try {
      setGeneratingDemandLetter(true);
      toast.loading('Generating demand letter...');
      
      // Auto-generate demand letter for the tenant
      const demandLetter = await demandLettersAPI.autoGenerate(tenantId);
      
      toast.dismiss();
      toast.success(`Demand letter ${demandLetter.letterNumber} generated successfully!`);
      setShowDemandLetterDialog(false);
      setDemandLetterForm({ demandPeriod: '', notes: '' });
      fetchDemandLetters();
      
      // Optionally download the PDF immediately
      if (demandLetter.documentUrl) {
        await demandLettersAPI.downloadPDF(demandLetter.id);
      }
    } catch (error: any) {
      console.error('Error generating demand letter:', error);
      toast.dismiss();
      toast.error(error.message || 'Failed to generate demand letter');
    } finally {
      setGeneratingDemandLetter(false);
    }
  };

  const handleDownloadDemandLetter = async (demandLetterId: string) => {
    try {
      await demandLettersAPI.downloadPDF(demandLetterId);
      toast.success('Demand letter download started');
    } catch (error) {
      console.error('Error downloading demand letter:', error);
      toast.error('Failed to download demand letter');
    }
  };



  const openPartialPaymentInvoiceDialog = (payment: PaymentReport) => {
    setSelectedPartialPayment(payment);
    setPartialInvoiceForm({
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: `Balance invoice for ${payment.paymentPeriod}`,
    });
    setShowPartialPaymentInvoiceDialog(true);
  };

  const handleDownloadInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await invoicesAPI.downloadInvoice(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  const handleDownloadPaymentReport = async () => {
    if (!tenant) return;

    try {
      setGeneratingPDF(true);
      toast.loading('Generating payment report PDF...');
      await generatePaymentReportPDF(tenant, paymentReports);
      toast.dismiss();
      toast.success('Payment report downloaded successfully!');
    } catch (error) {
      console.error('Error generating payment report:', error);
      toast.dismiss();
      toast.error('Failed to generate payment report');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleDownloadBillPaymentReport = async () => {
    if (!tenant) return;

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

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'UNPAID':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

    const getDemandLetterStatusColor = (status: DemandLetterStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'GENERATED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SENT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACKNOWLEDGED':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SETTLED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'ESCALATED':
        return 'bg-red-100 text-red-800 border-red-200';
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

  // delete function for invoices
    const handleDeleteInvoice = async (invoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingInvoiceId(invoiceId);
      await invoicesAPI.deleteInvoice(invoiceId);
      toast.success(`Invoice ${invoiceNumber} deleted successfully!`);
      
      // Update the invoices list by removing the deleted invoice
      setInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== invoiceId));
    } catch (error) {
      console.error('Error deleting invoice:', error);
      toast.error('Failed to delete invoice');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  // delete function for bill-invoices
  const handleDeleteBillInvoice = async (billInvoiceId: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete bill invoice ${invoiceNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingBillInvoiceId(billInvoiceId);
      await billInvoicesAPI.deleteBillInvoice(billInvoiceId);
      toast.success(`Bill invoice ${invoiceNumber} deleted successfully!`);
      
      // Update the bill invoices list by removing the deleted invoice
      setBillInvoices(prevInvoices => prevInvoices.filter(invoice => invoice.id !== billInvoiceId));
    } catch (error) {
      console.error('Error deleting bill invoice:', error);
      toast.error('Failed to delete bill invoice');
    } finally {
      setDeletingBillInvoiceId(null);
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

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        stiffness: 100,
        damping: 12,
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
        <p className="text-gray-800 mb-6">The tenant you're looking for doesn't exist.</p>
        <Button onClick={() => router.back()}>Go Back</Button>
      </motion.div>
    );
  }

  const { rent, serviceCharge, vat, totalDue } = calculatePaymentAmounts();
  const partialPaymentsCount = paymentReports.filter(p => p.status === 'PARTIAL' && p.arrears > 0).length;

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          onClick={() => router.back()}
          className="group px-6 py-3 bg-gray-100 text-gray-900 hover:bg-gray-200 transition-all duration-300 shadow-sm hover:shadow-md rounded-lg"
        >
          <motion.span className="flex items-center gap-2" whileHover={{ x: -2 }}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </motion.span>
        </Button>
      </motion.div>

      {/* Header Section */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 pb-6 border-b-2 border-gray-100"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-16 h-16 bg-linear-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center shrink-0"
          >
            <svg className="w-8 h-8 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </motion.div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-heading-color">{tenant.fullName}</h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-gray-900 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
                ID: {tenant.id}
              </p>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                {tenant.paymentPolicy}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => setShowInvoiceDialog(true)}
            className="px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Generate Invoice
          </Button>
          <Button
            onClick={() => setShowInvoicesList(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-primary text-primary hover:bg-primary/5 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Invoices ({invoices.length})
          </Button>
          <Button
            onClick={() => setShowCreatePaymentDialog(true)}
            className="px-6 py-3 bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Record Payment
          </Button>
          <Button
            onClick={() => setShowPaymentReportsDialog(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-green-600 text-green-600 hover:bg-green-50 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Payment Reports ({paymentReports.length})
            {partialPaymentsCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-yellow-500 text-white text-xs rounded-full">
                {partialPaymentsCount} partial
              </span>
            )}
          </Button>
          <Button
            onClick={() => setShowBillInvoicesDialog(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Bill Invoices ({billInvoices.length})
          </Button>
          <Button
            onClick={() => router.push(`/properties/${params.id}/tenant-details/bills`)}
            variant="outline"
            className="px-6 py-3 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            My Bills
          </Button>
                    {/* Demand Letter Button */}
          <Button
            onClick={() => setShowDemandLetterDialog(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-red-600 text-red-600 hover:bg-red-50 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Demand Letter
          </Button>
          <Button
            onClick={() => setShowDemandLettersListDialog(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-orange-600 text-orange-600 hover:bg-orange-50 transition-all duration-300 rounded-lg flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Demand Letters ({demandLetters.length})
          </Button>
        </div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-heading-color">Personal Information</h2>
          </div>
          <dl className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <div className="flex-1">
                <dt className="text-sm font-semibold text-gray-500 mb-1">Full Name</dt>
                <dd className="text-sm text-gray-900 font-medium">{tenant.fullName}</dd>
              </div>
            </div>
            {tenant.contact && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Contact</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.contact}</dd>
                </div>
              </div>
            )}
            {tenant.KRAPin && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">KRA Pin</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.KRAPin}</dd>
                </div>
              </div>
            )}
            {tenant.POBox && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">P.O. Box</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.POBox}</dd>
                </div>
              </div>
            )}
            {tenant.email && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Email</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.email}</dd>
                </div>
              </div>
            )}
          </dl>
        </motion.div>

        {/* Lease Information */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-heading-color">Lease Information</h2>
          </div>
          <dl className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <dt className="text-sm font-semibold text-gray-800 mb-1">Lease Term</dt>
                <dd className="text-sm text-gray-900 font-medium">{tenant.leaseTerm}</dd>
              </div>
            </div>
            {tenant.termStart && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Term Start Date</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {new Date(tenant.termStart).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            )}
            {tenant.rentStart && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Rent Start Date</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {new Date(tenant.rentStart).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </dd>
                </div>
              </div>
            )}
            {tenant.escalationRate && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Rent Escalation</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {tenant.escalationRate}% {tenant.escalationFrequency && `(${tenant.escalationFrequency.toLowerCase().replace('_', '-')})`}
                  </dd>
                </div>
              </div>
            )}
            {tenant.serviceCharge && (
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Service Charge</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {tenant.serviceCharge.type === 'FIXED' && `Ksh ${tenant.serviceCharge.fixedAmount?.toLocaleString()}`}
                    {tenant.serviceCharge.type === 'PERCENTAGE' && `${tenant.serviceCharge.percentage}%`}
                    {tenant.serviceCharge.type === 'PER_SQ_FT' && `Ksh ${tenant.serviceCharge.perSqFtRate} per sq ft`}
                  </dd>
                </div>
              </div>
            )}
          </dl>
        </motion.div>

        {/* Rent Information */}
        <motion.div
          variants={itemVariants}
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-heading-color">Rent Information</h2>
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-linear-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
              <p className="text-sm font-semibold text-gray-800 mb-2">
                {/* Dynamic heading based on payment policy */}
                {tenant.paymentPolicy === 'MONTHLY' && 'Monthly Rent'}
                {tenant.paymentPolicy === 'QUARTERLY' && 'Quarterly Rent'}
                {tenant.paymentPolicy === 'ANNUAL' && 'Annual Rent'}
              </p>
              <p className="text-4xl font-bold text-gray-900">Ksh {tenant.rent.toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-2">
                {/* Dynamic description based on payment policy */}
                {tenant.paymentPolicy === 'MONTHLY' && 'Per month'}
                {tenant.paymentPolicy === 'QUARTERLY' && 'Per quarter'}
                {tenant.paymentPolicy === 'ANNUAL' && 'Per year'}
              </p>
            </div>
            {tenant.deposit && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Security Deposit</span>
                  <span className="text-lg font-bold text-gray-900">Ksh {tenant.deposit.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="p-4 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Payment Policy</span>
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                  {tenant.paymentPolicy}
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                All invoices will be generated based on this policy
              </p>
            </div>
          </div>
        </motion.div>

        {/* Unit Information */}
        {tenant.unit && (
          <motion.div
            variants={itemVariants}
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-heading-color">Unit Information</h2>
            </div>
            <dl className="space-y-4">
              {tenant.unit.unitNo && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-800 mb-1">Unit Number</dt>
                    <dd className="text-sm text-gray-900 font-medium">{tenant.unit.unitNo}</dd>
                  </div>
                </div>
              )}
              {tenant.unit.floor && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-800 mb-1">Floor</dt>
                    <dd className="text-sm text-gray-900 font-medium">{tenant.unit.floor}</dd>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Unit Type</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.unit.unitType}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Size</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.unit.sizeSqFt} sq ft</dd>
                </div>
              </div>
              {tenant.unit.bedrooms && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-800 mb-1">Bedrooms</dt>
                    <dd className="text-sm text-gray-900 font-medium">{tenant.unit.bedrooms}</dd>
                  </div>
                </div>
              )}
              {tenant.unit.bathrooms && (
                <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  <div className="flex-1">
                    <dt className="text-sm font-semibold text-gray-800 mb-1">Bathrooms</dt>
                    <dd className="text-sm text-gray-900 font-medium">{tenant.unit.bathrooms}</dd>
                  </div>
                </div>
              )}
            </dl>
          </motion.div>
        )}
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Generate Invoice</DialogTitle>
            <DialogDescription className="text-gray-700">
              Generate a new invoice for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="text-sm text-blue-900 font-medium">
              Payment Policy: <span className="font-bold">{tenant.paymentPolicy}</span>
            </div>
            <div className="text-xs text-blue-700 mt-1">
              The invoice will be generated according to this policy
            </div>
          </div>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-sm font-semibold text-gray-800">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                className="w-full text-gray-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-semibold text-gray-800">
                Notes (Optional)
              </Label>
              <Textarea
                id="notes"
                placeholder={`Add any additional notes (e.g., ${tenant.paymentPolicy} rent for December 2025)`}
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                className="min-h-[100px] text-gray-800"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowInvoiceDialog(false)}
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateInvoice}
              disabled={generating || !invoiceForm.dueDate}
              className="bg-primary hover:bg-primary/90"
            >
              {generating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoices List Dialog */}
      <Dialog open={showInvoicesList} onOpenChange={setShowInvoicesList}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Invoices</DialogTitle>
            <DialogDescription className="text-gray-700">
              All invoices for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No invoices found</p>
                <p className="text-sm mt-1">Generate your first invoice to get started</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {invoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(invoice.paymentPolicy)}`}>
                            {invoice.paymentPolicy}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Period</p>
                            <p className="text-gray-900 font-semibold">{invoice.paymentPeriod}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Issue Date</p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Due Date</p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Total Due</p>
                            <p className="text-gray-900 font-bold">Ksh {invoice.totalDue.toLocaleString()}</p>
                          </div>
                        </div>
                        {invoice.amountPaid > 0 && (
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500 font-medium">Amount Paid</p>
                              <p className="text-green-700 font-bold">Ksh {invoice.amountPaid.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-500 font-medium">Balance</p>
                              <p className="text-red-700 font-bold">Ksh {invoice.balance.toLocaleString()}</p>
                            </div>
                          </div>
                        )}
                        {invoice.notes && (
                          <div className="text-sm">
                            <p className="text-gray-500 font-medium">Notes</p>
                            <p className="text-gray-700">{invoice.notes}</p>
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                        variant="outline"
                        size="sm"
                        className="ml-4 shrink-0"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download
                      </Button>
                      {/* <Button
                          onClick={() => handleDeleteInvoice(invoice.id, invoice.invoiceNumber)}
                          variant="outline"
                          size="sm"
                          disabled={deletingInvoiceId === invoice.id}
                          className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-600 font-medium transition-all duration-200"
                        >
                          {deletingInvoiceId === invoice.id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </>
                          )}
                        </Button> */}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Payment Dialog */}
      <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col p-0">
          <div className="px-6 pt-6 pb-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-heading-color">Record Payment</DialogTitle>
              <DialogDescription className="text-gray-700">
                Record a new payment for {tenant.fullName}
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* Payment Information Card */}
              <div className="p-4 bg-linear-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Payment Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-800 font-medium">Rent</p>
                    <p className="text-gray-900 font-bold">Ksh {rent.toLocaleString()}</p>
                  </div>
                  {serviceCharge > 0 && (
                    <div>
                      <p className="text-gray-800 font-medium">Service Charge</p>
                      <p className="text-gray-900 font-bold">Ksh {serviceCharge.toLocaleString()}</p>
                    </div>
                  )}
                  {vat > 0 && (
                    <div>
                      <p className="text-gray-800 font-medium">VAT</p>
                      <p className="text-gray-900 font-bold">Ksh {vat.toLocaleString()}</p>
                    </div>
                  )}
                  <div className="col-span-2 border-t pt-2">
                    <p className="text-gray-800 font-medium">Total Due (Monthly)</p>
                    <p className="text-gray-900 font-bold text-lg">Ksh {totalDue.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Outstanding Invoices Selection Section */}
              <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Outstanding Invoices</h3>
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
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                      </div>
                    ) : (
                      <>
                        {/* Rent Invoices */}
                        {outstandingInvoices.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Rent Invoices</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {outstandingInvoices.map((invoice) => (
                                <label
                                  key={invoice.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                    selectedInvoiceIds.includes(invoice.id)
                                      ? 'border-orange-500 bg-orange-100'
                                      : 'border-gray-200 hover:border-orange-300 bg-white'
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
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-sm text-gray-900">
                                        {invoice.invoiceNumber}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                        {invoice.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
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
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Bill Invoices */}
                        {outstandingBillInvoices.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Bill Invoices</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                              {outstandingBillInvoices.map((billInvoice) => (
                                <label
                                  key={billInvoice.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                                    selectedBillInvoiceIds.includes(billInvoice.id)
                                      ? 'border-orange-500 bg-orange-100'
                                      : 'border-gray-200 hover:border-orange-300 bg-white'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedBillInvoiceIds.includes(billInvoice.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedBillInvoiceIds([...selectedBillInvoiceIds, billInvoice.id]);
                                      } else {
                                        setSelectedBillInvoiceIds(selectedBillInvoiceIds.filter(id => id !== billInvoice.id));
                                      }
                                    }}
                                    className="mt-1 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="font-semibold text-sm text-gray-900">
                                        {billInvoice.invoiceNumber}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(billInvoice.status)}`}>
                                        {billInvoice.status}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                      <div>
                                        <span className="font-medium">Type:</span> {billInvoice.billType}
                                      </div>
                                      <div>
                                        <span className="font-medium">Due:</span> {new Date(billInvoice.dueDate).toLocaleDateString()}
                                      </div>
                                      <div>
                                        <span className="font-medium">Total:</span> Ksh {billInvoice.grandTotal.toLocaleString()}
                                      </div>
                                      <div>
                                        <span className="font-medium">Balance:</span>{' '}
                                        <span className="text-red-600 font-bold">
                                          Ksh {billInvoice.balance.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No Outstanding Invoices Message */}
                        {outstandingInvoices.length === 0 && outstandingBillInvoices.length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No outstanding invoices found</p>
                            <p className="text-xs mt-1">Payment will be recorded without specific invoice selection</p>
                          </div>
                        )}

                        {/* Selection Summary */}
                        {(selectedInvoiceIds.length > 0 || selectedBillInvoiceIds.length > 0) && (
                          <div className="mt-4 p-3 bg-white rounded-lg border border-orange-300">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-gray-700">
                                Selected: {selectedInvoiceIds.length + selectedBillInvoiceIds.length} invoice(s)
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInvoiceIds([]);
                                  setSelectedBillInvoiceIds([]);
                                }}
                                className="text-xs text-orange-600 hover:text-orange-700"
                              >
                                Clear All
                              </Button>
                            </div>
                            <p className="text-xs text-gray-600 mt-1">
                              Total Balance: Ksh{' '}
                              {(
                                outstandingInvoices
                                  .filter(inv => selectedInvoiceIds.includes(inv.id))
                                  .reduce((sum, inv) => sum + inv.balance, 0) +
                                outstandingBillInvoices
                                  .filter(bi => selectedBillInvoiceIds.includes(bi.id))
                                  .reduce((sum, bi) => sum + bi.balance, 0)
                              ).toLocaleString()}
                            </p>
                          </div>
                        )}

                        {/* Auto-payment Notice */}
                        {selectedInvoiceIds.length === 0 && selectedBillInvoiceIds.length === 0 && 
                        (outstandingInvoices.length > 0 || outstandingBillInvoices.length > 0) && (
                          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-start gap-2">
                              <svg className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-xs text-blue-800">
                                <strong>No invoices selected.</strong> Payment will be automatically applied to the oldest outstanding invoices first.
                              </p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Invoice Options Section */}
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Invoice Options</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="createMissingInvoices" className="text-sm font-semibold text-gray-800">
                        Create Missing Invoice
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Automatically create an invoice if none exists for the period
                      </p>
                    </div>
                    <Switch
                      id="createMissingInvoices"
                      checked={createMissingInvoices}
                      onCheckedChange={setCreateMissingInvoices}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="autoGenerateBalanceInvoice" className="text-sm font-semibold text-gray-800">
                        Generate Balance Invoice
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Create a new invoice for remaining balance if payment is partial
                      </p>
                    </div>
                    <Switch
                      id="autoGenerateBalanceInvoice"
                      checked={autoGenerateBalanceInvoice}
                      onCheckedChange={setAutoGenerateBalanceInvoice}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="updateExistingInvoices" className="text-sm font-semibold text-gray-800">
                        Update Existing Invoices
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        Apply payment to existing unpaid invoices
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

              {/* Payment Details Form */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="paymentPeriod" className="text-sm font-semibold text-gray-800">
                    Payment Period <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="paymentPeriod"
                    type="month"
                    value={paymentForm.paymentPeriod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriod: e.target.value })}
                    className="w-full text-gray-900"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amountPaid" className="text-sm font-semibold text-gray-800">
                    Amount Paid <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Ksh</span>
                    <Input
                      id="amountPaid"
                      type="number"
                      placeholder="Enter amount"
                      value={paymentForm.amountPaid}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                      className="w-full text-gray-900 pl-12"
                      required
                    />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {paymentForm.amountPaid && parseFloat(paymentForm.amountPaid) < totalDue && (
                      <span className="text-orange-600 font-medium">
                        Partial payment - {((parseFloat(paymentForm.amountPaid) / totalDue) * 100).toFixed(1)}% of total due
                      </span>
                    )}
                    {paymentForm.amountPaid && parseFloat(paymentForm.amountPaid) > totalDue && (
                      <span className="text-green-600 font-medium">
                        Amount exceeds monthly total - excess will be applied to outstanding balances
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Preview */}
                <div className="p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-800">Expected Status:</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      !paymentForm.amountPaid || parseFloat(paymentForm.amountPaid) === 0 
                        ? 'bg-gray-100 text-gray-800 border border-gray-300'
                        : parseFloat(paymentForm.amountPaid) >= totalDue 
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : parseFloat(paymentForm.amountPaid) > 0
                            ? 'bg-orange-100 text-orange-800 border border-orange-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                    }`}>
                      {!paymentForm.amountPaid || parseFloat(paymentForm.amountPaid) === 0 
                        ? 'UNPAID'
                        : parseFloat(paymentForm.amountPaid) >= totalDue 
                          ? 'PAID'
                          : parseFloat(paymentForm.amountPaid) > 0
                            ? 'PARTIAL'
                            : 'UNPAID'
                      }
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Status is automatically calculated based on the payment amount
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentNotes" className="text-sm font-semibold text-gray-800">
                    Notes (Optional)
                  </Label>
                  <Textarea
                    id="paymentNotes"
                    placeholder="Add any additional notes about this payment..."
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                    className="min-h-20 text-gray-900"
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Fixed footer with buttons */}
          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePaymentDialog(false);
                setSelectedInvoiceIds([]);
                setSelectedBillInvoiceIds([]);
              }}
              disabled={creatingPayment}
              className="min-w-24"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={creatingPayment || !paymentForm.paymentPeriod || !paymentForm.amountPaid}
              className="bg-blue-600 hover:bg-blue-700 min-w-24"
            >
              {creatingPayment ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Payment Reports Dialog */}
      <Dialog open={showPaymentReportsDialog} onOpenChange={setShowPaymentReportsDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Payment Reports</DialogTitle>
            <DialogDescription className="text-gray-700">
              <div className="flex items-center justify-between">
                <span>All payment reports for {tenant.fullName}</span>
                <Button
                  onClick={handleDownloadPaymentReport}
                  disabled={generatingPDF || paymentReports.length === 0}
                  size="sm"
                  className="ml-4"
                >
                  {generatingPDF ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Report
                    </>
                  )}
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {paymentReportsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : paymentReports.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">No payment reports found</p>
                <p className="text-sm mt-1">Record your first payment to get started</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {paymentReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{report.paymentPeriod}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Total Due</p>
                            <p className="text-gray-900 font-bold">Ksh {report.totalDue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Amount Paid</p>
                            <p className="text-green-700 font-bold">Ksh {report.amountPaid.toLocaleString()}</p>
                          </div>
                          {report.arrears > 0 && (
                            <div>
                              <p className="text-gray-500 font-medium">Arrears</p>
                              <p className="text-red-700 font-bold">Ksh {report.arrears.toLocaleString()}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-500 font-medium">Date Paid</p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(report.datePaid).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        {report.notes && (
                          <div className="text-sm">
                            <p className="text-gray-500 font-medium">Notes</p>
                            <p className="text-gray-700">{report.notes}</p>
                          </div>
                        )}
                      </div>
                      {report.status === 'PARTIAL' && report.arrears > 0 && (
                        <Button
                          onClick={() => openPartialPaymentInvoiceDialog(report)}
                          size="sm"
                          className="ml-4 shrink-0 bg-yellow-600 hover:bg-yellow-700"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Generate Balance Invoice
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Partial Payment Invoice Dialog */}
      <Dialog open={showPartialPaymentInvoiceDialog} onOpenChange={setShowPartialPaymentInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Generate Balance Invoice</DialogTitle>
            <DialogDescription className="text-gray-700">
              {selectedPartialPayment && (
                <>
                  Generate invoice for outstanding balance of{' '}
                  <span className="font-bold text-red-700">
                    Ksh {selectedPartialPayment.arrears.toLocaleString()}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedPartialPayment && (
            <>
              <div className="mt-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="text-sm text-yellow-900">
                  Period: <span className="font-bold">{selectedPartialPayment.paymentPeriod}</span>
                </div>
                <div className="text-sm text-yellow-900">
                  Paid: Ksh {selectedPartialPayment.amountPaid.toLocaleString()} of Ksh {selectedPartialPayment.totalDue.toLocaleString()}
                </div>
              </div>
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-900 font-medium">
                  Payment Policy: <span className="font-bold">{tenant.paymentPolicy}</span>
                </div>
              </div>
            </>
          )}
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="partialDueDate" className="text-sm font-semibold text-gray-800">
                Due Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="partialDueDate"
                type="date"
                value={partialInvoiceForm.dueDate}
                onChange={(e) => setPartialInvoiceForm({ ...partialInvoiceForm, dueDate: e.target.value })}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="partialNotes" className="text-sm font-semibold text-gray-800">
                Notes (Optional)
              </Label>
              <Textarea
                id="partialNotes"
                placeholder="Add any additional notes"
                value={partialInvoiceForm.notes}
                onChange={(e) => setPartialInvoiceForm({ ...partialInvoiceForm, notes: e.target.value })}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPartialPaymentInvoiceDialog(false);
                setSelectedPartialPayment(null);
              }}
              disabled={generatingPartialInvoice}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePartialPaymentInvoice}
              disabled={generatingPartialInvoice || !partialInvoiceForm.dueDate}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {generatingPartialInvoice ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                'Generate Balance Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bill Invoices Dialog */}
      <Dialog open={showBillInvoicesDialog} onOpenChange={setShowBillInvoicesDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Bill Invoices</DialogTitle>
            <DialogDescription className="text-gray-700">
              <div className="flex items-center justify-between">
                <span>All bill invoices for {tenant.fullName}</span>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownloadBillPaymentReport}
                    disabled={generatingBillPDF || billInvoices.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    {generatingBillPDF ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Bill Report
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleDownloadComprehensiveReport}
                    disabled={generatingComprehensivePDF || (paymentReports.length === 0 && billInvoices.length === 0)}
                    size="sm"
                  >
                    {generatingComprehensivePDF ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Full Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {billInvoicesLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : billInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No bill invoices found</p>
                <p className="text-sm mt-1">Bill invoices will appear here once generated</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {billInvoices.map((billInvoice) => (
                  <motion.div
                    key={billInvoice.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-bold text-gray-900">{billInvoice.invoiceNumber}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(billInvoice.status)}`}>
                            {billInvoice.status}
                          </span>
                          
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-purple-100 text-purple-800 border-purple-200">
                            {billInvoice.billType}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500 font-medium">Issue Date</p>
                          <p className="text-gray-900 font-semibold">
                            {new Date(billInvoice.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Due Date</p>
                          <p className="text-gray-900 font-semibold">
                            {new Date(billInvoice.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Units</p>
                          <p className="text-gray-900 font-bold">{billInvoice.units}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium">Grand Total</p>
                          <p className="text-gray-900 font-bold">Ksh {billInvoice.grandTotal.toLocaleString()}</p>
                        </div>
                        {billInvoice.balance > 0 && (
                          <div>
                            <p className="text-gray-500 font-medium">Balance</p>
                            <p className="text-red-700 font-bold">Ksh {billInvoice.balance.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                      {billInvoice.notes && (
                        <div className="text-sm">
                          <p className="text-gray-500 font-medium">Notes</p>
                          <p className="text-gray-700">{billInvoice.notes}</p>
                        </div>
                      )}
                    </div>
                    {/*<div className="flex flex-col gap-2 ml-4 shrink-0">
                     <Button
                        onClick={() => handleDeleteBillInvoice(billInvoice.id, billInvoice.invoiceNumber)}
                        variant="outline"
                        size="sm"
                        disabled={deletingBillInvoiceId === billInvoice.id}
                        className="w-full bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 border border-red-700"
                      >
                        {deletingBillInvoiceId === billInvoice.id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Deleting...
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </>
                        )}
                        </Button>
                    </div> */} 
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      {/* Demand Letter Generation Dialog */}
      <Dialog open={showDemandLetterDialog} onOpenChange={setShowDemandLetterDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="shrink-0 px-6 pt-6">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-heading-color">Generate Demand Letter</DialogTitle>
              <DialogDescription className="text-gray-600">
                Generate a demand letter for {tenant.fullName} based on overdue invoices. The system will automatically calculate outstanding amounts and generate the appropriate demand letter.
              </DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            <div className="space-y-6 py-4 pr-2">
              {/* Show overdue invoices info */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Automatic Generation</p>
                    <p className="text-sm text-yellow-700">
                      The system will automatically fetch all overdue invoices for this tenant and calculate the total outstanding amount.
                    </p>
                    <Button
                      onClick={handleViewOverdueInvoices}
                      variant="outline"
                      disabled={loadingOutstanding}
                      className="text-yellow-700 hover:text-yellow-800 p-0 h-auto mt-2 flex items-center gap-1"
                    >
                      {loadingOutstanding && (
                        <svg className="animate-spin h-4 w-4 text-yellow-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      View overdue invoices
                    </Button>
                  </div>
                </div>
              </div>

              {/* Optional Notes */}
              <div className="space-y-2">
                <Label htmlFor="demand-notes" className="text-sm font-medium text-gray-700">
                  Additional Notes (Optional)
                  <span className="text-gray-400 ml-1 font-normal">
                    - Add any instructions or specific details for the demand letter
                  </span>
                </Label>
                <Textarea
                  id="demand-notes"
                  placeholder="Example: Include a 14-day payment deadline. Mention that legal action may be pursued if payment is not received. Note any previous payment arrangements that were not honored..."
                  value={demandLetterForm.notes}
                  onChange={(e) => setDemandLetterForm({ ...demandLetterForm, notes: e.target.value })}
                  className="min-h-[120px] resize-y placeholder:text-gray-500 placeholder:italic placeholder:text-sm border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These notes will be incorporated into the demand letter content
                </p>
              </div>

              {/* Info about what will be included */}
              <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-semibold text-blue-800">The demand letter will include:</p>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>All overdue invoices with dates and amounts</li>
                  <li>Total outstanding balance</li>
                  <li>Tenant and property information</li>
                  <li>Payment instructions and deadline</li>
                  <li>Legal notice and consequences</li>
                </ul>
              </div>
              
              {/* Additional content area if needed */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 mb-2">Important Reminders:</p>
                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                  <li>The demand letter will be saved to the tenant's documents</li>
                  <li>A notification will be sent to the tenant</li>
                  <li>You can preview the letter before finalizing</li>
                  <li>The letter will be dated with today's date</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Custom scrollbar styling */}
          <style jsx>{`
            .overflow-y-auto::-webkit-scrollbar {
              width: 8px;
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 4px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 4px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>
          
          <DialogFooter className="shrink-0 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => {
                setShowDemandLetterDialog(false);
                setDemandLetterForm({ demandPeriod: '', notes: '' });
              }}
              disabled={generatingDemandLetter}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerateDemandLetter}
              disabled={generatingDemandLetter}
              className="bg-red-600 hover:bg-red-700 text-white px-6"
            >
              {generatingDemandLetter ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Generating...
                </>
              ) : (
                'Generate Demand Letter'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Overdue Invoices Dialog */}
      <Dialog open={showOverdueInvoicesDialog} onOpenChange={setShowOverdueInvoicesDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Overdue Invoices</DialogTitle>
            <DialogDescription className="text-gray-700">
              Overdue invoices for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {loadingOutstanding ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : overdueInvoices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg font-medium">No overdue invoices found</p>
                <p className="text-sm mt-1">All invoices are up to date</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-red-800">Total Overdue Amount</p>
                      <p className="text-2xl font-bold text-red-700">
                        Ksh {overdueInvoices.reduce((sum, invoice) => sum + invoice.balance, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-red-800">Overdue Invoices</p>
                      <p className="text-2xl font-bold text-red-700">{overdueInvoices.length}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4">
                  {overdueInvoices.map((invoice) => (
                    <motion.div
                      key={invoice.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow bg-white"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-bold text-gray-900">{invoice.invoiceNumber}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                              {invoice.status}
                            </span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-200">
                              OVERDUE
                            </span>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-red-700">Balance Due</p>
                            <p className="text-lg font-bold text-red-700">Ksh {invoice.balance.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Period</p>
                            <p className="text-gray-900 font-semibold">{invoice.paymentPeriod}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Issue Date</p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(invoice.issueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Due Date</p>
                            <p className="text-gray-900 font-semibold">
                              {new Date(invoice.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Days Overdue</p>
                            <p className="text-red-700 font-bold">
                              {Math.max(0, Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24)))} days
                            </p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500 font-medium">Total Due</p>
                            <p className="text-gray-900 font-bold">Ksh {invoice.totalDue.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-gray-500 font-medium">Amount Paid</p>
                            <p className="text-green-700 font-semibold">Ksh {invoice.amountPaid.toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {invoice.notes && (
                          <div className="text-sm">
                            <p className="text-gray-500 font-medium">Notes</p>
                            <p className="text-gray-700">{invoice.notes}</p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowOverdueInvoicesDialog(false)}
              className="px-6"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Demand Letters List Dialog */}
      <Dialog open={showDemandLettersListDialog} onOpenChange={setShowDemandLettersListDialog}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-heading-color">Demand Letters</DialogTitle>
            <DialogDescription>
              All demand letters generated for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {demandLettersLoading ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : demandLetters.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-800">No demand letters found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Letter No.</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Issue Date</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Rental Period</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {demandLettersLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                            <span className="text-gray-700">Loading demand letters...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !Array.isArray(demandLetters) ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-red-500">
                          Error: Invalid data format received
                        </td>
                      </tr>
                    ) : demandLetters.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-500">
                          No demand letters found for this tenant
                        </td>
                      </tr>
                    ) : (
                      demandLetters.map((letter) => (
                        <tr key={letter.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-3 px-4 font-semibold text-gray-900">{letter.letterNumber}</td>
                          <td className="py-3 px-4 text-gray-800 font-medium">
                            {letter.issueDate ? new Date(letter.issueDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="py-3 px-4 font-bold text-gray-900">
                            Ksh {letter.outstandingAmount?.toLocaleString() ?? '0'}
                          </td>
                          <td className="py-3 px-4 text-gray-800 font-medium">{letter.rentalPeriod}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getDemandLetterStatusColor(letter.status)}`}>
                              {letter.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDownloadDemandLetter(letter.id)}
                              className="flex items-center gap-2 text-gray-800 hover:text-gray-900 border-gray-400 hover:border-gray-600 bg-white hover:bg-gray-50 font-medium"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}



