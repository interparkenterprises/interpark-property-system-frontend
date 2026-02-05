'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Bill, BillType, BillStatus, Tenant, BillInvoice, InvoiceStatus, PaymentPolicy } from '@/types';
import { billsAPI, tenantsAPI, billInvoicesAPI, invoicesAPI } from '@/lib/api';
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

interface BillFormData {
  type: BillType;
  description: string;
  previousReading: string;
  currentReading: string;
  chargePerUnit: string;
  vatRate: string;
  dueDate: string;
  notes: string;
}

interface BillInvoiceFormData {
  dueDate: string;
  notes: string;
}

export default function TenantBillsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [billInvoices, setBillInvoices] = useState<BillInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billInvoicesLoading, setBillInvoicesLoading] = useState(false);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [showGenerateInvoiceDialog, setShowGenerateInvoiceDialog] = useState(false);
  const [showBillInvoicesDialog, setShowBillInvoicesDialog] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedBillInvoice, setSelectedBillInvoice] = useState<BillInvoice | null>(null);
  const [loadingLastBill, setLoadingLastBill] = useState(false);
  const [previousReadingAutoFilled, setPreviousReadingAutoFilled] = useState(false);

  // Form states
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [paying, setPaying] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');

  const [billForm, setBillForm] = useState<BillFormData>({
    type: 'WATER',
    description: '',
    previousReading: '',
    currentReading: '',
    chargePerUnit: '',
    vatRate: '16',
    dueDate: '',
    notes: '',
  });

  const [billInvoiceForm, setBillInvoiceForm] = useState<BillInvoiceFormData>({
    dueDate: '',
    notes: '',
  });
  // Add these with your other state declarations around line 65
  const [lastBillInfo, setLastBillInfo] = useState<{
    lastBill: {
      id: string;
      currentReading: number;
      issuedAt: string;
      units: number;
      totalAmount: number;
      dueDate: string;
      status: BillStatus;
    };
    suggestedPreviousReading: number;
    daysSinceLastBill: number;
  } | null>(null);


  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBills, setTotalBills] = useState(0);

  useEffect(() => {
    fetchTenant();
    fetchBills();
    fetchBillInvoices();
  }, [tenantId, currentPage]);

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

  const fetchBills = async () => {
    try {
      setBillsLoading(true);
      const response = await billsAPI.getByTenant(tenantId, {
        page: currentPage,
        limit: 10,//adjust limit as needed to get more/all bills
      });
      setBills(response.bills);
      setTotalPages(response.pagination.totalPages);
      setTotalBills(response.pagination.total);
    } catch (error) {
      console.error('Error fetching bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setBillsLoading(false);
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

  const resetBillForm = () => {
    setBillForm({
      type: 'WATER',
      description: '',
      previousReading: '',
      currentReading: '',
      chargePerUnit: '',
      vatRate: '16',
      dueDate: '',
      notes: '',
    });
  };

  const resetBillInvoiceForm = () => {
    setBillInvoiceForm({
      dueDate: '',
      notes: '',
    });
  };

  const handleCreateBill = async () => {
    if (!billForm.previousReading || !billForm.currentReading || !billForm.chargePerUnit) {
      toast.error('Please fill in all required fields');
      return;
    }
    const currentReading = parseFloat(billForm.currentReading);
    const previousReading = parseFloat(billForm.previousReading);
    if (currentReading < previousReading) {
      toast.error('Current reading must be greater than previous reading');
      return;
    }
    try {
      setCreating(true);
      await billsAPI.create({
        tenantId,
        type: billForm.type,
        description: billForm.description || undefined,
        previousReading: parseFloat(billForm.previousReading),
        currentReading: parseFloat(billForm.currentReading),
        chargePerUnit: parseFloat(billForm.chargePerUnit),
        vatRate: billForm.vatRate ? parseFloat(billForm.vatRate) : undefined,
        dueDate: billForm.dueDate || undefined,
        notes: billForm.notes || undefined,
      });
      toast.success('Bill created successfully!');
      setShowCreateDialog(false);
      resetBillForm();
      fetchBills();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error('Failed to create bill');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateBill = async () => {
    if (!selectedBill) return;
    if (!billForm.previousReading || !billForm.currentReading || !billForm.chargePerUnit) {
      toast.error('Please fill in all required fields');
      return;
    }
    const currentReading = parseFloat(billForm.currentReading);
    const previousReading = parseFloat(billForm.previousReading);
    if (currentReading < previousReading) {
      toast.error('Current reading must be greater than previous reading');
      return;
    }
    try {
      setUpdating(true);
      await billsAPI.update(selectedBill.id, {
        type: billForm.type,
        description: billForm.description || undefined,
        previousReading: parseFloat(billForm.previousReading),
        currentReading: parseFloat(billForm.currentReading),
        chargePerUnit: parseFloat(billForm.chargePerUnit),
        vatRate: billForm.vatRate ? parseFloat(billForm.vatRate) : undefined,
        dueDate: billForm.dueDate || undefined,
        notes: billForm.notes || undefined,
      });
      toast.success('Bill updated successfully!');
      setShowEditDialog(false);
      setSelectedBill(null);
      resetBillForm();
      fetchBills();
    } catch (error) {
      console.error('Error updating bill:', error);
      toast.error('Failed to update bill');
    } finally {
      setUpdating(false);
    }
  };

  const handlePayBill = async () => {
    if (!selectedBill) return;
    
    // Parse the payment amount with proper float handling
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    // Calculate remaining balance with proper rounding
    const remainingBalance = selectedBill.grandTotal - (selectedBill.amountPaid || 0);
    
    // Use a tolerance of 0.01 for floating point precision issues
    const tolerance = 0.01;
    const roundedRemainingBalance = Math.round(remainingBalance * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Check if payment exceeds remaining balance (with tolerance)
    if (roundedAmount > roundedRemainingBalance + tolerance) {
      toast.error(`Payment amount cannot exceed the remaining balance of Ksh ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }
    
    // Check if amount is effectively the same as remaining balance (within tolerance)
    const isFullPayment = Math.abs(roundedAmount - roundedRemainingBalance) <= tolerance;
    
    // If it's a full payment, use the exact remaining balance to avoid floating point issues
    const finalPaymentAmount = isFullPayment ? remainingBalance : amount;
    
    try {
      setPaying(true);
      
      // Send payment with properly rounded amount
      const response = await billsAPI.payBill(selectedBill.id, { 
        amount: parseFloat(finalPaymentAmount.toFixed(2))
      });
      
      if (response.success) {
        toast.success(response.message || 'Payment recorded successfully!');
        setShowPayDialog(false);
        setSelectedBill(null);
        setPaymentAmount('');
        fetchBills();
        fetchBillInvoices();
      } else {
        toast.error(response.message || 'Failed to record payment');
      }
    } catch (error: any) {
      console.error('Error paying bill:', error);
      
      // Provide more specific error messages
      if (error.message?.includes('exceeds bill total') || error.message?.includes('maximum payment')) {
        toast.error(error.message);
      } else if (error.message?.includes('Duplicate payment')) {
        toast.error('This payment appears to have already been processed');
      } else if (error.message?.includes('precision') || error.message?.includes('decimal')) {
        // Handle decimal precision errors
        toast.error('Please enter payment amount with up to 2 decimal places');
      } else {
        toast.error('Failed to record payment. Please try again.');
      }
    } finally {
      setPaying(false);
    }
  };
  const fetchLastBillInfo = async (type: BillType) => {
    if (!tenantId) return;
    
    setLoadingLastBill(true);
    setPreviousReadingAutoFilled(false);
    
    try {
      const response = await billsAPI.getLastBillInfo(tenantId, type);
      
      if (response.success && response.data) {
        setLastBillInfo(response.data);
        
        // Auto-fill the previous reading
        setBillForm(prev => ({
          ...prev,
          previousReading: response.data.suggestedPreviousReading.toString()
        }));
        setPreviousReadingAutoFilled(true);
        
        toast.success(`Previous reading auto-filled from last ${type} bill`);
      }
    } catch (error: any) {
      console.log('No previous bill found:', error);
      setLastBillInfo(null);
      setPreviousReadingAutoFilled(false);
      
      // Clear previous reading if no last bill found
      setBillForm(prev => ({
        ...prev,
        previousReading: ''
      }));
      
      // Only show toast if it's not a 404 (no previous bill is expected for first bill)
      if (error?.response?.status !== 404) {
        toast.error('Failed to fetch previous bill info');
      }
    } finally {
      setLoadingLastBill(false);
    }
  };

  const handleRecordBillInvoicePayment = async () => {
    if (!selectedBillInvoice) return;
    
    // Parse the payment amount with proper float handling
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    
    // Calculate remaining balance with proper rounding
    const remainingBalance = selectedBillInvoice.grandTotal - selectedBillInvoice.amountPaid;
    
    // Use a tolerance of 0.01 for floating point precision issues
    const tolerance = 0.01;
    const roundedRemainingBalance = Math.round(remainingBalance * 100) / 100;
    const roundedAmount = Math.round(amount * 100) / 100;
    
    // Check if payment exceeds remaining balance (with tolerance)
    if (roundedAmount > roundedRemainingBalance + tolerance) {
      toast.error(`Payment amount cannot exceed the remaining balance of Ksh ${remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`);
      return;
    }
    
    // Check if amount is effectively the same as remaining balance (within tolerance)
    const isFullPayment = Math.abs(roundedAmount - roundedRemainingBalance) <= tolerance;
    
    // If it's a full payment, use the exact remaining balance to avoid floating point issues
    const finalPaymentAmount = isFullPayment ? remainingBalance : amount;
    
    try {
      setRecordingPayment(true);
      
      await billInvoicesAPI.recordPayment(selectedBillInvoice.id, {
        amountPaid: parseFloat(finalPaymentAmount.toFixed(2)),
        paymentDate: new Date().toISOString().split('T')[0],
        notes: `Payment recorded for bill invoice ${selectedBillInvoice.invoiceNumber}`
      });
      
      toast.success('Payment recorded successfully!');
      setShowPayDialog(false);
      setSelectedBillInvoice(null);
      setPaymentAmount('');
      fetchBillInvoices();
    } catch (error: any) {
      console.error('Error recording bill invoice payment:', error);
      
      // Handle specific error cases
      if (error.message?.includes('precision') || error.message?.includes('decimal')) {
        toast.error('Please enter payment amount with up to 2 decimal places');
      } else {
        toast.error('Failed to record payment');
      }
    } finally {
      setRecordingPayment(false);
    }
  };

  const handleGenerateBillInvoice = async () => {
    if (!selectedBill || !tenant) return;
    if (!billInvoiceForm.dueDate) {
        toast.error('Please select a due date');
        return;
    }

    // Calculate remaining balance
    const remainingBalance = selectedBill.grandTotal - (selectedBill.amountPaid || 0);
    
    if (remainingBalance <= 0) {
        toast.error('This bill is already fully paid. No invoice needed.');
        return;
    }

    try {
        setGeneratingInvoice(true);
        
        // Payment now occurs monthly by default, no need to pass paymentPolicy
        const response = await billInvoicesAPI.generate({
          billId: selectedBill.id,
          dueDate: billInvoiceForm.dueDate,
          notes: billInvoiceForm.notes || `Invoice for remaining balance of Ksh ${remainingBalance.toLocaleString()}`
          // Removed: paymentPolicy: paymentPolicy
        });
        
        toast.success('Bill invoice generated successfully!');
        setShowGenerateInvoiceDialog(false);
        setSelectedBill(null);
        resetBillInvoiceForm();
        fetchBillInvoices();
        
        // If this was a partial payment invoice, also refresh bills to show updated status
        if (remainingBalance < selectedBill.grandTotal) {
          fetchBills();
        }
    } catch (error: any) {
        console.error('Error generating bill invoice:', error);
        
        // Provide specific error messages
        if (error.message?.includes('already fully paid')) {
        toast.error('This bill is already fully paid and cannot generate an invoice');
        } else if (error.message?.includes('No balance remaining')) {
        toast.error('No balance remaining for invoice generation');
        } else {
        toast.error('Failed to generate bill invoice');
        }
    } finally {
        setGeneratingInvoice(false);
    }
  };

  const handleDeleteBill = async (billId: string) => {
    if (!confirm('Are you sure you want to delete this bill?')) return;
    try {
      await billsAPI.delete(billId);
      toast.success('Bill deleted successfully!');
      fetchBills();
    } catch (error) {
      console.error('Error deleting bill:', error);
      toast.error('Failed to delete bill');
    }
  };

  const handleDownloadBillInvoice = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const blob = await billInvoicesAPI.download(invoiceId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Bill invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading bill invoice:', error);
      toast.error('Failed to download bill invoice');
    }
  };

  const openEditDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setBillForm({
      type: bill.type,
      description: bill.description || '',
      previousReading: bill.previousReading.toString(),
      currentReading: bill.currentReading.toString(),
      chargePerUnit: bill.chargePerUnit.toString(),
      vatRate: bill.vatRate?.toString() || '16',
      dueDate: bill.dueDate ? new Date(bill.dueDate).toISOString().split('T')[0] : '',
      notes: bill.notes || '',
    });
    setShowEditDialog(true);
  };

  const openPayDialog = (bill: Bill) => {
    setSelectedBill(bill);
    setSelectedBillInvoice(null);
    setPaymentAmount('');
    setShowPayDialog(true);
  };

  const openPayBillInvoiceDialog = (invoice: BillInvoice) => {
    setSelectedBillInvoice(invoice);
    setSelectedBill(null);
    setPaymentAmount('');
    setShowPayDialog(true);
  };

  const openGenerateInvoiceDialog = (bill: Bill) => {
    setSelectedBill(bill);
    resetBillInvoiceForm();
    
    // Set default due date based on tenant's payment policy
    if (tenant) {
      const today = new Date();
      let dueDate = new Date();
      
      // Set due date based on payment policy
      switch (tenant.paymentPolicy) {
        case 'MONTHLY':
          dueDate.setMonth(today.getMonth() + 1);
          break;
        case 'QUARTERLY':
          dueDate.setMonth(today.getMonth() + 3);
          break;
        case 'ANNUAL':
          dueDate.setFullYear(today.getFullYear() + 1);
          break;
        default:
          dueDate.setMonth(today.getMonth() + 1); // Default to monthly
      }
      
      setBillInvoiceForm(prev => ({
        ...prev,
        dueDate: dueDate.toISOString().split('T')[0]
      }));
    }
    
    setShowGenerateInvoiceDialog(true);
  };

  const getStatusColor = (status: BillStatus | InvoiceStatus) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'PARTIAL':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'UNPAID':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'OVERDUE':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getBillTypeIcon = (type: BillType) => {
    switch (type) {
      case 'WATER':
        return (
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        );
      case 'ELECTRICITY':
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getPaymentPolicyColor = (policy: PaymentPolicy) => {
    switch (policy) {
      case 'MONTHLY':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'QUARTERLY':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ANNUAL':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
          <p className="text-lg font-medium text-gray-800">Loading bills...</p>
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

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="space-y-8 p-6 md:p-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Tenant Details
          </Button>
          <h1 className="text-3xl md:text-4xl font-bold text-heading-color">Bills for {tenant.fullName}</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-gray-600">Manage water and electricity bills</p>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
              Payment Policy: MONTHLY
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowBillInvoicesDialog(true)}
            variant="outline"
            className="px-6 py-3 border-2 border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            View Bill Invoices ({billInvoices.length})
          </Button>
          <Button
            onClick={() => {
              resetBillForm();
              setShowCreateDialog(true);
              setTimeout(() => fetchLastBillInfo('WATER'), 0);
            }}
            className="px-6 py-3 bg-primary text-white hover:bg-primary/90"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Bill
          </Button>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Total Bills</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalBills}</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Paid Bills</h3>
          </div>
          <p className="text-3xl font-bold text-green-600">
            {bills.filter(b => b.status === 'PAID').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Unpaid Bills</h3>
          </div>
          <p className="text-3xl font-bold text-red-600">
            {bills.filter(b => b.status === 'UNPAID' || b.status === 'OVERDUE').length}
          </p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Total Amount</h3>
          </div>
          <p className="text-3xl font-bold text-purple-600">
            Ksh {bills.reduce((sum, b) => sum + b.grandTotal, 0).toLocaleString()}
          </p>
        </div>
      </motion.div>

      {/* Bills Table */}
      <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-heading-color">Bills History</h2>
          <p className="text-sm text-gray-600 mt-1">
            Tenant Payment Policy: <span className="font-semibold">Monthly</span>
          </p>
        </div>
        {billsLoading ? (
          <div className="flex justify-center py-12">
            <motion.div
              className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          </div>
        ) : bills.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-600">No bills found</p>
            <Button onClick={() => setShowCreateDialog(true)} className="mt-4">
              Create Your First Bill
            </Button>
          </div>
        ) : (
          <>
            {/* Horizontal Scroll Container */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Readings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Units</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Balance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Due Date</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => {
                    const balance = bill.grandTotal - (bill.amountPaid || 0);
                    const isFullyPaid = bill.status === 'PAID';
                    const isCancelled = bill.status === 'CANCELLED';
                    const isPartial = bill.status === 'PARTIAL';
                    const isUnpaidOrOverdue = bill.status === 'UNPAID' || bill.status === 'OVERDUE';

                    let balanceDisplay = '0.00';
                    if (isPartial) {
                      balanceDisplay = balance.toFixed(2);
                    } else if (isUnpaidOrOverdue) {
                      balanceDisplay = bill.grandTotal.toFixed(2);
                    }

                    const showPayButton = !isFullyPaid && !isCancelled;
                    const showGenerateInvoiceButton = !isCancelled;

                    return (
                      <tr key={bill.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center gap-2">
                            {getBillTypeIcon(bill.type)}
                            <span className="font-medium">{bill.type}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(bill.issuedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="text-gray-600">Prev: {bill.previousReading}</div>
                          <div className="font-medium text-gray-900">Curr: {bill.currentReading}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{bill.units}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Ksh {bill.chargePerUnit.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="font-medium text-gray-900">Ksh {bill.totalAmount.toLocaleString()}</div>
                          {bill.vatAmount && (
                            <div className="text-gray-600 text-xs">
                              +VAT: Ksh {bill.vatAmount.toLocaleString()}
                            </div>
                          )}
                          <div className="font-bold text-primary">
                            Total: Ksh {bill.grandTotal.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {isFullyPaid || isCancelled ? (
                            <span className="text-green-600">0.00</span>
                          ) : isPartial ? (
                            <span className="text-yellow-600">Ksh {parseFloat(balanceDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : isUnpaidOrOverdue ? (
                            <span className="text-red-600">Ksh {parseFloat(balanceDisplay).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          ) : (
                            <span>N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bill.dueDate ? (
                            <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex items-center justify-end gap-2">
                            {showGenerateInvoiceButton && (
                              <Button
                                onClick={() => openGenerateInvoiceDialog(bill)}
                                size="sm"
                                variant="outline"
                                className="text-purple-600 hover:bg-purple-50"
                              >
                                Generate Invoice
                              </Button>
                            )}
                            {showPayButton && (
                              <Button
                                onClick={() => openPayDialog(bill)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Pay
                              </Button>
                            )}
                            <Button
                              onClick={() => openEditDialog(bill)}
                              size="sm"
                              variant="outline"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteBill(bill.id)}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>

      {/* Create Bill Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Create New Bill</DialogTitle>
            <DialogDescription className="text-gray-700">
              Generate a new utility bill for {tenant.fullName}
            </DialogDescription>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                Payment Policy: MONTHLY
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-gray-900">Bill Type *</Label>
                <Select
                  value={billForm.type}
                  onValueChange={(value: BillType) => {
                    setBillForm({ ...billForm, type: value });
                    // Fetch last bill info when type changes
                    fetchLastBillInfo(value);
                  }}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WATER" className="text-gray-900">Water</SelectItem>
                    <SelectItem value="ELECTRICITY" className="text-gray-900">Electricity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-gray-900">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                  className="text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-900">Description</Label>
              <Input
                id="description"
                placeholder="e.g., January 2024 Water Bill"
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="previousReading" className="text-gray-900">
                    Previous Reading *
                  </Label>
                  {previousReadingAutoFilled && (
                    <span className="text-xs text-green-600 font-medium flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Auto-filled
                    </span>
                  )}
                  {loadingLastBill && (
                    <span className="text-xs text-blue-600 flex items-center">
                      <motion.div
                        className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full mr-1"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Fetching...
                    </span>
                  )}
                </div>
                <Input
                  id="previousReading"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.previousReading}
                  onChange={(e) => {
                    setBillForm({ ...billForm, previousReading: e.target.value });
                    setPreviousReadingAutoFilled(false); // User manually editing
                  }}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
                
                {/* Display last bill info if available */}
                {lastBillInfo && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 font-medium mb-1">Last {billForm.type} Bill Information</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                      <div>
                        <span className="text-blue-500">Last Reading:</span>{' '}
                        <span className="font-semibold">{lastBillInfo.lastBill.currentReading}</span>
                      </div>
                      <div>
                        <span className="text-blue-500">Date:</span>{' '}
                        <span>{new Date(lastBillInfo.lastBill.issuedAt).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-blue-500">Units Used:</span>{' '}
                        <span className="font-semibold">{lastBillInfo.lastBill.units}</span>
                      </div>
                      <div>
                        <span className="text-blue-500">Days Ago:</span>{' '}
                        <span>{lastBillInfo.daysSinceLastBill}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show message if no previous bill found */}
                {!lastBillInfo && !loadingLastBill && billForm.previousReading === '' && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                    <span className="font-medium">No previous {billForm.type} bill found.</span> Please enter the previous reading manually.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="currentReading" className="text-gray-900">Current Reading *</Label>
                <Input
                  id="currentReading"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.currentReading}
                  onChange={(e) => setBillForm({ ...billForm, currentReading: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="chargePerUnit" className="text-gray-900">Charge per Unit (Ksh) *</Label>
                <Input
                  id="chargePerUnit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.chargePerUnit}
                  onChange={(e) => setBillForm({ ...billForm, chargePerUnit: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vatRate" className="text-gray-900">VAT Rate (%)</Label>
                <Input
                  id="vatRate"
                  type="number"
                  step="0.01"
                  placeholder="16"
                  value={billForm.vatRate}
                  onChange={(e) => setBillForm({ ...billForm, vatRate: e.target.value })}
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-gray-900">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={billForm.notes}
                onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                rows={3}
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {billForm.previousReading && billForm.currentReading && billForm.chargePerUnit && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Calculation Preview</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const prev = parseFloat(billForm.previousReading) || 0;
                    const curr = parseFloat(billForm.currentReading) || 0;
                    const rate = parseFloat(billForm.chargePerUnit) || 0;
                    const vatRate = parseFloat(billForm.vatRate) || 0;
                    const units = Math.max(0, curr - prev);
                    const totalAmount = units * rate;
                    const vatAmount = (totalAmount * vatRate) / 100;
                    const grandTotal = totalAmount + vatAmount;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-900">Units Consumed:</span>
                          <span className="font-medium text-gray-900">{units.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-900">Total Amount:</span>
                          <span className="font-medium text-gray-900">Ksh {totalAmount.toLocaleString()}</span>
                        </div>
                        {vatAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-900">VAT ({vatRate}%):</span>
                            <span className="font-medium text-gray-900">Ksh {vatAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Grand Total:</span>
                          <span className="font-bold text-primary">Ksh {grandTotal.toLocaleString()}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetBillForm();
                setLastBillInfo(null);
                setPreviousReadingAutoFilled(false);
              }}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateBill}
              disabled={creating}
              className="bg-primary hover:bg-primary/90"
            >
              {creating ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Creating...
                </>
              ) : (
                'Create Bill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Bill Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Edit Bill</DialogTitle>
            <DialogDescription className="text-gray-700">
              Update bill details for {tenant.fullName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-gray-900">Bill Type *</Label>
                <Select
                  value={billForm.type}
                  onValueChange={(value: BillType) => setBillForm({ ...billForm, type: value })}
                >
                  <SelectTrigger className="text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WATER" className="text-gray-900">Water</SelectItem>
                    <SelectItem value="ELECTRICITY" className="text-gray-900">Electricity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate" className="text-gray-900">Due Date</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={billForm.dueDate}
                  onChange={(e) => setBillForm({ ...billForm, dueDate: e.target.value })}
                  className="text-gray-900"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description" className="text-gray-900">Description</Label>
              <Input
                id="edit-description"
                placeholder="e.g., January 2024 Water Bill"
                value={billForm.description}
                onChange={(e) => setBillForm({ ...billForm, description: e.target.value })}
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-previousReading" className="text-gray-900">Previous Reading *</Label>
                <Input
                  id="edit-previousReading"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.previousReading}
                  onChange={(e) => setBillForm({ ...billForm, previousReading: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-currentReading" className="text-gray-900">Current Reading *</Label>
                <Input
                  id="edit-currentReading"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.currentReading}
                  onChange={(e) => setBillForm({ ...billForm, currentReading: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-chargePerUnit" className="text-gray-900">Charge per Unit (Ksh) *</Label>
                <Input
                  id="edit-chargePerUnit"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={billForm.chargePerUnit}
                  onChange={(e) => setBillForm({ ...billForm, chargePerUnit: e.target.value })}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vatRate" className="text-gray-900">VAT Rate (%)</Label>
                <Input
                  id="edit-vatRate"
                  type="number"
                  step="0.01"
                  placeholder="16"
                  value={billForm.vatRate}
                  onChange={(e) => setBillForm({ ...billForm, vatRate: e.target.value })}
                  className="text-gray-900 placeholder:text-gray-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes" className="text-gray-900">Notes</Label>
              <Textarea
                id="edit-notes"
                placeholder="Add any additional notes..."
                value={billForm.notes}
                onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                rows={3}
                className="text-gray-900 placeholder:text-gray-500"
              />
            </div>
            {billForm.previousReading && billForm.currentReading && billForm.chargePerUnit && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">Calculation Preview</h4>
                <div className="text-sm space-y-1">
                  {(() => {
                    const prev = parseFloat(billForm.previousReading) || 0;
                    const curr = parseFloat(billForm.currentReading) || 0;
                    const rate = parseFloat(billForm.chargePerUnit) || 0;
                    const vatRate = parseFloat(billForm.vatRate) || 0;
                    const units = Math.max(0, curr - prev);
                    const totalAmount = units * rate;
                    const vatAmount = (totalAmount * vatRate) / 100;
                    const grandTotal = totalAmount + vatAmount;
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-900">Units Consumed:</span>
                          <span className="font-medium text-gray-900">{units.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-900">Total Amount:</span>
                          <span className="font-medium text-gray-900">Ksh {totalAmount.toLocaleString()}</span>
                        </div>
                        {vatAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-900">VAT ({vatRate}%):</span>
                            <span className="font-medium text-gray-900">Ksh {vatAmount.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-200">
                          <span className="font-semibold text-gray-900">Grand Total:</span>
                          <span className="font-bold text-primary">Ksh {grandTotal.toLocaleString()}</span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedBill(null);
                resetBillForm();
              }}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateBill}
              disabled={updating}
              className="bg-primary hover:bg-primary/90"
            >
              {updating ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Updating...
                </>
              ) : (
                'Update Bill'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Bill Dialog */}
      <Dialog open={showPayDialog} onOpenChange={setShowPayDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {selectedBillInvoice ? 'Record Bill Invoice Payment' : 'Record Bill Payment'}
            </DialogTitle>
            <DialogDescription className="text-gray-700">
              {selectedBillInvoice 
                ? `Record payment for bill invoice ${selectedBillInvoice.invoiceNumber}`
                : `Record payment for ${selectedBill?.type} bill`}
            </DialogDescription>
          </DialogHeader>
          {(selectedBill || selectedBillInvoice) && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                {selectedBill && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Bill Type:</span>
                      <span className="font-medium text-gray-900">{selectedBill.type}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Units:</span>
                      <span className="font-medium text-gray-900">{selectedBill.units}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Grand Total:</span>
                      <span className="font-bold text-primary">Ksh {selectedBill.grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-900">Current Balance:</span>
                      <span className="font-bold text-yellow-600">Ksh {(selectedBill.grandTotal - (selectedBill.amountPaid || 0)).toLocaleString()}</span>
                    </div>
                  </>
                )}
                {selectedBillInvoice && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Invoice Number:</span>
                      <span className="font-medium text-gray-900">{selectedBillInvoice.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Bill Type:</span>
                      <span className="font-medium text-gray-900">{selectedBillInvoice.billType}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-900">Grand Total:</span>
                      <span className="font-bold text-primary">Ksh {selectedBillInvoice.grandTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-gray-900">Current Balance:</span>
                      <span className="font-bold text-yellow-600">Ksh {(selectedBillInvoice.grandTotal - selectedBillInvoice.amountPaid).toLocaleString()}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentAmount" className="text-gray-900">Payment Amount (Ksh) *</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className="text-gray-900 placeholder:text-gray-500"
                />
                <p className="text-xs text-gray-600">
                  Maximum: Ksh {
                    selectedBill 
                      ? (selectedBill.grandTotal - (selectedBill.amountPaid || 0)).toLocaleString()
                      : selectedBillInvoice
                      ? (selectedBillInvoice.grandTotal - selectedBillInvoice.amountPaid).toLocaleString()
                      : '0'
                  }
                </p>
              </div>
              {paymentAmount && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Payment Status:</p>
                  <p className="text-lg font-bold text-blue-700">
                    {parseFloat(paymentAmount) >= (
                      selectedBill 
                        ? selectedBill.grandTotal - (selectedBill.amountPaid || 0)
                        : selectedBillInvoice
                        ? selectedBillInvoice.grandTotal - selectedBillInvoice.amountPaid
                        : 0
                    )
                      ? 'PAID IN FULL'
                      : 'PARTIAL PAYMENT'}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPayDialog(false);
                setSelectedBill(null);
                setSelectedBillInvoice(null);
                setPaymentAmount('');
              }}
              disabled={(paying || recordingPayment) || !paymentAmount || parseFloat(paymentAmount) <= 0}
            >
              Cancel
            </Button>
            <Button
              onClick={selectedBillInvoice ? handleRecordBillInvoicePayment : handlePayBill}
              disabled={(paying || recordingPayment) || !paymentAmount}
              className="bg-green-600 hover:bg-green-700"
            >
              {(paying || recordingPayment) ? (
                <>
                  <motion.div
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  />
                  Processing...
                </>
              ) : (
                'Record Payment'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Bill Invoice Dialog */}
      <Dialog open={showGenerateInvoiceDialog} onOpenChange={setShowGenerateInvoiceDialog}>
        <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Generate Bill Invoice</DialogTitle>
            <DialogDescription className="text-gray-700">
                Create an invoice for {selectedBill?.type} bill
            </DialogDescription>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                Payment Policy: MONTHLY
              </span>
            </div>
            </DialogHeader>
            {selectedBill && (
            <div className="space-y-4 py-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Bill Type:</span>
                    <span className="font-medium text-gray-900">{selectedBill.type}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Units:</span>
                    <span className="font-medium text-gray-900">{selectedBill.units}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Original Total:</span>
                    <span className="font-medium text-gray-900">Ksh {selectedBill.grandTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-900">Amount Paid:</span>
                    <span className="font-medium text-green-600">Ksh {(selectedBill.amountPaid || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t pt-2">
                    <span className="text-gray-900">Remaining Balance:</span>
                    <span className="font-bold text-blue-600">
                    Ksh {(selectedBill.grandTotal - (selectedBill.amountPaid || 0)).toLocaleString()}
                    </span>
                </div>
                {(selectedBill.amountPaid || 0) > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
                    <div className="flex items-center text-sm text-yellow-800">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                        This invoice will be generated for the remaining balance only
                    </div>
                    </div>
                )}
                </div>
                <div className="space-y-2">
                <Label htmlFor="invoiceDueDate" className="text-gray-900">Due Date *</Label>
                <Input
                    id="invoiceDueDate"
                    type="date"
                    value={billInvoiceForm.dueDate}
                    onChange={(e) => setBillInvoiceForm({ ...billInvoiceForm, dueDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    className="text-gray-900"
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="invoiceNotes" className="text-gray-900">Notes (Optional)</Label>
                <Textarea
                    id="invoiceNotes"
                    placeholder="Add any additional notes for this invoice..."
                    value={billInvoiceForm.notes}
                    onChange={(e) => setBillInvoiceForm({ ...billInvoiceForm, notes: e.target.value })}
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
                setShowGenerateInvoiceDialog(false);
                setSelectedBill(null);
                resetBillInvoiceForm();
                }}
                disabled={generatingInvoice}
            >
                Cancel
            </Button>
            <Button
                onClick={handleGenerateBillInvoice}
                disabled={generatingInvoice || !billInvoiceForm.dueDate}
                className="bg-purple-600 hover:bg-purple-700"
            >
                {generatingInvoice ? (
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

      {/* Bill Invoices Dialog */}
      <Dialog open={showBillInvoicesDialog} onOpenChange={setShowBillInvoicesDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900">Bill Invoices</DialogTitle>
            <DialogDescription className="text-gray-700">
              Bill invoice history for {tenant.fullName}
            </DialogDescription>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPaymentPolicyColor(tenant.paymentPolicy)}`}>
                Payment Policy: MONTHLY
              </span>
            </div>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
                  <p className="text-gray-700">No bill invoices generated yet</p>
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
                      <div className="flex gap-2">
                        {invoice.balance > 0 && (
                          <Button
                            onClick={() => openPayBillInvoiceDialog(invoice)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Pay
                          </Button>
                        )}
                        <Button
                          onClick={() => handleDownloadBillInvoice(invoice.id, invoice.invoiceNumber)}
                          variant="outline"
                          size="sm"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}