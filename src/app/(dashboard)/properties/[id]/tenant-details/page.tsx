'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Tenant, Invoice, InvoiceStatus, PaymentReport, PaymentStatus, BillInvoice } from '@/types';
import { tenantsAPI, invoicesAPI, paymentsAPI, billInvoicesAPI } from '@/lib/api';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { generatePaymentReportPDF, generateBillInvoiceReportPDF, generateComprehensiveReportPDF } from '@/lib/pdfGenerator';

export default function TenantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [paymentReports, setPaymentReports] = useState<PaymentReport[]>([]);
  const [billInvoices, setBillInvoices] = useState<BillInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [paymentReportsLoading, setPaymentReportsLoading] = useState(false);
  const [billInvoicesLoading, setBillInvoicesLoading] = useState(false);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [showInvoicesList, setShowInvoicesList] = useState(false);
  const [showPaymentReportsDialog, setShowPaymentReportsDialog] = useState(false);
  const [showCreatePaymentDialog, setShowCreatePaymentDialog] = useState(false);
  const [showBillInvoicesDialog, setShowBillInvoicesDialog] = useState(false);
  const [showPartialPaymentInvoiceDialog, setShowPartialPaymentInvoiceDialog] = useState(false); // NEW
  const [selectedPartialPayment, setSelectedPartialPayment] = useState<PaymentReport | null>(null); // NEW
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [generatingBillPDF, setGeneratingBillPDF] = useState(false);
  const [generatingComprehensivePDF, setGeneratingComprehensivePDF] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [generatingPartialInvoice, setGeneratingPartialInvoice] = useState(false); // NEW
  
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

  // NEW: Form for partial payment invoice
  const [partialInvoiceForm, setPartialInvoiceForm] = useState({
    dueDate: '',
    notes: '',
  });

  const tenantId = params.id as string;

  useEffect(() => {
    fetchTenant();
    fetchInvoices();
    fetchPaymentReports();
    fetchBillInvoices();
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
      const response = await invoicesAPI.getInvoicesByTenant(tenantId);
      setInvoices(response.data);
    } catch (error) {
      console.error('Error fetching invoices:', error);
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
      const response = await billInvoicesAPI.getByTenant(tenantId);
      setBillInvoices(response.data || []);
    } catch (error) {
      console.error('Error fetching bill invoices:', error);
      toast.error('Failed to load bill invoices');
      setBillInvoices([]);
    } finally {
      setBillInvoicesLoading(false);
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
    if (!paymentForm.paymentPeriod || !paymentForm.datePaid || !paymentForm.amountPaid) {
      toast.error('Please fill in all required fields');
      return;
    }

    const amountPaid = parseFloat(paymentForm.amountPaid);
    if (isNaN(amountPaid) || amountPaid <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    try {
      setCreatingPayment(true);
      const { rent, serviceCharge, vat, totalDue } = calculatePaymentAmounts();

      const paymentData: Partial<PaymentReport> = {
        tenantId,
        rent,
        serviceCharge: serviceCharge > 0 ? serviceCharge : undefined,
        vat: vat > 0 ? vat : undefined,
        totalDue,
        amountPaid,
        arrears: Math.max(0, totalDue - amountPaid),
        status: paymentForm.status,
        paymentPeriod: paymentForm.paymentPeriod,
        datePaid: paymentForm.datePaid,
        notes: paymentForm.notes || undefined,
      };

      await paymentsAPI.createPaymentReport(paymentData);
      toast.success('Payment report created successfully!');
      setShowCreatePaymentDialog(false);
      setPaymentForm({
        paymentPeriod: '',
        datePaid: new Date().toISOString().split('T')[0],
        amountPaid: '',
        notes: '',
        status: 'PAID',
      });
      fetchPaymentReports();
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

    try {
      setGenerating(true);
      await invoicesAPI.generateInvoice({
        tenantId,
        dueDate: invoiceForm.dueDate,
        notes: invoiceForm.notes,
      });
      toast.success('Invoice generated successfully!');
      setShowInvoiceDialog(false);
      setInvoiceForm({ dueDate: '', notes: '' });
      fetchInvoices();
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setGenerating(false);
    }
  };

  // NEW: Handle generating invoice for partial payment
  const handleGeneratePartialPaymentInvoice = async () => {
    if (!selectedPartialPayment) {
      toast.error('No payment selected');
      return;
    }

    if (!partialInvoiceForm.dueDate) {
      toast.error('Please select a due date');
      return;
    }

    try {
      setGeneratingPartialInvoice(true);
      await invoicesAPI.generateFromPartialPayment({
        paymentReportId: selectedPartialPayment.id,
        dueDate: partialInvoiceForm.dueDate,
        notes: partialInvoiceForm.notes || `Balance invoice for ${selectedPartialPayment.paymentPeriod}`,
      });
      toast.success('Balance invoice generated successfully!');
      setShowPartialPaymentInvoiceDialog(false);
      setPartialInvoiceForm({ dueDate: '', notes: '' });
      setSelectedPartialPayment(null);
      fetchInvoices();
      fetchPaymentReports();
    } catch (error: any) {
      console.error('Error generating partial payment invoice:', error);
      toast.error(error.message || 'Failed to generate balance invoice');
    } finally {
      setGeneratingPartialInvoice(false);
    }
  };

  // NEW: Open partial payment invoice dialog
  const openPartialPaymentInvoiceDialog = (payment: PaymentReport) => {
    setSelectedPartialPayment(payment);
    setPartialInvoiceForm({
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 30 days
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

  // NEW: Get partial payments count
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
            <p className="text-gray-900 flex items-center gap-2 mt-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              ID: {tenant.id}
            </p>
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
              <p className="text-sm font-semibold text-gray-800 mb-2">Monthly Rent</p>
              <p className="text-4xl font-bold text-gray-900">Ksh {tenant.rent.toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-2">Per month</p>
            </div>
            {tenant.deposit && (
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">Security Deposit</span>
                  <span className="text-lg font-bold text-gray-900">Ksh {tenant.deposit.toLocaleString()}</span>
                </div>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-800">Payment Policy</span>
                <span className="text-lg font-bold text-gray-900">{tenant.paymentPolicy}</span>
              </div>
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
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Unit Type</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.unit.type || 'N/A'}</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Bedrooms / Bathrooms</dt>
                  <dd className="text-sm text-gray-900 font-medium">
                    {tenant.unit.bedrooms} bed &bull; {tenant.unit.bathrooms} bath
                  </dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-900 mb-1">Size</dt>
                  <dd className="text-sm text-gray-900 font-medium">{tenant.unit.sizeSqFt} sq ft</dd>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <dt className="text-sm font-semibold text-gray-800 mb-1">Status</dt>
                  <dd>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        tenant.unit.status === 'VACANT'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {tenant.unit.status}
                    </span>
                  </dd>
                </div>
              </div>
            </dl>
          </motion.div>
        )}
      </div>

      {/* Generate Invoice Dialog */}
      <Dialog open={showInvoiceDialog} onOpenChange={setShowInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Generate New Invoice</DialogTitle>
            <DialogDescription className="text-gray-700">
              Create a new invoice for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate" className="text-gray-900">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
                className="text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-900">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes for this invoice..."
                value={invoiceForm.notes}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                rows={3}
                className="text-gray-900 placeholder:text-gray-600"
              />
            </div>
            {/* Preview */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-200">
              <h4 className="font-semibold text-sm text-gray-900">Invoice Preview</h4>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Rent:</span>
                  <span className="font-bold text-gray-900">Ksh {tenant.rent.toLocaleString()}</span>
                </div>
                {tenant.serviceCharge && (
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">Service Charge:</span>
                    <span className="font-bold text-gray-900">
                      {tenant.serviceCharge.type === 'FIXED' && `Ksh ${tenant.serviceCharge.fixedAmount?.toLocaleString()}`}
                      {tenant.serviceCharge.type === 'PERCENTAGE' && `${tenant.serviceCharge.percentage}%`}
                    </span>
                  </div>
                )}
              </div>
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
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Generating...
                </>
              ) : (
                'Generate Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Generate Invoice for Partial Payment Dialog */}
      <Dialog open={showPartialPaymentInvoiceDialog} onOpenChange={setShowPartialPaymentInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Generate Balance Invoice</DialogTitle>
            <DialogDescription className="text-gray-700">
              Create an invoice for the outstanding balance from partial payment
            </DialogDescription>
          </DialogHeader>
          {selectedPartialPayment && (
            <div className="space-y-4 py-4">
              {/* Payment Info */}
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Payment Information</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-700">Period:</span>
                    <span className="font-medium text-gray-900">{selectedPartialPayment.paymentPeriod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Total Due:</span>
                    <span className="font-medium text-gray-900">Ksh {selectedPartialPayment.totalDue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">Amount Paid:</span>
                    <span className="font-medium text-green-600">Ksh {selectedPartialPayment.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300">
                    <span className="font-semibold text-gray-900">Outstanding Balance:</span>
                    <span className="font-bold text-red-600">Ksh {selectedPartialPayment.arrears.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-2">
                <Label htmlFor="partialDueDate" className="text-gray-900">Due Date *</Label>
                <Input
                  id="partialDueDate"
                  type="date"
                  value={partialInvoiceForm.dueDate}
                  onChange={(e) => setPartialInvoiceForm({ ...partialInvoiceForm, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partialNotes" className="text-gray-900">Notes (Optional)</Label>
                <Textarea
                  id="partialNotes"
                  placeholder="Add any additional notes for this balance invoice..."
                  value={partialInvoiceForm.notes}
                  onChange={(e) => setPartialInvoiceForm({ ...partialInvoiceForm, notes: e.target.value })}
                  rows={3}
                  className="text-gray-900 placeholder:text-gray-600"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPartialPaymentInvoiceDialog(false);
                setSelectedPartialPayment(null);
                setPartialInvoiceForm({ dueDate: '', notes: '' });
              }}
              disabled={generatingPartialInvoice}
            >
              Cancel
            </Button>
            <Button
              onClick={handleGeneratePartialPaymentInvoice}
              disabled={generatingPartialInvoice || !partialInvoiceForm.dueDate}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {generatingPartialInvoice ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Generating...
                </>
              ) : (
                'Generate Balance Invoice'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Payment Report Dialog */}
      <Dialog open={showCreatePaymentDialog} onOpenChange={setShowCreatePaymentDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <div className="shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900">Record Payment</DialogTitle>
              <DialogDescription className="text-gray-700">
                Create a new payment report for {tenant.fullName}
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="paymentPeriod" className="text-gray-900">Payment Period *</Label>
                <Input
                  id="paymentPeriod"
                  type="month"
                  value={paymentForm.paymentPeriod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentPeriod: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="datePaid" className="text-gray-900">Date Paid *</Label>
                <Input
                  id="datePaid"
                  type="date"
                  value={paymentForm.datePaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, datePaid: e.target.value })}
                  required
                  className="text-gray-900"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amountPaid" className="text-gray-900">Amount Paid *</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={paymentForm.amountPaid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amountPaid: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-900">Payment Status *</Label>
                <Select
                  value={paymentForm.status}
                  onValueChange={(value: PaymentStatus) => setPaymentForm({ ...paymentForm, status: value })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                    <SelectItem value="UNPAID">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentNotes" className="text-gray-900">Notes (Optional)</Label>
              <Textarea
                id="paymentNotes"
                placeholder="Add any additional notes about this payment..."
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                rows={3}
                className="text-gray-900 placeholder:text-gray-600"
              />
            </div>
            {/* Payment Preview */}
            <div className="bg-blue-50 rounded-lg p-4 space-y-3 border border-blue-200">
              <h4 className="font-semibold text-sm text-gray-900">Payment Calculation Preview</h4>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-900 font-medium">Rent:</span>
                  <span className="font-bold text-gray-900">Ksh {rent.toLocaleString()}</span>
                </div>
                {serviceCharge > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">Service Charge:</span>
                    <span className="font-bold text-gray-900">Ksh {serviceCharge.toLocaleString()}</span>
                  </div>
                )}
                {vat > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-900 font-medium">VAT ({tenant.vatRate}%):</span>
                    <span className="font-bold text-gray-900">Ksh {vat.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-blue-300">
                  <span className="font-semibold text-gray-900">Total Due:</span>
                  <span className="font-bold text-blue-700">Ksh {totalDue.toLocaleString()}</span>
                </div>
                {paymentForm.amountPaid && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Amount Paid:</span>
                      <span className="font-bold text-green-600">Ksh {parseFloat(paymentForm.amountPaid).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900 font-medium">Arrears:</span>
                      <span className={`font-bold ${Math.max(0, totalDue - parseFloat(paymentForm.amountPaid)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Ksh {Math.max(0, totalDue - parseFloat(paymentForm.amountPaid || '0')).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="shrink-0 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => setShowCreatePaymentDialog(false)}
              disabled={creatingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePayment}
              disabled={creatingPayment || !paymentForm.paymentPeriod || !paymentForm.datePaid || !paymentForm.amountPaid}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingPayment ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Recording...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoices List Dialog */}
      <Dialog open={showInvoicesList} onOpenChange={setShowInvoicesList}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Invoice History</DialogTitle>
            <DialogDescription className="text-gray-700">
              All invoices for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {invoicesLoading ? (
              <div className="flex justify-center py-8">
                <motion.div
                  className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            ) : invoices.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-700">No invoices generated yet</p>
              </div>
            ) : (
              invoices.map((invoice) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-lg text-gray-900">{invoice.invoiceNumber}</h4>
                      <p className="text-sm text-gray-700">{invoice.paymentPeriod}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-700">Issue Date</p>
                      <p className="font-medium text-gray-900">{new Date(invoice.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-700">Due Date</p>
                      <p className="font-medium text-gray-900">{new Date(invoice.dueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-700">Total Due</p>
                      <p className="font-semibold text-primary">Ksh {invoice.totalDue.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-700">Balance</p>
                      <p className={`font-semibold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        Ksh {invoice.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDownloadInvoice(invoice.id, invoice.invoiceNumber)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </Button>
                </motion.div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Reports Dialog - UPDATED WITH GENERATE INVOICE BUTTON */}
      <Dialog open={showPaymentReportsDialog} onOpenChange={setShowPaymentReportsDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Payment Reports</DialogTitle>
            <DialogDescription className="text-gray-700">
              Payment history for {tenant.fullName}
              {partialPaymentsCount > 0 && (
                <span className="ml-2 text-yellow-600 font-semibold">
                  ({partialPaymentsCount} payment{partialPaymentsCount > 1 ? 's' : ''} with balance)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Download PDF Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleDownloadPaymentReport}
                disabled={generatingPDF || paymentReports.length === 0}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {generatingPDF ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Rent Report
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadBillPaymentReport}
                disabled={generatingBillPDF || billInvoices.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generatingBillPDF ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Bills Report
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadComprehensiveReport}
                disabled={generatingComprehensivePDF || (paymentReports.length === 0 && billInvoices.length === 0)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {generatingComprehensivePDF ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Comprehensive
                  </>
                )}
              </Button>
            </div>
            {/* Payment Reports List */}
            <div className="space-y-3">
              {paymentReportsLoading ? (
                <div className="flex justify-center py-8">
                  <motion.div
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              ) : paymentReports.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-700 mb-4">No payment reports found</p>
                  <Button
                    onClick={() => {
                      setShowPaymentReportsDialog(false);
                      setShowCreatePaymentDialog(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Create First Payment Report
                  </Button>
                </div>
              ) : (
                paymentReports.map((report) => (
                  <motion.div
                    key={report.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{report.paymentPeriod}</h4>
                        <p className="text-sm text-gray-700">
                          Paid on: {new Date(report.datePaid).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        {/* NEW: Generate Invoice Button for Partial Payments */}
                        {report.status === 'PARTIAL' && report.arrears > 0 && (
                          <Button
                            onClick={() => openPartialPaymentInvoiceDialog(report)}
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-3 py-1 h-auto"
                          >
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Invoice Balance
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Rent</p>
                        <p className="font-semibold text-gray-900">Ksh {report.rent.toLocaleString()}</p>
                      </div>
                      {report.serviceCharge && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-700 text-xs mb-1">Service Charge</p>
                          <p className="font-semibold text-gray-900">Ksh {report.serviceCharge.toLocaleString()}</p>
                        </div>
                      )}
                      {report.vat && (
                        <div className="bg-gray-50 p-3 rounded">
                          <p className="text-gray-700 text-xs mb-1">VAT</p>
                          <p className="font-semibold text-gray-900">Ksh {report.vat.toLocaleString()}</p>
                        </div>
                      )}
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Total Due</p>
                        <p className="font-semibold text-blue-700">Ksh {report.totalDue.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Amount Paid</p>
                        <p className="font-semibold text-green-700">Ksh {report.amountPaid.toLocaleString()}</p>
                      </div>
                      <div className={`p-3 rounded ${report.arrears > 0 ? 'bg-red-50' : 'bg-gray-50'}`}>
                        <p className="text-gray-700 text-xs mb-1">Arrears</p>
                        <p className={`font-semibold ${report.arrears > 0 ? 'text-red-700' : 'text-gray-700'}`}>
                          Ksh {report.arrears.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {report.notes && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded">
                        <p className="text-xs text-gray-700 mb-1">Notes:</p>
                        <p className="text-sm text-gray-900">{report.notes}</p>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
            {/* Summary */}
            {paymentReports.length > 0 && (
              <div className="mt-6 p-6 bg-linear-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200">
                <h4 className="font-bold text-lg mb-4 text-gray-900">Payment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Expected</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Ksh {paymentReports.reduce((sum, r) => sum + r.totalDue, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      Ksh {paymentReports.reduce((sum, r) => sum + r.amountPaid, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Arrears</p>
                    <p className="text-2xl font-bold text-red-600">
                      Ksh {paymentReports.reduce((sum, r) => sum + r.arrears, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Invoices Dialog */}
      <Dialog open={showBillInvoicesDialog} onOpenChange={setShowBillInvoicesDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Bill Invoices</DialogTitle>
            <DialogDescription className="text-gray-700">
              Bill payment history for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Download PDF Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleDownloadBillPaymentReport}
                disabled={generatingBillPDF || billInvoices.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {generatingBillPDF ? (
                  <>
                    <motion.div
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Bill Report
                  </>
                )}
              </Button>
            </div>
            {/* Bill Invoices List */}
            <div className="space-y-3">
              {billInvoicesLoading ? (
                <div className="flex justify-center py-8">
                  <motion.div
                    className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
              ) : billInvoices.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-gray-700 mb-4">No bill invoices found</p>
                  <Button
                    onClick={() => router.push(`/properties/${params.id}/tenant-details/bills`)}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Go to Bills
                  </Button>
                </div>
              ) : (
                billInvoices.map((invoice) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-lg text-gray-900">{invoice.invoiceNumber}</h4>
                        <p className="text-sm text-gray-700">
                          {invoice.billType} - {new Date(invoice.issueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Units</p>
                        <p className="font-semibold text-gray-900">{invoice.units.toFixed(2)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Rate</p>
                        <p className="font-semibold text-gray-900">Ksh {invoice.chargePerUnit.toFixed(2)}</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Total Amount</p>
                        <p className="font-semibold text-blue-700">Ksh {invoice.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-gray-700 text-xs mb-1">Amount Paid</p>
                        <p className="font-semibold text-green-700">Ksh {invoice.amountPaid.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-700">Due Date: {new Date(invoice.dueDate).toLocaleDateString()}</p>
                        <p className={`text-sm font-semibold ${invoice.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          Balance: Ksh {invoice.balance.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        onClick={async () => {
                          try {
                            const blob = await billInvoicesAPI.download(invoice.id);
                            const url = window.URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${invoice.invoiceNumber}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            window.URL.revokeObjectURL(url);
                            toast.success('Bill invoice downloaded successfully');
                          } catch (error) {
                            console.error('Error downloading bill invoice:', error);
                            toast.error('Failed to download bill invoice');
                          }
                        }}
                        variant="outline"
                        size="sm"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download PDF
                      </Button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            {/* Summary */}
            {billInvoices.length > 0 && (
              <div className="mt-6 p-6 bg-linear-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200">
                <h4 className="font-bold text-lg mb-4 text-gray-900">Bill Payment Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Bills</p>
                    <p className="text-2xl font-bold text-gray-900">
                      Ksh {billInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">
                      Ksh {billInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700 mb-1">Total Balance</p>
                    <p className="text-2xl font-bold text-red-600">
                      Ksh {billInvoices.reduce((sum, inv) => sum + inv.balance, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
