// Update your User interface in types/index.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isApproved?: boolean;
  isManagedUser?: boolean;
  createdByManagerId?: string;
  canManagerLogin?: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  accessibleProperties?: string[];
  permissions?: string[];
  properties?: Property[];
  todos?: ToDo[];
  commissions?: ManagerCommission[];
  requiresPasswordChange?: boolean;
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
  // Add these new properties from API response
  rentInfo?: RentInfo;
  rentSchedule?: RentScheduleItem[];
  paymentSummary?: PaymentSummary;
}

// Add these new interfaces
export interface RentInfo {
  currentRent: number;
  nextEscalationDate: string | null;
  escalationsApplied: number;
  monthlyRent: number;
  paymentAmount: number;
  paymentPolicy: PaymentPolicy;
}

export interface RentScheduleItem {
  period: number;
  date: string;
  monthlyRent: number;
  paymentAmount: number;
  paymentPolicy: PaymentPolicy;
}
export interface PaymentSummary {
  paymentPolicy: PaymentPolicy;
  policyMonths: number;
  monthlyRent: number;
  paymentAmountPerPeriod: number;
  nextPayment: {
    dueDate: string;
    dueDateFormatted: string | null;
    dueDateTime: string | null;
    amount: number;
    isOverdue: boolean;
    timeRemaining: {
      isOverdue: boolean;
      days: number;
      hours: number;
      minutes: number;
      formatted: string;
    };
    paymentsBehind: number;
    gracePeriodEnd: string | null;
    gracePeriodEndFormatted: string | null;
  };
  currentPeriod: {
    periodNumber: number;
    periodStart: string;
    periodEnd: string;
    daysRemainingInPeriod: number;
    isInCurrentPeriod: boolean;
    progressPercentage: number;
    periodStartFormatted: string;
    periodEndFormatted: string;
    isPending?: boolean; // Add this optional property
  };
  paymentHistory: {
    totalPaid: number;
    expectedTotal: number;
    outstandingBalance: number;
    paymentsMade: number;
    expectedPaymentsCount: number;
    lastPaymentDate: string | null;
    lastPaymentDateFormatted: string | null;
    lastPaymentDateTime: string | null;
  };
  status: 'UP_TO_DATE' | 'OVERDUE' | 'PARTIALLY_PAID' | 'OVERPAID' | 'NOT_STARTED' | 'UNPAID' | 'NO_PAYMENTS_DUE'; // Add new statuses
  isRentStarted?: boolean; 
  rentStartDate?: string; 
}
export interface OverdueTenantsResponse {
  success: boolean;
  count: number;
  totalOverdueAmount: number;
  tenants: Tenant[];
  summary: {
    totalOverdueTenants: number;
    totalOverdueAmount: number;
    averageOverdueAmount: number;
    overdueDaysStats?: {
      min: number;
      max: number;
      average: number;
    };
    overdueCategories?: {
      week1: number;
      week2: number;
      month1: number;
      month2: number;
      month3: number;
      more: number;
    };
  };
  filter: {
    propertyId: string | null;
    daysOverdue: string | null;
    customDays: number | null;
    scope: 'specific_property' | 'managed_properties' | 'all_properties' | 'accessible_properties' | 'no_permission';
  };
}

// Next Payment Response Types
export interface NextPaymentContact {
  email: string;
  phone: string;
  kra: string;
}

export interface NextPaymentUnit {
  number: string;
  type: string;
  size: number;
  floor: string;
}

export interface NextPaymentAmount {
  rent: number;
  serviceCharge: number;
  vat: number;
  total: number;
}

export interface NextPaymentDetails {
  dueDate: string;
  daysUntilDue: number;
  isOverdue: boolean;
  amount: NextPaymentAmount;
  status: string;
  policy: PaymentPolicy;
}

export interface RentEscalation {
  rate: number;
  frequency: EscalationFrequency;
  nextDate: string;
}

export interface NextPaymentRent {
  current: number;
  escalation: RentEscalation | null;
}

export interface NextPaymentHistory {
  lastPayment: string;
  paymentsMade: number;
}

export interface NextPaymentItem {
  id: string;
  name: string;
  contact: NextPaymentContact;
  unit: NextPaymentUnit;
  payment: NextPaymentDetails;
  rent: NextPaymentRent;
  history: NextPaymentHistory | null;
}

export interface NextPaymentsSummary {
  total: number;
  overdue: number;
  upcoming: number;
  amounts: {
    outstanding: number;
    upcoming: number;
  };
  byPolicy: {
    MONTHLY: number;
    QUARTERLY: number;
    ANNUAL: number;
  };
}

export interface NextPaymentsResponse {
  success: boolean;
  property: {
    id: string;
    name: string;
  };
  summary: NextPaymentsSummary;
  payments: NextPaymentItem[];
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
 // autoGenerateBalanceInvoice?: boolean;
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

// Add these interfaces to your types/index.ts file
export interface PropertyRentPaymentReportResponse {
  success: boolean;
  data: {
    property: {
      id: string;
      name: string;
      address: string;
    };
    summary: {
      totalTenants: number;
      totalRentCollected: number;
      totalRentExpected: number;
      totalArrears: number;
      collectionRate: number;
      collectionRateStatus: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
      paymentBreakdown: {
        fullyPaid: number;
        partiallyPaid: number;
        unpaid: number;
        overdue: number;
      };
    };
    monthlyTrends: Array<{
      month: string;
      expected: number;
      collected: number;
      arrears: number;
      reportCount: number;
    }>;
    tenantOutstanding: Array<{
      tenantId: string;
      tenantName: string;
      unitNo: string;
      unitType: string;
      expectedTotal: number;
      paidTotal: number;
      outstandingBalance: number;
      arrears: number;
      lastPaymentDate: string | null;
      paymentStatus: PaymentStatus;
    }>;
    paymentReports: Array<{
      id: string;
      tenantName: string;
      unitNo: string;
      paymentPeriod: string;
      expectedAmount: number;
      amountPaid: number;
      arrears: number;
      status: PaymentStatus;
      invoiceCount: number;
      datePaid: string;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface PropertyBillsPaymentReportResponse {
  success: boolean;
  data: {
    property: {
      id: string;
      name: string;
      address: string;
    };
    summary: {
      totalTenants: number;
      totalBillInvoices: number;
      water: {
        totalBilled: number;
        totalCollected: number;
        totalArrears: number;
        collectionRate: number;
        status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
      };
      electricity: {
        totalBilled: number;
        totalCollected: number;
        totalArrears: number;
        collectionRate: number;
        status: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
      };
      overall: {
        totalBilled: number;
        totalCollected: number;
        totalArrears: number;
        collectionRate: number;
        delinquentBillsCount: number;
        paymentBreakdown: {
          paid: number;
          partial: number;
          unpaid: number;
          overdue: number;
        };
      };
    };
    monthlyTrends: Array<{
      month: string;
      water: { expected: number; collected: number; arrears: number };
      electricity: { expected: number; collected: number; arrears: number };
      total: { expected: number; collected: number; arrears: number };
    }>;
    tenantOutstanding: Array<{
      tenantId: string;
      tenantName: string;
      unitNo: string;
      unitType: string;
      water: {
        total: number;
        paid: number;
        outstanding: number;
        status: string;
      };
      electricity: {
        total: number;
        paid: number;
        outstanding: number;
        status: string;
      };
      totalOutstanding: number;
    }>;
    delinquentBills: Array<{
      id: string;
      invoiceNumber: string;
      tenantName: string;
      unitNo: string;
      billType: BillType;
      amount: number;
      amountPaid: number;
      balance: number;
      issueDate: string;
      dueDate: string;
      daysOverdue: number;
      status: InvoiceStatus;
    }>;
    billInvoices: Array<{
      id: string;
      invoiceNumber: string;
      tenantName: string;
      unitNo: string;
      billType: BillType;
      billReferenceNumber: string;
      billReferenceDate: string;
      issueDate: string;
      dueDate: string;
      totalAmount: number;
      amountPaid: number;
      balance: number;
      status: InvoiceStatus;
      unitsConsumed: number;
      chargePerUnit: number;
      previousReading: number;
      currentReading: number;
      vatRate: number | null;
      vatAmount: number | null;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetPropertyRentReportParams {
  dateFrom?: string;
  dateTo?: string;
  status?: PaymentStatus;
  page?: number;
  limit?: number;
}

export interface GetPropertyBillsReportParams {
  dateFrom?: string;
  dateTo?: string;
  billType?: BillType;
  status?: InvoiceStatus;
  page?: number;
  limit?: number;
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
  createdById?: string; 
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

// Update the ToDoStatus enum
export type ToDoStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'PENDING_APPROVAL' 
  | 'COMPLETED' 
  | 'OVERDUE' 
  | 'REJECTED';

// Add TaskPriority type
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

// Update ToDo interface
export interface ToDo {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  title: string;
  description?: string;
  status: ToDoStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  
  // Task assignment fields
  assignedById?: string;
  assignedBy?: {
    id: string;
    name: string;
    email: string;
  };
  requiresApproval: boolean;
  
  // Self-created task fields
  isSelfCreated: boolean;
  approvedById?: string;
  approvedBy?: {
    id: string;
    name: string;
    email: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
  
  // Completion fields
  completionNotes?: string;
  reviewedById?: string;
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
}

// Add Todo Statistics interface
export interface TodoStatistics {
  total: number;
  byStatus: {
    pending: number;
    inProgress: number;
    pendingApproval: number;
    completed: number;
    overdue: number;
    rejected: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
    urgent: number;
  };
  completion: {
    completionRate: string;
    averageCompletionTime: string | null;
    tasksCompletedOnTime: number;
    tasksCompletedLate: number;
  };
  dailyActivity: Record<string, { created: number; completed: number }>;
  weeklyActivity: Record<string, { created: number; completed: number }>;
  mostProductiveDays: Array<{
    day: string;
    tasksCompleted: number;
  }>;
}

// Add CreateTodoRequest interface
export interface CreateTodoRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: TaskPriority;
  assignedUserId?: string; // For managers assigning tasks
}

// Add UpdateTodoRequest interface
export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  status?: ToDoStatus;
  dueDate?: string;
  priority?: TaskPriority;
  completionNotes?: string;
  rejectionReason?: string;
}

// Add ApproveSelfCreatedTaskRequest interface
export interface ApproveSelfCreatedTaskRequest {
  approved: boolean;
  rejectionReason?: string;
}

// Add GetTodosQueryParams interface
export interface GetTodosQueryParams {
  status?: ToDoStatus;
  priority?: TaskPriority;
  userId?: string;
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
  role: 'ADMIN' | 'MANAGER' | 'USER';
  isApproved?: boolean;
  isManagedUser?: boolean;
  managedBy?: {
    id: string;
    name: string;
  } | null;
  accessibleProperties?: string[] | PropertyAccess[];
  permissions?: string[];
  requiresPasswordChange?: boolean;
  token: string;
  message?: string; // For registration response
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

// ======================================================
// RBAC TYPES
// ======================================================

// Matches backend Permission model: code, name, description, category, scope
export interface Permission { 
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  scope: string;
  createdAt: string;
  updatedAt: string;
}

// Permission info nested inside access-details response
export interface PermissionInfo {
  code: string;
  name: string;
  category: string;
}

// Matches backend access-details properties array
export interface PropertyAccess {
  id: string;              // propertyId
  name: string;            // propertyName
  isActive: boolean;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  grantedAt?: string;
  expiresAt?: string | null;
}

// Matches backend GET /rbac/users/{id}/access-details response
export interface UserAccessDetails {
  user: {
    id: string;
    name: string;
    email: string;
    canManagerLogin: boolean;
  };
  currentAccess: {
    isEnabled: boolean;
    role: {
      id: string;
      name: string;
      description?: string;
      permissions: PermissionInfo[];
      defaultProperties?: Array<{ id: string; name: string }>;
    } | null;
    properties: PropertyAccess[];
  };
  auditHistory?: any[];
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionRequest {
  code: string;
  name: string;
  description?: string;
  category: string;
  scope?: string;
}

export interface CreateCustomRoleRequest {
  name: string;
  description?: string;
  permissionIds: string[];
}

export interface UpdateCustomRoleRequest {
  name?: string;
  description?: string;
  permissionIds?: string[];
  propertyIds: string[]; // Add this line
}

export interface ManagedUser {
  canManagerLogin: boolean;
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  customRole?: CustomRole;
  propertyAccess: PropertyAccess[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateManagedUserRequest {
  name: string;
  email: string;
  roleId: string;        // Required - properties inherited from role
  expiresAt?: string;    // Optional expiration date
}

export interface CreateManagedUserResponse {
  success: boolean;
  message: string;
  data: {
    id: string;
    name: string;
    email: string;
    role: {
      id: string;
      name: string;
      propertyAccessCount: number;
    };
  };
  temporaryPassword: string;
}

export interface UpdateManagedUserAccessRequest {
  roleId?: string;          // Optional: New role ID (user will inherit new role's properties)
  expiresAt?: string;       // Optional: Update role expiration date
  isActive?: boolean;       // Optional: Enable/disable user login
  // NOTE: propertyAccess and permissions removed - properties are inherited from the role
}

export interface UpdateManagedUserAccessRequest {
  role?: string;
  customRoleId?: string;
  propertyAccess?: {
    propertyId: string;
    permissions: string[];
  }[];
}

export interface GrantPropertyAccessRequest {
  propertyIds: string[];  // Change from propertyId to propertyIds
  canEdit?: boolean;
  canExport?: boolean;
  expiresAt?: string;
}

export interface UpdatePropertyPermissionsRequest {
  permissions: string[];
}

export interface BulkUpdateAccessRequest {
  userIds: string[];
  action: 'GRANT' | 'REVOKE' | 'UPDATE';
  propertyId?: string;
  permissions?: string[];
  role?: string;
  customRoleId?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface AuditLogQueryParams {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  hitRate: number;
  memoryUsage?: number;
}

// ======================================================
// EXTENDED USER WITH RBAC
// ======================================================

export interface UserWithAccess extends User {
  permissions?: string[];
  propertyAccess?: PropertyAccess[];
  isEnabled?: boolean;
  roleName?: string | null;
  isManagedUser?: boolean;
  canManagerLogin?: boolean;
  requiresPasswordChange?: boolean; 
  managedBy?: string | { id: string; name: string } | null;
}

// ======================================================
// EMPLOYEE TYPES
// ======================================================

export type PaymentFrequency = 'MONTHLY' | 'BI_WEEKLY' | 'WEEKLY' | 'DAILY';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'TERMINATED' | 'ON_LEAVE';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'MPESA' | 'CHEQUE';

export interface Employee {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  jobTitle: string;
  jobDescription?: string;
  salaryAmount: number;
  paymentFrequency: PaymentFrequency;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  salaryPayments?: SalaryPayment[];
  currentPaymentStatus?: 'PAID' | 'PENDING';
  currentPaymentPeriod?: string;
}

export interface SalaryPayment {
  id: string;
  employeeId: string;
  amount: number;
  paymentDate: string;
  paymentPeriod: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
  receiptUrl?: string;
  status: 'PAID';
  createdAt: string;
  updatedAt: string;
  recordedById: string;
  employee?: Employee;
  recordedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export interface CreateEmployeeRequest {
  name: string;
  phoneNumber?: string;
  email?: string;
  jobTitle: string;
  jobDescription?: string;
  salaryAmount: number;
  paymentFrequency: PaymentFrequency;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  name?: string;
  phoneNumber?: string;
  email?: string;
  jobTitle?: string;
  jobDescription?: string;
  salaryAmount?: number;
  paymentFrequency?: PaymentFrequency;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeStatusRequest {
  status: EmployeeStatus;
}

export interface RecordSalaryPaymentRequest {
  amount: number;
  paymentPeriod: string;
  paymentMethod: PaymentMethod;
  transactionRef?: string;
  notes?: string;
}

export interface GetEmployeesParams {
  status?: EmployeeStatus;
  jobTitle?: string;
  page?: number;
  limit?: number;
}

export interface EmployeesListResponse {
  success: boolean;
  employees: Employee[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface EmployeeResponse {
  success: boolean;
  data: Employee;
  message?: string;
}

export interface EmployeesDueResponse {
  success: boolean;
  data: Employee[];
  count: number;
  message: string;
}

export interface UpcomingPaymentsResponse {
  success: boolean;
  data: Array<{
    employee: Employee;
    nextPaymentDate: string;
    daysUntilPayment: number;
    isPaid: boolean;
    paymentPeriod: string;
    needsPayment: boolean;
  }>;
  count: number;
  message: string;
}

export interface PaymentHistoryResponse {
  success: boolean;
  data: SalaryPayment[];
  count: number;
  message: string;
}

export interface StatisticsResponse {
  success: boolean;
  data: {
    totalEmployees: number;
    activeEmployees: number;
    pendingPayments: number;
    totalPaidThisMonth: number;
    currentPeriod: string;
  };
}

export interface Reminder {
  id: string;
  action: string;
  performedBy: string;
  targetUser: string;
  changes: {
    type: 'URGENT' | 'WARNING' | 'REMINDER' | 'UPCOMING';
    message: string;
    dueDate?: string;
    daysOverdue?: number;
    daysUntilDue?: number;
    salaryAmount: number;
    employeeName: string;
    creatorId?: string;
  };
  createdAt: string;
}

export interface RemindersResponse {
  success: boolean;
  data: Reminder[];
  count: number;
  message: string;
}

export interface PaymentStatusSummaryResponse {
  success: boolean;
  data: {
    currentPeriod: string;
    dueCount: number;
    upcomingCount: number;
    dueEmployees: Employee[];
    upcomingPayments: Array<{
      employee: Employee;
      nextPaymentDate: string;
      daysUntilPayment: number;
      isPaid: boolean;
      paymentPeriod: string;
      needsPayment: boolean;
    }>;
  };
}

// Permission codes from your backend
export enum PermissionCode {
  // ==============================================
  // PROPERTY PERMISSIONS
  // ==============================================
  VIEW_PROPERTIES = 'VIEW_PROPERTIES',
  CREATE_PROPERTY = 'CREATE_PROPERTY',
  EDIT_PROPERTY = 'EDIT_PROPERTY',
  DELETE_PROPERTY = 'DELETE_PROPERTY',
  ASSIGN_MANAGER_TO_PROPERTY = 'ASSIGN_MANAGER_TO_PROPERTY',

  // ==============================================
  // UNIT PERMISSIONS
  // ==============================================
  VIEW_UNITS = 'VIEW_UNITS',
  CREATE_UNIT = 'CREATE_UNIT',
  EDIT_UNIT = 'EDIT_UNIT',
  DELETE_UNIT = 'DELETE_UNIT',
  UPDATE_UNIT_STATUS = 'UPDATE_UNIT_STATUS',

  // ==============================================
  // TENANT PERMISSIONS
  // ==============================================
  VIEW_TENANTS = 'VIEW_TENANTS',
  CREATE_TENANT = 'CREATE_TENANT',
  EDIT_TENANT = 'EDIT_TENANT',
  DELETE_TENANT = 'DELETE_TENANT',
  VIEW_TENANT_FINANCIALS = 'VIEW_TENANT_FINANCIALS',

  // ==============================================
  // INVOICE PERMISSIONS
  // ==============================================
  VIEW_INVOICES = 'VIEW_INVOICES',
  CREATE_INVOICES = 'CREATE_INVOICES',
  EDIT_INVOICES = 'EDIT_INVOICES',
  DELETE_INVOICES = 'DELETE_INVOICES',
  DOWNLOAD_INVOICES = 'DOWNLOAD_INVOICES',

  // ==============================================
  // BILL PERMISSIONS (Utility)
  // ==============================================
  VIEW_BILLS = 'VIEW_BILLS',
  CREATE_BILLS = 'CREATE_BILLS',
  EDIT_BILLS = 'EDIT_BILLS',
  DELETE_BILLS = 'DELETE_BILLS',
  PAY_BILLS = 'PAY_BILLS',
  RECORD_METER_READINGS = 'RECORD_METER_READINGS',

  // ==============================================
  // BILL INVOICE PERMISSIONS
  // ==============================================
  VIEW_BILL_INVOICES = 'VIEW_BILL_INVOICES',
  CREATE_BILL_INVOICE = 'CREATE_BILL_INVOICE',
  EDIT_BILL_INVOICE_PAYMENT = 'EDIT_BILL_INVOICE_PAYMENT',
  DELETE_BILL_INVOICE = 'DELETE_BILL_INVOICE',
  DOWNLOAD_BILL_INVOICE = 'DOWNLOAD_BILL_INVOICE',

  // ==============================================
  // MAINTENANCE PERMISSIONS
  // ==============================================
  VIEW_MAINTENANCE_REQUESTS = 'VIEW_MAINTENANCE_REQUESTS',
  CREATE_MAINTENANCE_REQUESTS = 'CREATE_MAINTENANCE_REQUESTS',
  UPDATE_MAINTENANCE_REQUESTS = 'UPDATE_MAINTENANCE_REQUESTS',
  DELETE_MAINTENANCE_REQUESTS = 'DELETE_MAINTENANCE_REQUESTS',
  ASSIGN_MAINTENANCE_TASKS = 'ASSIGN_MAINTENANCE_TASKS',

  // ==============================================
  // REPORT PERMISSIONS
  // ==============================================
  VIEW_DAILY_REPORTS = 'VIEW_DAILY_REPORTS',
  CREATE_DAILY_REPORTS = 'CREATE_DAILY_REPORTS',
  EDIT_DAILY_REPORTS = 'EDIT_DAILY_REPORTS',
  DELETE_DAILY_REPORTS = 'DELETE_DAILY_REPORTS',
  SUBMIT_DAILY_REPORTS = 'SUBMIT_DAILY_REPORTS',
  APPROVE_DAILY_REPORTS = 'APPROVE_DAILY_REPORTS',

  // ==============================================
  // PAYMENT REPORT PERMISSIONS
  // ==============================================
  VIEW_PAYMENT_REPORTS = 'VIEW_PAYMENT_REPORTS',
  RECORD_PAYMENTS = 'RECORD_PAYMENTS',
  EDIT_PAYMENT_RECORDS = 'EDIT_PAYMENT_RECORDS',
  DELETE_PAYMENT_RECORDS = 'DELETE_PAYMENT_RECORDS',
  DOWNLOAD_PAYMENT_RECEIPT = 'DOWNLOAD_PAYMENT_RECEIPT',
  PREVIEW_PAYMENTS = 'PREVIEW_PAYMENTS',
  VIEW_ARREARS = 'VIEW_ARREARS',

  // ==============================================
  // RECEIPT PERMISSIONS
  // ==============================================
  VIEW_RECEIPTS = 'VIEW_RECEIPTS',
  DOWNLOAD_RECEIPTS = 'DOWNLOAD_RECEIPTS',
  GENERATE_RECEIPTS = 'GENERATE_RECEIPTS',

  // ==============================================
  // OFFER LETTER PERMISSIONS
  // ==============================================
  VIEW_OFFER_LETTERS = 'VIEW_OFFER_LETTERS',
  CREATE_OFFER_LETTERS = 'CREATE_OFFER_LETTERS',
  EDIT_OFFER_LETTERS = 'EDIT_OFFER_LETTERS',
  DELETE_OFFER_LETTERS = 'DELETE_OFFER_LETTERS',

  // ==============================================
  // DEMAND LETTER PERMISSIONS
  // ==============================================
  VIEW_DEMAND_LETTERS = 'VIEW_DEMAND_LETTERS',
  CREATE_DEMAND_LETTER = 'CREATE_DEMAND_LETTER',
  AUTO_GENERATE_DEMAND_LETTER = 'AUTO_GENERATE_DEMAND_LETTER',
  BATCH_GENERATE_DEMAND_LETTERS = 'BATCH_GENERATE_DEMAND_LETTERS',
  EDIT_DEMAND_LETTER_STATUS = 'EDIT_DEMAND_LETTER_STATUS',
  DELETE_DEMAND_LETTER = 'DELETE_DEMAND_LETTER',
  DOWNLOAD_DEMAND_LETTER = 'DOWNLOAD_DEMAND_LETTER',
  SEND_DEMAND_LETTERS = 'SEND_DEMAND_LETTERS',

  // ==============================================
  // OVERDUE INVOICE PERMISSIONS
  // ==============================================
  VIEW_OVERDUE_INVOICES = 'VIEW_OVERDUE_INVOICES',

  // ==============================================
  // LEAD PERMISSIONS
  // ==============================================
  VIEW_LEADS = 'VIEW_LEADS',
  CREATE_LEAD = 'CREATE_LEAD',
  EDIT_LEAD = 'EDIT_LEAD',
  DELETE_LEAD = 'DELETE_LEAD',

  // ==============================================
  // LANDLORD PERMISSIONS
  // ==============================================
  VIEW_LANDLORDS = 'VIEW_LANDLORDS',
  CREATE_LANDLORD = 'CREATE_LANDLORD',
  EDIT_LANDLORD = 'EDIT_LANDLORD',
  DELETE_LANDLORD = 'DELETE_LANDLORD',

  // ==============================================
  // SERVICE PROVIDER PERMISSIONS
  // ==============================================
  VIEW_SERVICE_PROVIDERS = 'VIEW_SERVICE_PROVIDERS',
  CREATE_SERVICE_PROVIDER = 'CREATE_SERVICE_PROVIDER',
  EDIT_SERVICE_PROVIDER = 'EDIT_SERVICE_PROVIDER',
  DELETE_SERVICE_PROVIDER = 'DELETE_SERVICE_PROVIDER',

  // ==============================================
  // ACTIVATION REQUEST PERMISSIONS
  // ==============================================
  VIEW_ACTIVATION_REQUESTS = 'VIEW_ACTIVATION_REQUESTS',
  CREATE_ACTIVATION_REQUEST = 'CREATE_ACTIVATION_REQUEST',
  EDIT_ACTIVATION_REQUEST = 'EDIT_ACTIVATION_REQUEST',
  DELETE_ACTIVATION_REQUEST = 'DELETE_ACTIVATION_REQUEST',
  APPROVE_ACTIVATION_REQUEST = 'APPROVE_ACTIVATION_REQUEST',

  // ==============================================
  // COMMISSION PERMISSIONS
  // ==============================================
  VIEW_COMMISSIONS = 'VIEW_COMMISSIONS',
  GENERATE_COMMISSION_INVOICES = 'GENERATE_COMMISSION_INVOICES',
  PROCESS_COMMISSIONS = 'PROCESS_COMMISSIONS',
  APPROVE_COMMISSIONS = 'APPROVE_COMMISSIONS',

  //===========
  VIEW_EMPLOYEES = 'VIEW_EMPLOYEES',
  CREATE_EMPLOYEE = 'CREATE_EMPLOYEE',
  EDIT_EMPLOYEE = 'EDIT_EMPLOYEE',
  DELETE_EMPLOYEE = 'DELETE_EMPLOYEE',

  // ==============================================
  // USER MANAGEMENT PERMISSIONS
  // ==============================================
  VIEW_ALL_USERS = 'VIEW_ALL_USERS',
  CREATE_USER = 'CREATE_USER',
  DELETE_USER = 'DELETE_USER',
  EDIT_USER_ROLE = 'EDIT_USER_ROLE',
  VIEW_AUDIT_LOGS = 'VIEW_AUDIT_LOGS',
  APPROVE_MANAGER = 'APPROVE_MANAGER',

  // ==============================================
  // LEGACY/UTILITY PERMISSIONS
  // ==============================================
  MANAGE_USERS = 'MANAGE_USERS',
  MANAGE_ROLES = 'MANAGE_ROLES',
  MANAGE_CACHE = 'MANAGE_CACHE',
  PAY_BILL = "PAY_BILL",
}