export interface User {
  id: string;
  name: string;
  email: string;

  role: 'ADMIN' | 'MANAGER';
  createdAt: string;
  updatedAt: string;
  properties?: Property[];
  todos?: ToDo[];
  commissions?: ManagerCommission[];
}

export interface Landlord {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  idNumber?: string;
  properties?: Property[];
  offerLetters?: OfferLetter[];
  createdAt: string;
  updatedAt: string;
}

export type PropertyForm = 
  | 'APARTMENT'
  | 'BUNGALOW'
  | 'VILLA'
  | 'OFFICE'
  | 'SHOP'
  | 'DUPLEX'
  | 'TOWNHOUSE'
  | 'MAISONETTE'
  | 'WAREHOUSE'
  | 'INDUSTRIAL_BUILDING'
  | 'RETAIL_CENTER';

export type UsageType = 
  | 'RESIDENTIAL'
  | 'COMMERCIAL'
  | 'INDUSTRIAL'
  | 'INSTITUTIONAL'
  | 'MIXED_USE';

export interface Property {
  id: string;
  name: string;
  address: string;
  lrNumber?: string;
  form: PropertyForm;
  usage: UsageType;
  landlordId?: string;
  landlord?: Landlord;
  managerId?: string;
  manager?: User;
  commissionFee?: number;
  image?: string;
  
  // Bank details
  accountNo?: string;
  accountName?: string;
  bank?: string;
  branch?: string;
  branchCode?: string;

  createdAt: string;
  updatedAt: string;
  units?: Unit[];
  serviceProviders?: ServiceProvider[];
  leads?: Lead[];
  incomes?: Income[];
  commissions?: ManagerCommission[];
  offerLetters?: OfferLetter[];
}
export interface ArrearsItem {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantContact: string;
  unitType: string;
  unitNo: string;
  floor: string;
  invoiceNumber: string;
  invoiceType: 'RENT' | 'BILL';
  billType?: string;
  expectedAmount: number;
  paidAmount: number;
  balance: number;
  dueDate: Date;
  status: 'UNPAID' | 'PARTIALLY_PAID';
  description: string;
}

export interface ArrearsResponse {
  arrears: ArrearsItem[];
  summary: {
    totalArrears: number;
    totalExpected: number;
    totalPaid: number;
    itemCount: number;
  };
}

export type UnitType = 'RESIDENTIAL' | 'COMMERCIAL';
export type UnitStatus = 'VACANT' | 'OCCUPIED';

export type RentType = 
  | 'FIXED'
  | 'PER_SQFT'
  | 'TIERED'
  | 'GRADUATED'
  | 'INDEXED'
  | 'PERCENT_OF_REVENUE'
  | 'PER_ROOM'
  | 'PER_OCCUPANT'
  | 'PER_BED'
  | 'DAILY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'ANNUAL'
  | 'NEGOTIATED'
  | 'PARTIAL_SUBSIDY'
  | 'VARIABLE';

export interface Unit {
  id: string;
  propertyId: string;
  property?: Property;
  unitNo?: string;
  floor?: string;
  unitType: UnitType;
  usage?: string; // For commercial units - type of business
  bedrooms?: number;
  bathrooms?: number;
  sizeSqFt: number;
  type?: string;
  status: UnitStatus;
  rentType: RentType;
  rentAmount: number;
  tenant?: Tenant;
  offerLetters?: OfferLetter[];
  calculationInfo?: { // NEW: Added calculation info for PER_SQFT type
    ratePerSqFt?: number;
    sizeSqFt?: number;
    calculatedRent?: number;
    formula?: string;
  };
}

export type PaymentPolicy = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
export type EscalationFrequency = 'ANNUALLY' | 'BI_ANNUALLY';
export type VATType = 'INCLUSIVE' | 'EXCLUSIVE' | 'NOT_APPLICABLE';

export type ServiceChargeType = 'FIXED' | 'PERCENTAGE' | 'PER_SQ_FT';

export interface ServiceCharge {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  type: ServiceChargeType;
  fixedAmount?: number;
  percentage?: number;
  perSqFtRate?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  fullName: string;
  contact: string;
  KRAPin: string;
  POBox?: string;
  email?: string; // Added email field
  unitId: string;
  unit?: Unit;
  leaseTerm: string;
  rent: number;
  escalationRate?: number;
  escalationFrequency?: EscalationFrequency;
  termStart: string;
  rentStart: string;
  deposit: number;
  vatRate?: number;
  vatType: VATType;
  serviceCharge?: ServiceCharge;
  paymentPolicy: PaymentPolicy;
  paymentReports?: PaymentReport[];
  incomes?: Income[];
  invoices?: Invoice[];
  bills?: Bill[];
  billInvoices?: BillInvoice[];
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID'| 'CREDIT' | 'PREPAID';

export interface PaymentReport {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  rent: number;
  serviceCharge?: number;
  vat?: number;
  totalDue: number;
  amountPaid: number;
  arrears: number;
  status: PaymentStatus;
  paymentPeriod: string;
  datePaid: string;
  notes?: string;
  invoices?: Invoice[];
  //billInvoices?: BillInvoice[];
  createdAt: string;
  updatedAt: string;
    // NEW: Receipt fields
  receiptUrl?: string | null;
  receiptNumber?: string | null;
}

export interface PaymentPreview {
  rent: number;
  serviceCharge?: number;
  vat?: number;
  totalDue: number;
  existingCredit?: number; // NEW
  totalAvailable?: number; // NEW
}

export interface CreatePaymentReportRequest {
  tenantId: string;
  amountPaid: number;
  invoiceIds?: string[]; // NEW: Array of specific invoice IDs to pay
  //billInvoiceIds?: string[]; // NEW: Array of bill invoice IDs to pay
  notes?: string;
  paymentPeriod?: string;
  autoGenerateBalanceInvoice?: boolean;
  createMissingInvoices?: boolean; // NEW: Create invoice if none exist
  updateExistingInvoices?: boolean; // NEW: Update existing invoices for same period
  handleOverpayment?: boolean; // NEW: Enable overpayment handling (default true)
}

// Add this interface for the response (optional, for better type safety)
export interface CreatePaymentReportResponse {
  paymentReport: {
    id: string;
    tenantId: string;
    amountPaid: number;
    arrears: number;
    status: PaymentStatus;
    paymentPeriod: string;
    datePaid: string;
    notes: string | null;
    receiptUrl?: string | null;        // NEW
    receiptNumber?: string | null;     // NEW
  };
  income: {
    id: string;
    propertyId: string;
    amount: number;
    frequency: IncomeFrequency;
  };
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    previousBalance?: number;
    paymentApplied?: number;
    newAmountPaid: number;
    newBalance: number;
    newStatus: InvoiceStatus;
    previousStatus?: InvoiceStatus;
    wasAutoPaid?: boolean;
    paymentPolicy: PaymentPolicy;
    selectionType?: 'USER_SELECTED' | 'FIFO_ALLOCATION' | 'AUTO_PERIOD_MATCH' | 'AUTO_FIFO_OVERPAYMENT'; // NEW
  }>;

  balanceInvoice: {
    id: string;
    invoiceNumber: string;
    amountDue: number;
    paymentPolicy: PaymentPolicy;
  } | null;
  existingInvoicesUpdated?: {
    count: number;
    totalApplied: number;
    remainingPayment: number;
    period: string;
  };
  overpayment?: { // NEW
    totalOverpayment: number;
    currentPeriodPayment: number;
    invoiceBalanceCleared: number;
    allocations: Array<{
      type: 'FUTURE_INVOICE' | 'PREPAID_PERIOD' | 'CREDIT_BALANCE';
      invoiceId?: string;
      invoiceNumber?: string;
      period?: string;
      reportId?: string;
      amountCovered?: number;
      amount?: number;
      commissionApplicable: boolean;
    }>;
    creditUsed: number;
  };
  commission?: {
    id: string;
    commissionAmount: number;
    commissionBase: number; // NEW
    originalAmount: number; // NEW
    status: CommissionStatus;
    note: string;
  };
    // NEW: Receipt information
  receipt?: {
    receiptNumber: string;
    receiptUrl: string;
    generatedAt: string;
  } | null;
}

// NEW: Interface for receipt download response
export interface ReceiptDownloadResponse {
  success: boolean;
  data?: {
    receiptUrl: string;
    generatedAt?: string;
  };
  message?: string;
}

// Invoice Interface
export interface Invoice {
  id: string;
  invoiceNumber: string;
  tenantId: string;
  tenant?: Tenant;
  paymentReportId?: string;
  paymentReport?: PaymentReport;
  issueDate: string;
  dueDate: string;
  paymentPeriod: string;
  rent: number;
  serviceCharge?: number;
  vat?: number;
  totalDue: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  paymentPolicy: PaymentPolicy; // NEW: Added payment policy
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface GenerateInvoiceRequest {
  tenantId: string;
  paymentReportId?: string;
  dueDate: string;
  notes?: string;
}
// Invoice Delete Request Interface - Updated to match backend
export interface DeleteInvoiceRequest {
  deletePaymentReport?: boolean;
  deleteRelatedInvoices?: boolean;  // Changed from deleteLinkedInvoices
  deleteBillInvoices?: boolean;     // New field
  deleteIncome?: boolean;           // New field
  deleteCommissions?: boolean;      // New field
  cascadeDelete?: boolean;          // New field
  force?: boolean;
}

// Invoice Delete Response Interface - Updated to match backend
export interface DeleteInvoiceResponse {
  success: boolean;
  data: {
    deletedInvoice: {
      id: string;
      invoiceNumber: string;
      totalDue: number;
      amountPaid: number;
      status: string;
    };
    deletedRelatedInvoices: Array<{
      id: string;
      invoiceNumber: string;
      amount: number;
      status: string;
    }>;
    deletedBillInvoices: Array<{
      id: string;
      invoiceNumber: string;
      billType: string;
      amount: number;
      status: string;
    }>;
    deletedPaymentReport: {
      id: string;
      amountPaid: number;
      totalDue: number;
      status: string;
      paymentPeriod: string;
    } | null;
    deletedIncome: {
      id: string;
      amount: number;
      createdAt: string;
    } | null;
    deletedCommissions: Array<{
      id: string;
      commissionAmount: number;
      periodStart: string;
      notes: string;
    }>;
    adjustedCreditBalance: {
      previous: number;
      restored: number;
      newBalance: number;
    } | false;
    adjustedOverpayment: {
      deletedPrepaidReports: number;
      totalAmount: number;
    } | false;
    deletedPdfs: number;
    cascadedDeletions: number;
    receiptDeleted: boolean;
    unlinkedRecords: number;
  };
  message: string;
}

export type IncomeFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface Income {
  id: string;
  propertyId?: string;
  tenantId?: string;
  property?: Property;
  tenant?: Tenant;
  amount: number;
  frequency: IncomeFrequency;
  createdAt: string;
}

export type ChargeFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

export interface ServiceProvider {
  id: string;
  propertyId: string;
  property?: Property;
  name: string;
  contact?: string;
  contractPeriod?: string;
  serviceContract?: string;
  chargeAmount: number;
  chargeFrequency: ChargeFrequency;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  idNumber?: string;
  companyName?: string;
  natureOfLead?: string;
  notes?: string;
  propertyId?: string;
  property?: Property;
  offerLetters?: OfferLetter[];
  createdAt: string;
  updatedAt: string;
}

// Offer Letter Types
export type OfferStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'CONVERTED';
export type LetterType = 'COMMERCIAL' | 'RESIDENTIAL';

export interface OfferLetter {
  id: string;
  offerNumber: string;
  leadId: string;
  lead?: Lead;
  propertyId: string;
  property?: Property;
  unitId?: string;
  unit?: Unit;
  landlordId: string;
  landlord?: Landlord;
  letterType: LetterType;
  usageType: UsageType;
  rentAmount: number;
  deposit: number;
  leaseTerm: string;
  serviceCharge?: number;
  escalationRate?: number;
  issueDate: string;
  leaseStartDate?: string;
  rentStartDate?: string;
  expiryDate?: string;
  status: OfferStatus;
  documentUrl?: string;
  additionalTerms?: string;
  notes?: string;
  metadata?: Record<string, any>;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export type ToDoStatus = 'PENDING' | 'COMPLETED';

export interface ToDo {
  id: string;
  userId: string;
  user?: User;
  title: string;
  description?: string;
  status: ToDoStatus;
  dueDate?: string;
  createdAt: string;
}

export interface News {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
}

export interface AuthResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

// Commission Types
export type CommissionStatus = 'PENDING' | 'PAID' | 'PROCESSING' | 'CANCELLED';

export interface ManagerCommission {
  id: string;
  propertyId: string;
  property?: Property;
  managerId: string;
  manager?: User;
  commissionFee: number;
  incomeAmount: number;
  commissionAmount: number;
  periodStart: string;
  periodEnd: string;
  status: CommissionStatus;
  paidDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionStats {
  totalEarned: number;
  totalPending: number;
  totalProcessing: number; 
  totalPaid: number;
  commissionsByProperty: Array<{
    propertyId: string;
    propertyName: string;
    totalCommission: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    amount: number;
  }>;
}

// Commission Invoice Types
export interface CommissionInvoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  commissionId: string;
  commission?: ManagerCommission;
  propertyName: string;
  lrNumber?: string | null;
  landlordName: string;
  landlordAddress?: string | null;
  description: string;
  collectionAmount: number;
  commissionRate: number; // Stored as decimal (e.g., 0.085 for 8.5%)
  commissionAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string | null;
  bankCode?: string | null;
  swiftCode?: string | null;
  currency: string;
  pdfUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateCommissionInvoiceRequest {
  description: string;
  vatRate?: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch?: string;
  bankCode?: string;
  swiftCode?: string;
  currency?: string;
}

export interface CommissionInvoiceResponse {
  success: boolean;
  message: string;
  data: {
    invoice: CommissionInvoice;
    commission: ManagerCommission;
  };
}

// Bill Types
export type BillType = 'WATER' | 'ELECTRICITY';
export type BillStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'CANCELLED';


export interface Bill {
  id: string;
  tenantId: string;
  tenant?: Tenant;
  type: BillType;
  description?: string;
  previousReading: number;
  currentReading: number;
  units: number;
  chargePerUnit: number;
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal: number;
  status: BillStatus;
  issuedAt: string;
  dueDate?: string;
  paidAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  amountPaid: number;
  billInvoices?: BillInvoice[];
}

// Bill Invoice Interface
export interface BillInvoice {
  id: string;
  invoiceNumber: string;
  billId: string;
  bill?: Bill;
  billReferenceNumber: string;
  billReferenceDate: string;
  tenantId: string;
  tenant?: Tenant;
  paymentReportId?: string;
  paymentReport?: PaymentReport;
  issueDate: string;
  dueDate: string;
  billType: BillType;
  previousReading: number;
  currentReading: number;
  units: number;
  chargePerUnit: number;
  totalAmount: number;
  vatRate?: number;
  vatAmount?: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  status: InvoiceStatus;
  //paymentPolicy: PaymentPolicy; // NEW: Added payment policy
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}
// Bill Invoice Delete Request Interface
export interface DeleteBillInvoiceRequest {
  deletePaymentReport?: boolean;
  deleteLinkedInvoices?: boolean;
  force?: boolean;
}

// Bill Invoice Delete Response Interface
export interface DeleteBillInvoiceResponse {
  success: boolean;
  data: {
    billInvoiceDeleted: boolean;
    paymentReportDeleted: boolean;
    linkedBillInvoicesDeleted: number;
    totalPdfsDeleted: number;
    invoiceInfo: {
      id: string;
      invoiceNumber: string;
      tenantName: string;
      propertyName: string;
      billType: BillType;
      grandTotal: number;
      balance: number;
      createdAt: string;
    };
    paymentReportInfo?: {
      id: string;
      status: PaymentStatus;
      totalLinkedBillInvoices: number;
      linkedBillInvoices?: Array<{
        id: string;
        invoiceNumber: string;
        tenantName: string;
        createdAt: string;
      }>;
    };
    paymentReportRemains?: boolean;
    billUpdated?: {
      id: string;
      previousAmountPaid: number;
      newAmountPaid: number;
      newStatus: BillStatus;
    };
  };
  message: string;
}

export interface CreateBillRequest {
  tenantId: string;
  type: BillType;
  description?: string;
  previousReading?: number; // Made optional since it can be auto-filled
  currentReading: number;
  chargePerUnit: number;
  vatRate?: number;
  dueDate?: string;
  notes?: string;
}

export interface UpdateBillRequest {
  type?: BillType;
  description?: string;
  previousReading?: number;
  currentReading?: number;
  chargePerUnit?: number;
  vatRate?: number;
  dueDate?: string;
  status?: BillStatus;
  notes?: string;
}

export interface PayBillRequest {
  amount: number;
}

export interface BillResponse {
  bills: Bill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
export interface BillPaymentResponse {
  success: boolean;
  data: {
    bill: Bill;
    invoice: BillInvoice | null;
  };
  message: string;
}

// Last Bill Info Response
export interface LastBillInfoResponse {
  success: boolean;
  data: {
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
  };
  message: string;
}

// Bill Invoice Types
export interface GenerateBillInvoiceRequest {
  billId: string;
  dueDate: string;
  notes?: string;
  //paymentPolicy?: PaymentPolicy;
}

export interface UpdateBillInvoicePaymentRequest {
  amountPaid: number;
}

export interface BillInvoiceResponse {
  data: BillInvoice[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Daily Report Types
export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
export type AttachmentType = 'PDF' | 'IMAGE' | 'DOCUMENT' | 'OTHER';

export interface ReportAttachment {
  type: AttachmentType;
  fileName: string;
  fileUrl: string;
  uploadedAt: string;
  version?: string;
}

export interface DailyReport {
  id: string;
  propertyId: string;
  property?: Property;
  managerId: string;
  manager?: User;
  reportDate: string;
  preparedBy: string;
  timeSubmitted: string;
  
  // Report content sections
  overview?: {
    summary: string;
    issuesEncountered?: string;
    resolutions?: string;
    recommendations?: string;
  };
  
  occupancy?: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    newTenants?: number;
    moveOuts?: number;
    notes?: string;
  };
  
  maintenance?: {
    completedTasks?: number;
  pendingTasks?: number;
  urgentIssues?: number;
  repairs?: Array<{
    description: string;
    status: string;
    cost?: number;
    notes?: string;
  }>;
  notes?: string;
  };
  
  financial?: {
    rentCollected: number;
    pendingRent: number;
    arrears: number;
    expenses: number;
    netIncome: number;
    billsPaid?: number;
    pendingBills?: number;
    notes?: string;
  };
  
  security?: {
    incidents?: number;
    patrols?: number;
    accessControl?: string;
    cctvStatus?: string;
    notes?: string;
  };
  
  cleanliness?: {
    rating?: number; // 1-5
    areasInspected?: string[];
    issues?: string[];
    notes?: string;
  };
  
  tenantIssues?: {
    complaints?: number;
    resolved?: number;
    pending?: number;
    issues?: Array<{
      tenantName: string;
      unit: string;
      issue: string;
      status: string;
      dateReported: string;
    }>;
    notes?: string;
  };
  
  otherObservations?: string;
  
  // Status and metadata
  status: ReportStatus;
  pdfUrl?: string;
  attachments: ReportAttachment[];
  
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComments?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyReportRequest {
  propertyId: string;
  reportDate: string;
  overview?: {
    summary: string;
    issuesEncountered?: string;
    resolutions?: string;
    recommendations?: string;
  };
  occupancy?: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    occupancyRate: number;
    newTenants?: number;
    moveOuts?: number;
    notes?: string;
  };
  maintenance?: {
    completedTasks?: number;
    pendingTasks?: number;
    urgentIssues?: number;
    repairs?: Array<{
      description: string;
      status: string;
      cost?: number;
      notes?: string;
    }>;
    notes?: string;
  };
  financial?: {
    rentCollected: number;
    pendingRent: number;
    arrears: number;
    expenses: number;
    netIncome: number;
    billsPaid?: number;
    pendingBills?: number;
    notes?: string;
  };
  security?: {
    incidents?: number;
    patrols?: number;
    accessControl?: string;
    cctvStatus?: string;
    notes?: string;
  };
  cleanliness?: {
    rating?: number;
    areasInspected?: string[];
    issues?: string[];
    notes?: string;
  };
  tenantIssues?: {
    complaints?: number;
    resolved?: number;
    pending?: number;
    issues?: Array<{
      tenantName: string;
      unit: string;
      issue: string;
      status: string;
      dateReported: string;
    }>;
    notes?: string;
  };
  otherObservations?: string;
}

export interface UpdateDailyReportRequest {
  overview?: {
    summary?: string;
    issuesEncountered?: string;
    resolutions?: string;
    recommendations?: string;
  };
  occupancy?: {
    totalUnits?: number;
    occupiedUnits?: number;
    vacantUnits?: number;
    occupancyRate?: number;
    newTenants?: number;
    moveOuts?: number;
    notes?: string;
  };
  maintenance?: {
    completedTasks?: number;
    pendingTasks?: number;
    urgentIssues?: number;
    repairs?: Array<{
      description: string;
      status: string;
      cost?: number;
      notes?: string;
    }>;
    notes?: string;
  };
  financial?: {
    rentCollected?: number;
    pendingRent?: number;
    arrears?: number;
    expenses?: number;
    netIncome?: number;
    billsPaid?: number;
    pendingBills?: number;
    notes?: string;
  };
  security?: {
    incidents?: number;
    patrols?: number;
    accessControl?: string;
    cctvStatus?: string;
    notes?: string;
  };
  cleanliness?: {
    rating?: number;
    areasInspected?: string[];
    issues?: string[];
    notes?: string;
  };
  tenantIssues?: {
    complaints?: number;
    resolved?: number;
    pending?: number;
    issues?: Array<{
      tenantName: string;
      unit: string;
      issue: string;
      status: string;
      dateReported: string;
    }>;
    notes?: string;
  };
  otherObservations?: string;
}

export interface DailyReportResponse {
  success: boolean;
  message: string;
  data: DailyReport;
}

export interface DailyReportsListResponse {
  success: boolean;
  count: number;
  data: DailyReport[];
}
// Activation Request Types
export type ActivationStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'UNDER_REVIEW' 
  | 'APPROVED' 
  | 'REJECTED' 
  | 'COMPLETED'
  | 'CANCELLED';

// Activation type can be any string, not just predefined values
export type ActivationType = string;

export interface VATDetails {
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
}

export interface ActivationRequest {
  id: string;
  requestNumber: string;
  propertyId: string;
  property?: {
    id: string;
    name: string;
    address: string;
    landlord?: {
      id: string;
      name: string;
    }
  };
  managerId: string;
  manager?: {
    id: string;
    name: string;
    email: string;
  };
  
  // Part 1 - Client Information (Required for template)
  companyName: string;
  postalAddress: string;
  telephone: string;
  contactPerson: string;
  alternativeContact?: string;
  designation: string;
  email: string;
  mobileNo: string;
  
  // Part 2 - Description of Activation/Exhibition (Required for template)
  startDate: string;
  setupTime: string;
  endDate: string;
  tearDownTime: string;
  activationType: ActivationType;
  description?: string;
  expectedVisitors?: number;
  soundSystem: boolean;
  
  // Part 3 - Cost of Activation/Exhibition (Required for template)
  licenseFeePerDay?: number;
  numberOfDays?: number;
  proposedBudget?: number; // Fallback for licenseFeePerDay
  
  // VAT Information (NEW FIELDS)
  vatType: VATType;
  vat?: number; // VAT percentage (e.g., 16 for 16%)
  
  // Payment Details (Required for template)
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  paybillNumber?: string;
  mpesaAccount?: string;
  
  // Manager Information (Required for template)
  managerName?: string; // Manager's name for signature
  managerDesignation?: string; // Manager's designation
  
  // Document Management
  documentUrl?: string; // Generated PDF URL
  status: ActivationStatus;
  
  // Timestamps (Used in template)
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Signature Information
  signatureDate?: string;
  
  // Calculated VAT details (returned from backend)
  vatDetails?: VATDetails;
}

export interface CreateActivationRequest {
  propertyId: string;
  
  // Part 1 - Client Information (Required for template)
  companyName: string;
  postalAddress: string;
  telephone: string;
  contactPerson: string;
  designation: string;
  email: string;
  mobileNo: string;
  
  // Part 2 - Description of Activation/Exhibition (Required for template)
  startDate: string;
  setupTime: string;
  endDate: string;
  tearDownTime: string;
  activationType: string;
  description?: string;
  expectedVisitors?: number;
  soundSystem?: boolean;
  
  // Part 3 - Cost of Activation/Exhibition (Required for template)
  licenseFeePerDay?: number;
  numberOfDays?: number;
  proposedBudget?: number;
  
  // VAT Information (NEW FIELDS - optional on creation)
  vatType?: VATType;
  vat?: number; // Defaults to 16 if not provided
  
  // Payment Details (Required for template)
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  paybillNumber?: string;
  mpesaAccount?: string;
  
  // Manager Information (Required for template) - Will be set on submission
  managerName?: string;
  managerDesignation?: string;
  
  alternativeContact?: string;
}

export interface UpdateActivationRequest {
  // Part 1 - Client Information
  companyName?: string;
  postalAddress?: string;
  telephone?: string;
  contactPerson?: string;
  designation?: string;
  email?: string;
  mobileNo?: string;
  alternativeContact?: string;
  
  // Part 2 - Description of Activation/Exhibition
  startDate?: string;
  setupTime?: string;
  endDate?: string;
  tearDownTime?: string;
  activationType?: string;
  description?: string;
  expectedVisitors?: number;
  soundSystem?: boolean;
  
  // Part 3 - Cost of Activation/Exhibition
  licenseFeePerDay?: number;
  numberOfDays?: number;
  proposedBudget?: number;
  
  // VAT Information (NEW FIELDS)
  vatType?: VATType;
  vat?: number;
  
  // Payment Details
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  paybillNumber?: string;
  mpesaAccount?: string;
  
  // Manager Information
  managerName?: string;
  managerDesignation?: string;
  
  // Status (for admin updates)
  status?: ActivationStatus;
  
  // Signature Information (for submission)
  signatureDate?: string;
}

export interface SubmitActivationRequest {
  // Required manager signature info for submission
  managerName: string;
  managerDesignation: string;
}

export interface ActivationResponse {
  success: boolean;
  message: string;
  data: ActivationRequest;
}

export interface ActivationsListResponse {
  success: boolean;
  count: number;
  totalCount: number;
  data: ActivationRequest[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ActivationStats {
  success: boolean;
  data: {
    total: number;
    byStatus: Record<ActivationStatus, number>;
    byVATType: Record<VATType, number>;
    upcoming: number;
  };
}

export interface VATSummaryResponse {
  success: boolean;
  data: {
    summary: {
      totalActivations: number;
      totalBaseAmount: number;
      totalVATAmount: number;
      totalWithVAT: number;
    };
    breakdownByVATType: {
      INCLUSIVE: {
        count: number;
        base: number;
        vat: number;
        total: number;
      };
      EXCLUSIVE: {
        count: number;
        base: number;
        vat: number;
        total: number;
      };
    };
    activations: Array<{
      id: string;
      requestNumber: string;
      companyName: string;
      propertyName: string;
      baseAmount: number;
      vatRate: number;
      vatAmount: number;
      totalAmount: number;
      vatType: VATType;
    }>;
  };
}

// Pagination parameters for fetching activations
export interface ActivationQueryParams {
  propertyId?: string;
  status?: ActivationStatus;
  startDate?: string;
  endDate?: string;
  activationType?: string;
  companyName?: string;
  vatType?: VATType; // Added VAT type filter
  page?: number;
  limit?: number;
}

// Interface for form data (for form handling)
export interface ActivationFormData {
  // Part 1 - Client Information
  companyName: string;
  postalAddress: string;
  telephone: string;
  contactPerson: string;
  designation: string;
  email: string;
  mobileNo: string;
  alternativeContact?: string;
  
  // Part 2 - Description of Activation/Exhibition
  startDate: string;
  setupTime: string;
  endDate: string;
  tearDownTime: string;
  activationType: string;
  description?: string;
  expectedVisitors?: number;
  soundSystem: boolean;
  
  // Part 3 - Cost of Activation/Exhibition
  licenseFeePerDay?: number;
  numberOfDays?: number;
  proposedBudget?: number;
  
  // VAT Information
  vatType: VATType;
  vat?: number;
  
  // Payment Details
  bankName?: string;
  bankBranch?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  paybillNumber?: string;
  mpesaAccount?: string;
}

// Interface for manager signature section
export interface ManagerSignatureData {
  managerName: string;
  managerDesignation: string;
}

// Demand Letter Types
export type DemandLetterStatus = 
  | 'DRAFT' 
  | 'GENERATED' 
  | 'SENT' 
  | 'ACKNOWLEDGED' 
  | 'SETTLED' 
  | 'ESCALATED';

export interface DemandLetter {
  id: string;
  letterNumber: string;
  tenantId: string;
  propertyId: string;
  landlordId: string;
  unitId: string;
  invoiceId?: string | null;
  generatedById?: string;
  
  // Basic information
  issueDate: string;
  outstandingAmount: number;
  rentalPeriod: string;
  dueDate: string;
  demandPeriod: string;
  
  // Contact information
  landlordContact?: string;
  tenantContact?: string;
  
  // References
  referenceNumber: string;
  previousInvoiceRef?: string | null;
  
  // Financial details
  partialPayment?: number | null;
  partialPaymentDate?: string | null;
  paymentPolicy?: string;  // Backend stores as string
  
  // Document
  documentUrl?: string | null;
  notes?: string | null;
  status: DemandLetterStatus;
  
  // Timestamps
  generatedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Relations (optional in response)
  tenant?: Tenant;
  property?: Property;
  landlord?: Landlord;
  unit?: Unit;
  invoice?: Invoice;
  generatedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface GenerateDemandLetterRequest {
  tenantId: string;
  invoiceId?: string;  // Backend expects invoiceId, not propertyId
  outstandingAmount: number;  // Required by backend
  rentalPeriod: string;  // Required by backend
  dueDate: string;  // Required by backend
  demandPeriod?: string;
  partialPayment?: number;
  partialPaymentDate?: string;
  referenceNumber?: string;
  notes?: string;
}

export interface UpdateDemandLetterStatusRequest {
  status: DemandLetterStatus;
  notes?: string;
}

export interface DemandLetterQueryParams {
  tenantId?: string;
  propertyId?: string;
  landlordId?: string;
  status?: DemandLetterStatus;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface OverdueInvoicesResponse {
  invoices: Invoice[];
  totalOutstanding: number;
  count: number;
  originalCount: number;
  deduplicationApplied: boolean;
}

export interface BatchGenerateRequest {
  tenantIds: string[];
  demandPeriod?: string;
  notes?: string;
}

export interface BatchGenerateResponse {
  success: Array<{
    tenantId: string;
    tenantName: string;
    demandLetterId: string;
    letterNumber: string;
    outstandingAmount: number;
    invoiceCount: number;
    deduplicationApplied: boolean;
  }>;
  failed: Array<{
    tenantId: string;
    reason: string;
  }>;
}