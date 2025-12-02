export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
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

export type PaymentStatus = 'PAID' | 'PARTIAL' | 'UNPAID';

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
  billInvoices?: BillInvoice[];
  createdAt: string;
  updatedAt: string;
}

export interface PaymentPreview {
  rent: number;
  serviceCharge?: number;
  vat?: number;
  totalDue: number;
}

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
  pdfUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBillRequest {
  tenantId: string;
  type: BillType;
  description?: string;
  previousReading: number;
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

// Bill Invoice Types
export interface GenerateBillInvoiceRequest {
  billId: string;
  dueDate: string;
  notes?: string;
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