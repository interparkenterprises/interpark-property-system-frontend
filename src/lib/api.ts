import axios from 'axios';
import { 
  User, Landlord, Property, Unit, Tenant, 
  PaymentReport, PaymentPreview, Income, ServiceProvider, Lead, 
  ToDo, TodoStatistics, CreateTodoRequest, UpdateTodoRequest, ApproveSelfCreatedTaskRequest, GetTodosQueryParams,
  News, AuthResponse, ManagerCommission, CommissionStats,
  ServiceCharge, Invoice, InvoiceStatus, GenerateInvoiceRequest,
  Bill, CreateBillRequest, UpdateBillRequest, PayBillRequest, BillResponse, BillType, BillStatus,
  OfferLetter, OfferStatus, LetterType,
  UpdateBillInvoicePaymentRequest,
  BillInvoice,
  BillInvoiceResponse,
  GenerateBillInvoiceRequest, 
  ArrearsItem,
  ArrearsResponse,
  DailyReport, 
  CreateDailyReportRequest, 
  UpdateDailyReportRequest,
  DailyReportsListResponse,
  ReportStatus,
  ActivationRequest,
  CreateActivationRequest,
  UpdateActivationRequest,
  ActivationsListResponse,
  ActivationQueryParams,
  VATSummaryResponse,
  ActivationStats,
  //ActivationStatus,
  PaymentPolicy,
  DeleteInvoiceRequest,
  DeleteInvoiceResponse,
  DeleteBillInvoiceRequest,
  DeleteBillInvoiceResponse,
  GenerateDemandLetterRequest,
  DemandLetter,
  DemandLetterQueryParams,
  UpdateDemandLetterStatusRequest,
  CreatePaymentReportRequest,
  CreatePaymentReportResponse,
  CommissionStatus,
  GenerateCommissionInvoiceRequest,
  CommissionInvoiceResponse,
  SubmitActivationRequest,
  PaymentStatus,
  IncomeFrequency,
  OverdueTenantsResponse,
    // RBAC types
  Permission,
  CreatePermissionRequest,
  CustomRole,
  CreateCustomRoleRequest,
  UpdateCustomRoleRequest,
  ManagedUser,
  CreateManagedUserRequest,
  CreateManagedUserResponse,
  UpdateManagedUserAccessRequest,
  GrantPropertyAccessRequest,
  UpdatePropertyPermissionsRequest,
  BulkUpdateAccessRequest,
  UserAccessDetails,
  AuditLog,
  AuditLogQueryParams,
  CacheStats,
  NextPaymentsResponse,
  CreateEmployeeRequest,
  Employee,
  EmployeesDueResponse,
  EmployeesListResponse,
  EmployeeStatus,
  GetEmployeesParams,
  PaymentHistoryResponse,
  PaymentStatusSummaryResponse,
  RecordSalaryPaymentRequest,
  RemindersResponse,
  SalaryPayment,
  StatisticsResponse,
  UpcomingPaymentsResponse,
  UpdateEmployeeRequest,
  TaskPriority,
  ToDoStatus,
  GetPropertyRentReportParams,
  PropertyRentPaymentReportResponse,
  GetPropertyBillsReportParams,
  PropertyBillsPaymentReportResponse,
  AttachmentsListResponse,
  AttachmentUploadResponse,
  DeleteAttachmentResponse,
  UpdateAttachmentRequest,
  CreateServiceProviderRequest,
  ServiceProviderAttachment,
  ServiceProviderAttachmentResponse,
  ServiceProviderAttachmentsListResponse,
  ServiceProviderAttachmentUploadResponse,
  ServiceProviderAttachmentUrlResponse,
  ServiceProviderAttachmentWithUrls,
  ServiceProviderDeleteAttachmentResponse,
  UpdateServiceProviderAttachmentRequest,
  UpdateServiceProviderRequest,
  OtherIncome,
  OtherIncomeCategory,
  OtherIncomeAttachment,
  CreateOtherIncomeRequest,
  UpdateOtherIncomeRequest,
  MarkOtherIncomeAsPaidRequest,
  OtherIncomeStatsResponse,
  OtherIncomeListResponse,
  UploadOtherIncomeAttachmentRequest,
  VATType, 
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.interparkpropertysystem.co.ke/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Helper function to format date for API
const formatDateForAPI = (date: string | Date | undefined): string | undefined => {
  if (!date) return undefined;
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Validate the date
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date provided:', date);
      return undefined;
    }
    
    // Format as YYYY-MM-DD
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return undefined;
  }
};

// Add token to requests
api.interceptors.request.use((config) => {
  // Check if we're in browser environment before accessing localStorage
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Custom error class for API errors with additional data
export class ApiError extends Error {
  public data?: any;
  public statusCode?: number;
  
  constructor(message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.data = data;
    this.statusCode = data?.statusCode;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
  
  // Helper to get validation errors
  get validationErrors() {
    return this.data?.validationErrors || this.data?.missingFields;
  }
  
  // Helper to check if it's a validation error
  isValidationError() {
    return this.statusCode === 400 || this.data?.missingFields;
  }
  
  // Helper to check if it's a not found error
  isNotFoundError() {
    return this.statusCode === 404;
  }
  
  // Helper to check if it's an authorization error
  isAuthorizationError() {
    return this.statusCode === 401 || this.statusCode === 403;
  }
}

// Flag to prevent multiple redirects
let isRedirecting = false;

// Handle token expiration - DON'T auto-redirect, let the auth context handle it
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Skip token clearing for logout-related requests
    const isLogoutRequest = error.config?.url?.includes('/logout');
    
    // Only redirect on 401 if we're not already on login page and not already redirecting
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isLogoutRequest) {
      const isLoginPage = window.location.pathname === '/login';
      const isAuthRoute = window.location.pathname === '/register' || 
                         window.location.pathname === '/forgot-password' ||
                         window.location.pathname === '/change-password';
      
      // Only clear token and redirect if not already on auth page and not already redirecting
      if (!isLoginPage && !isAuthRoute && !isRedirecting) {
        isRedirecting = true;
        
        // Clear token
        localStorage.removeItem('token');
        
        // Clear cookie
        document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        
        // Store current path for redirect after login
        const currentPath = window.location.pathname;
        sessionStorage.setItem('redirectAfterLogin', currentPath);
        
        // Redirect to login
        window.location.href = '/login';
        
        // Reset redirect flag after a delay
        setTimeout(() => {
          isRedirecting = false;
        }, 1000);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to handle API errors
const handleApiError = (error: any) => {
  if (error.response) {
    // Server responded with error status
    throw new Error(error.response.data.message || 'API request failed');
  } else if (error.request) {
    // Request made but no response received
    throw new Error('No response from server. Please check your connection.');
  } else {
    // Something else happened
    throw new Error('An unexpected error occurred');
  }
};

export const authAPI = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  register: async (name: string, email: string, password: string, role?: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register', { name, email, password, role });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getProfile: async (): Promise<User> => {
    try {
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Register Admin (First admin or by existing admin)
  registerAdmin: async (name: string, email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await api.post('/auth/register-admin', { name, email, password });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Change Password
  changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await api.post('/auth/change-password', { currentPassword, newPassword });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Get All Users (Admin only)
  getAllUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/auth/users');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Get Pending Users (Admin only)
  getPendingUsers: async (): Promise<User[]> => {
    try {
      const response = await api.get('/auth/users/pending');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Update User Role (Admin only)
  updateUserRole: async (userId: string, role: 'ADMIN' | 'MANAGER' | 'USER'): Promise<User> => {
    try {
      const response = await api.put(`/auth/users/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Approve/Reject User (Admin only)
  approveUser: async (userId: string, isApproved: boolean): Promise<{ message: string; user: User }> => {
    try {
      const response = await api.put(`/auth/users/${userId}/approve`, { isApproved });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const landlordsAPI = {
  getAll: async (): Promise<Landlord[]> => {
    try {
      const response = await api.get('/landlords');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<Landlord> => {
    try {
      const response = await api.get(`/landlords/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Partial<Landlord>): Promise<Landlord> => {
    try {
      const response = await api.post('/landlords', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<Landlord>): Promise<Landlord> => {
    try {
      const response = await api.put(`/landlords/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/landlords/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const propertiesAPI = {
  getAll: async (): Promise<Property[]> => {
    try {
      const response = await api.get('/properties');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<Property> => {
    try {
      const response = await api.get(`/properties/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getManagerProperties: async (managerId: string): Promise<Property[]> => {
    try {
      const response = await api.get(`/properties/manager/my-properties`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (formData: FormData): Promise<Property> => {
    try {
      const response = await api.post('/properties', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, formData: FormData): Promise<Property> => {
    try {
      const response = await api.put(`/properties/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateImage: async (id: string, formData: FormData): Promise<Property> => {
    try {
      const response = await api.put(`/properties/${id}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  updateCommission: async (id: string, commissionFee: number): Promise<Property> => {
    try {
      const response = await api.put(`/properties/${id}/commission`, { commissionFee });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getPropertyImage: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/properties/${id}/image`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error: any) {
      // Special handling for blob error responses
      if (error.response && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to fetch property image');
        } catch {
          throw new Error('Failed to fetch property image');
        }
      }
      
      // For non-blob errors
      if (error.response) {
        throw new Error(error.response.data.message || 'API request failed');
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error('An unexpected error occurred');
      }
    }
  },


  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/properties/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const unitsAPI = {
 getAll: async (params?: { propertyId?: string; status?: string; }): Promise<Unit[]> => {
    try {
      if (params?.propertyId) {
        // Use property-specific endpoint with optional status filter
        const response = await api.get(`/units/property/${params.propertyId}`, {
          params: params.status ? { status: params.status } : {}
        });
        return response.data;
      }
      // Fallback to regular endpoint
      const response = await api.get('/units');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getByProperty: async (propertyId: string): Promise<Unit[]> => {
    try {
      const response = await api.get(`/units/property/${propertyId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<Unit> => {
    try {
      const response = await api.get(`/units/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
 create: async (data: Partial<Unit>): Promise<Unit> => {
    try {
      const response = await api.post('/units', data);
      // Check the response structure
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Get detailed error message from backend
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to save unit';
      throw new Error(message);
    }
  },
  update: async (id: string, data: Partial<Unit>): Promise<Unit> => {
    try {
      const response = await api.put(`/units/${id}`, data);
      if (response.data && response.data.id) {
        return response.data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 
                     error.message || 
                     'Failed to update unit';
      throw new Error(message);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/units/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const tenantsAPI = {
  // =============================================
  // BASIC CRUD OPERATIONS
  // =============================================

  getAll: async (): Promise<Tenant[]> => {
    try {
      const response = await api.get('/tenants');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getByProperty: async (propertyId: string): Promise<Tenant[]> => {
    try {
      const response = await api.get(`/tenants/property/${propertyId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tenants by property:', error);
      return [];
    }
  },

  getNextPaymentsByProperty: async (propertyId: string): Promise<NextPaymentsResponse> => {
    try {
      const response = await api.get(`/tenants/property/${propertyId}/next-payments`);
      return response.data;
    } catch (error) {
      console.error('Error fetching next payments:', error);
      return handleApiError(error);
    }
  },

  getById: async (id: string): Promise<Tenant> => {
    try {
      const response = await api.get(`/tenants/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getOverdue: async (
    propertyId?: string, 
    daysOverdue?: number | string, 
    customDays?: number
  ): Promise<OverdueTenantsResponse> => {
    try {
      const params: Record<string, string> = {};
      
      if (propertyId) {
        params.propertyId = propertyId;
      }
      
      if (daysOverdue) {
        params.daysOverdue = daysOverdue.toString();
      }
      
      if (customDays && daysOverdue === 'custom') {
        params.customDays = customDays.toString();
      }
      
      const response = await api.get('/tenants/overdue', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  create: async (data: Partial<Tenant>): Promise<Tenant> => {
    try {
      const response = await api.post('/tenants', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  update: async (id: string, data: Partial<Tenant>): Promise<Tenant> => {
    try {
      const response = await api.put(`/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateServiceCharge: async (id: string, data: Partial<ServiceCharge>): Promise<Tenant> => {
    try {
      const response = await api.patch(`/tenants/${id}/service-charge`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  removeServiceCharge: async (id: string): Promise<Tenant> => {
    try {
      const response = await api.delete(`/tenants/${id}/service-charge`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/tenants/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  // =============================================
  // FINANCIALS
  // =============================================

  getFinancials: async (tenantId: string): Promise<any> => {
    try {
      const response = await api.get(`/tenants/${tenantId}/financials`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // =============================================
  // ATTACHMENTS
  // =============================================

  getAttachments: async (tenantId: string): Promise<AttachmentsListResponse> => {
    try {
      const response = await api.get(`/tenants/${tenantId}/attachments`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  uploadAttachment: async (tenantId: string, file: File): Promise<AttachmentUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/tenants/${tenantId}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  previewAttachment: async (attachmentId: string): Promise<void> => {
    try {
      window.open(`/api/tenants/attachments/${attachmentId}/preview`, '_blank');
    } catch (error) {
      return handleApiError(error);
    }
  },

  downloadAttachment: async (attachmentId: string): Promise<void> => {
    try {
      window.open(`/api/tenants/attachments/${attachmentId}/download`, '_blank');
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateAttachment: async (attachmentId: string, data: UpdateAttachmentRequest): Promise<AttachmentUploadResponse> => {
    try {
      const response = await api.put(`/tenants/attachments/${attachmentId}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  deleteAttachment: async (attachmentId: string): Promise<DeleteAttachmentResponse> => {
    try {
      const response = await api.delete(`/tenants/attachments/${attachmentId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const paymentsAPI = {
  getPaymentReports: async (): Promise<PaymentReport[]> => {
    try {
      const response = await api.get('/payments');

      // Ensure correct shape from backend (`{ success, data, meta }`)
      if (!response.data || !Array.isArray(response.data.data)) {
        throw new Error('Invalid response format from server');
      }

      return response.data.data; // return PaymentReport[]
    } catch (error: any) {
      console.error('Failed to load payment reports:', error);

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch payment reports';

      throw new Error(message);
    }
  },

  getPaymentsByTenant: async (tenantId: string): Promise<PaymentReport[]> => {
    try {
      const response = await api.get(`/payments/tenant/${tenantId}`);
      
      // FIX: Extract data from the response structure { success, data, meta }
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      // Return the actual data array
      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to load tenant payments:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch tenant payment reports';
      throw new Error(message);
    }
  },

  previewPayment: async (tenantId: string, includeCredit: boolean = true): Promise<PaymentPreview> => {
    try {
      const response = await api.get(`/payments/preview/${tenantId}`, {
        params: { includeCredit }
      });
      
      // Extract data from response structure
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data as PaymentPreview;
    } catch (error: any) {
      console.error('Failed to preview payment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to preview payment';
      throw new Error(message);
    }
  },

  getOutstandingInvoices: async (tenantId: string, includeBills: boolean = true): Promise<{
    rentInvoices: Invoice[];
    //billInvoices: BillInvoice[];
    totals: {
      totalRentBalance: number;
      //totalBillBalance: number;
      totalOutstanding: number;
      invoiceCount: number;
      //billInvoiceCount: number;
    };
  }> => {
    try {
      const response = await api.get(`/payments/outstanding/${tenantId}`, {
        params: { includeBills }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load outstanding invoices:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch outstanding invoices';
      throw new Error(message);
    }
  },

  createPaymentReport: async (data: CreatePaymentReportRequest): Promise<CreatePaymentReportResponse> => {
    try {
      // Format the paymentPeriod if it exists
      const formattedPaymentPeriod = data.paymentPeriod 
        ? formatDateForAPI(data.paymentPeriod) 
        : undefined;
      
      // Build the request data
      const requestData = {
        ...data,
        paymentPeriod: formattedPaymentPeriod,
        // Set defaults to match backend behavior
        handleOverpayment: data.handleOverpayment ?? true,
        updateExistingInvoices: data.updateExistingInvoices ?? true,
        createMissingInvoices: data.createMissingInvoices ?? false,
      };
      
      // Log the formatted data for debugging
     /* console.log('Creating payment report with data:', {
        tenantId: requestData.tenantId,
        amountPaid: requestData.amountPaid,
        paymentPeriod: requestData.paymentPeriod,
        notes: requestData.notes,
      });*/
      
      const response = await api.post('/payments', requestData);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create payment report:', error);
      
      // Enhanced error messages for common issues
      let message = error?.response?.data?.message || error?.message || 'Failed to create payment report';
      
      // Check for paymentPeriod related errors
      if (message.includes('paymentPeriod date format')) {
        message = 'Invalid date format. Please provide a valid date (e.g., "2026-07-01")';
      }
      
      throw new Error(message);
    }
  },

  getIncomeReports: async (): Promise<Income[]> => {
    try {
      const response = await api.get('/payments/income');
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data || [];
    } catch (error: any) {
      console.error('Failed to load income reports:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch income reports';
      throw new Error(message);
    }
  },

  createIncome: async (data: Partial<Income>): Promise<Income> => {
    try {
      const response = await api.post('/payments/income', data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create income:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create income record';
      throw new Error(message);
    }
  },
    getArrears: async (propertyId: string): Promise<ArrearsResponse> => {
    try {
      const response = await api.get(`/payments/properties/${propertyId}/arrears`);
      
      // Handle the nested data structure used by your API
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      // Let the axios interceptor handle the error
      throw error;
    }
  },
    // NEW: Update payment report (PUT endpoint exists in routes but not in API)
  updatePaymentReport: async (id: string, data: {
    amountPaid?: number;
    paymentPeriod?: string;
    notes?: string;
    //billIds?: string[];
  }): Promise<any> => {
    try {
      const response = await api.put(`/payments/${id}`, data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update payment report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update payment report';
      throw new Error(message);
    }
  },
    // NEW: Download receipt for a payment
  downloadReceipt: async (paymentReportId: string): Promise<Blob> => {
    try {
      const response = await api.get(`/payments/${paymentReportId}/receipt`, {
        responseType: 'blob', // Important: receive as binary data
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download receipt:', error);
      
      // Handle blob error responses (convert blob to JSON to read error message)
      if (error?.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download receipt');
        } catch {
          throw new Error('Failed to download receipt');
        }
      }

      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download receipt';
      throw new Error(message);
    }
  },

  // Alternative: Get receipt info (URL) without downloading
  getReceiptInfo: async (paymentReportId: string): Promise<{
    receiptUrl: string;
    generatedAt?: string;
  }> => {
    try {
      const response = await api.get(`/payments/${paymentReportId}/receipt/info`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Receipt not found');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get receipt info:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to get receipt information';
      throw new Error(message);
    }
  },
    deletePaymentReport: async (
    id: string, 
    options?: {
      deleteLinkedInvoices?: boolean;
      deleteBillInvoices?: boolean;
      deleteIncome?: boolean;
      force?: boolean;
    }
  ): Promise<{
    success: boolean;
    data: {
      deletedPaymentReport: {
        id: string;
        amountPaid: number;
        status: PaymentStatus;
        paymentPeriod: string;
      };
      deletedReceipt: boolean;
      deletedInvoices: Array<{ id: string; invoiceNumber: string; totalDue: number }>;
      deletedBillInvoices: Array<{ id: string; invoiceNumber: string; totalAmount: number }>;
      deletedIncome: { id: string; amount: number; frequency: IncomeFrequency } | null;
      unlinkCount: number;
    };
    message: string;
  }> => {
    try {
      const response = await api.delete(`/payments/${id}`, {
        data: options || {} // DELETE requests can have a body with axios
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to delete payment report:', error);
      
      // Handle the 90-day protection error specifically
      if (error?.response?.status === 400 && error?.response?.data?.ageInDays) {
        throw new Error(error.response.data.message);
      }
      
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete payment report';
      throw new Error(message);
    }
  },

    // NEW: Get property rent payment report
  getPropertyRentPaymentReport: async (
    propertyId: string,
    params?: GetPropertyRentReportParams
  ): Promise<PropertyRentPaymentReportResponse> => {
    try {
      const response = await api.get(`/payments/property/${propertyId}/rent`, {
        params
      });
      
      // Handle the response structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch property rent payment report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch property rent payment report';
      throw new Error(message);
    }
  },

  // NEW: Get property bills payment report
  getPropertyBillsPaymentReport: async (
    propertyId: string,
    params?: GetPropertyBillsReportParams
  ): Promise<PropertyBillsPaymentReportResponse> => {
    try {
      const response = await api.get(`/payments/property/${propertyId}/bills`, {
        params
      });
      
      // Handle the response structure
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch property bills payment report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch property bills payment report';
      throw new Error(message);
    }
  },

};

// Invoice API functions
export const invoicesAPI = {
  generateInvoice: async (data: GenerateInvoiceRequest): Promise<Invoice> => {
    try {
      const response = await api.post('/invoices/generate', data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getAllInvoices: async (params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    paymentPolicy?: PaymentPolicy;
    propertyId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ data: Invoice[]; meta: any }> => {
    try {
      const response = await api.get('/invoices', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getInvoicesByTenant: async (tenantId: string, params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    paymentPolicy?: PaymentPolicy;
  }): Promise<{ data: Invoice[]; meta: any }> => {
    try {
      const response = await api.get(`/invoices/tenant/${tenantId}`, { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getInvoiceById: async (id: string): Promise<Invoice> => {
    try {
      const response = await api.get(`/invoices/${id}`);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateInvoiceStatus: async (id: string, data: {
    status?: InvoiceStatus;
    amountPaid?: number;
  }): Promise<Invoice> => {
    try {
      const response = await api.patch(`/invoices/${id}/status`, data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateInvoicePaymentPolicy: async (id: string, data: {
    paymentPolicy: PaymentPolicy;
  }): Promise<Invoice> => {
    try {
      const response = await api.patch(`/invoices/${id}/payment-policy`, data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  downloadInvoice: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/invoices/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getPartialPayments: async (propertyId?: string, page = 1, limit = 10) => {
    try {
      const params: any = {
        page: page.toString(),
        limit: limit.toString(),
      };
      if (propertyId) params.propertyId = propertyId;

      const response = await api.get('/invoices/partial-payments', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

    // Enhanced delete invoice function with options for cascading deletes and related data cleanup
  deleteInvoice: async (id: string, data?: DeleteInvoiceRequest): Promise<DeleteInvoiceResponse> => {
    try {
      // Set default values to match backend defaults for complete cleanup
      const defaultData: DeleteInvoiceRequest = {
        deletePaymentReport: true,
        deleteRelatedInvoices: true,
        deleteBillInvoices: true,
        deleteIncome: true,
        deleteCommissions: true,
        cascadeDelete: true,
        force: false
      };

      const requestData = { ...defaultData, ...data };

      const response = await api.delete(`/invoices/${id}`, {
        data: requestData
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

    // Delete invoice PDF only
  deleteInvoicePDF: async (id: string): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await api.delete(`/invoices/${id}/pdf`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  generateFromPartialPayment: async (data: {
    paymentReportId: string;
    dueDate: string;
    notes?: string;
  }) => {
    try {
      const response = await api.post('/invoices/generate-from-partial', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};


export const incomesAPI = {
  getAll: async (): Promise<Income[]> => {
    try {
      const response = await api.get('/incomes');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<Income> => {
    try {
      const response = await api.get(`/incomes/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Partial<Income>): Promise<Income> => {
    try {
      const response = await api.post('/incomes', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<Income>): Promise<Income> => {
    try {
      const response = await api.put(`/incomes/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/incomes/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const serviceProvidersAPI = {
  // =============================================
  // SERVICE PROVIDER CRUD OPERATIONS
  // =============================================

  /**
   * Get all service providers
   * @returns {Promise<ServiceProvider[]>} List of all service providers
   */
  getAll: async (): Promise<ServiceProvider[]> => {
    try {
      const response = await api.get('/service-providers');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get service providers by property
   * @param {string} propertyId - The property ID
   * @returns {Promise<ServiceProvider[]>} List of service providers for the property
   */
  getByProperty: async (propertyId: string): Promise<ServiceProvider[]> => {
    try {
      const response = await api.get(`/service-providers/property/${propertyId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get single service provider by ID
   * @param {string} id - The service provider ID
   * @returns {Promise<ServiceProvider>} The service provider
   */
  getById: async (id: string): Promise<ServiceProvider> => {
    try {
      const response = await api.get(`/service-providers/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Create a new service provider
   * @param {CreateServiceProviderRequest} data - Service provider data
   * @returns {Promise<ServiceProvider>} The created service provider
   */
  create: async (data: CreateServiceProviderRequest): Promise<ServiceProvider> => {
    try {
      const response = await api.post('/service-providers', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update a service provider
   * @param {string} id - The service provider ID
   * @param {UpdateServiceProviderRequest} data - Updated service provider data
   * @returns {Promise<ServiceProvider>} The updated service provider
   */
  update: async (id: string, data: UpdateServiceProviderRequest): Promise<ServiceProvider> => {
    try {
      const response = await api.put(`/service-providers/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Delete a service provider
   * @param {string} id - The service provider ID
   * @returns {Promise<{ message: string; attachmentsDeleted: number }>} Deletion confirmation
   */
  delete: async (id: string): Promise<{ message: string; attachmentsDeleted: number }> => {
    try {
      const response = await api.delete(`/service-providers/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // =============================================
  // SERVICE PROVIDER ATTACHMENT OPERATIONS
  // =============================================

  /**
   * Get all attachments for a service provider
   * @param {string} serviceProviderId - The service provider ID
   * @returns {Promise<ServiceProviderAttachmentWithUrls[]>} List of attachments with URLs
   */
  getAttachments: async (serviceProviderId: string): Promise<ServiceProviderAttachmentWithUrls[]> => {
    try {
      const response = await api.get<ServiceProviderAttachmentsListResponse>(
        `/service-providers/${serviceProviderId}/attachments`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get attachments by category
   * @param {string} serviceProviderId - The service provider ID
   * @param {string} category - The category to filter by
   * @returns {Promise<ServiceProviderAttachmentWithUrls[]>} Filtered list of attachments
   */
  getAttachmentsByCategory: async (
    serviceProviderId: string,
    category: string
  ): Promise<ServiceProviderAttachmentWithUrls[]> => {
    try {
      const response = await api.get<ServiceProviderAttachmentsListResponse>(
        `/service-providers/${serviceProviderId}/attachments/category/${category}`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Upload an attachment for a service provider
   * @param {string} serviceProviderId - The service provider ID
   * @param {File} file - The file to upload
   * @param {Object} metadata - Optional metadata for the attachment
   * @param {string} metadata.description - Description of the attachment
   * @param {string} metadata.category - Category (CONTRACT, CERTIFICATE, etc.)
   * @param {string} metadata.expiryDate - Expiry date (YYYY-MM-DD)
   * @param {string} metadata.version - Version of the document
   * @returns {Promise<ServiceProviderAttachmentUploadResponse>} Upload response with attachment data
   */
  uploadAttachment: async (
    serviceProviderId: string,
    file: File,
    metadata?: {
      description?: string;
      category?: string;
      expiryDate?: string;
      version?: string;
    }
  ): Promise<ServiceProviderAttachmentUploadResponse> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (metadata?.description) {
        formData.append('description', metadata.description);
      }
      if (metadata?.category) {
        formData.append('category', metadata.category);
      }
      if (metadata?.expiryDate) {
        formData.append('expiryDate', metadata.expiryDate);
      }
      if (metadata?.version) {
        formData.append('version', metadata.version);
      }

      const response = await api.post<ServiceProviderAttachmentUploadResponse>(
        `/service-providers/${serviceProviderId}/attachments`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get single attachment details
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<ServiceProviderAttachmentWithUrls>} The attachment with URLs
   */
  getAttachment: async (attachmentId: string): Promise<ServiceProviderAttachmentWithUrls> => {
    try {
      const response = await api.get<ServiceProviderAttachmentResponse>(
        `/service-providers/attachments/${attachmentId}`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Update attachment metadata
   * @param {string} attachmentId - The attachment ID
   * @param {UpdateServiceProviderAttachmentRequest} data - Updated metadata
   * @returns {Promise<ServiceProviderAttachmentWithUrls>} The updated attachment
   */
  updateAttachment: async (
    attachmentId: string,
    data: UpdateServiceProviderAttachmentRequest
  ): Promise<ServiceProviderAttachmentWithUrls> => {
    try {
      const response = await api.put<ServiceProviderAttachmentResponse>(
        `/service-providers/attachments/${attachmentId}`,
        data
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Delete an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<ServiceProviderDeleteAttachmentResponse>} Deletion confirmation
   */
  deleteAttachment: async (attachmentId: string): Promise<ServiceProviderDeleteAttachmentResponse> => {
    try {
      const response = await api.delete<ServiceProviderDeleteAttachmentResponse>(
        `/service-providers/attachments/${attachmentId}`
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Get attachment URLs (preview and download)
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<ServiceProviderAttachmentUrlResponse['data']>} URLs for preview and download
   */
  getAttachmentUrls: async (attachmentId: string): Promise<ServiceProviderAttachmentUrlResponse['data']> => {
    try {
      const response = await api.get<ServiceProviderAttachmentUrlResponse>(
        `/service-providers/attachments/${attachmentId}/url`
      );
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  // =============================================
  // ATTACHMENT UTILITY METHODS
  // =============================================

  /**
   * Get preview URL for an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {string} The preview URL
   */
  getPreviewUrl: (attachmentId: string): string => {
    return `/api/service-providers/attachments/${attachmentId}/preview`;
  },

  /**
   * Get download URL for an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {string} The download URL
   */
  getDownloadUrl: (attachmentId: string): string => {
    return `/api/service-providers/attachments/${attachmentId}/download`;
  },

  /**
   * Preview attachment in a new browser tab
   * @param {string} attachmentId - The attachment ID
   */
  previewInNewTab: (attachmentId: string): void => {
    const previewUrl = serviceProvidersAPI.getPreviewUrl(attachmentId);
    window.open(previewUrl, '_blank');
  },

  /**
   * Download attachment as a blob
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<Blob>} The file as a blob
   */
  downloadAttachmentBlob: async (attachmentId: string): Promise<Blob> => {
    try {
      const response = await api.get(
        `/service-providers/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Trigger download of an attachment
   * @param {string} attachmentId - The attachment ID
   * @param {string} fileName - Optional custom file name for download
   */
  triggerDownload: async (attachmentId: string, fileName?: string): Promise<void> => {
    try {
      const blob = await serviceProvidersAPI.downloadAttachmentBlob(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      if (fileName) {
        link.download = fileName;
      } else {
        // Try to get filename from the API
        try {
          const attachment = await serviceProvidersAPI.getAttachmentUrls(attachmentId);
          link.download = attachment.fileName;
        } catch {
          // Fallback to attachment ID if fileName not available
          link.download = `attachment-${attachmentId}`;
        }
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  // =============================================
  // ATTACHMENT STATISTICS
  // =============================================

  /**
   * Get attachment statistics for a service provider
   * @param {string} serviceProviderId - The service provider ID
   * @returns {Promise<Object>} Statistics about attachments
   */
  getAttachmentStats: async (serviceProviderId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    totalSize: number;
    active: number;
    expired: number;
    expiringSoon: number;
  }> => {
    try {
      const attachments = await serviceProvidersAPI.getAttachments(serviceProviderId);
      
      const stats = {
        total: attachments.length,
        byCategory: {} as Record<string, number>,
        totalSize: 0,
        active: 0,
        expired: 0,
        expiringSoon: 0,
      };

      const now = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      attachments.forEach(att => {
        // Count by category
        const category = att.category || 'UNCATEGORIZED';
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
        
        // Total size
        stats.totalSize += att.fileSize;
        
        // Active status
        if (att.isActive) {
          stats.active++;
        }
        
        // Expiry status
        if (att.expiryDate) {
          const expiry = new Date(att.expiryDate);
          if (expiry < now) {
            stats.expired++;
          } else if (expiry <= thirtyDaysFromNow) {
            stats.expiringSoon++;
          }
        }
      });

      return stats;
    } catch (error) {
      return handleApiError(error);
    }
  },

  /**
   * Check if an attachment is previewable
   * @param {string} fileType - The file type/extension
   * @returns {boolean} True if previewable in browser
   */
  isPreviewable: (fileType: string): boolean => {
    const previewableTypes = ['PDF', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF'];
    return previewableTypes.includes(fileType.toUpperCase());
  },

  /**
   * Get file icon based on file type
   * @param {string} fileType - The file type/extension
   * @returns {string} Emoji icon for the file type
   */
  getFileIcon: (fileType: string): string => {
    const icons: Record<string, string> = {
      'PDF': '📄',
      'DOC': '📝',
      'DOCX': '📝',
      'XLS': '📊',
      'XLSX': '📊',
      'PPT': '📽️',
      'PPTX': '📽️',
      'JPG': '🖼️',
      'JPEG': '🖼️',
      'PNG': '🖼️',
      'GIF': '🖼️',
      'WEBP': '🖼️',
      'SVG': '🖼️',
      'BMP': '🖼️',
      'TIFF': '🖼️',
      'ZIP': '📦',
      'RAR': '📦',
      '7Z': '📦',
      'TXT': '📃',
      'CSV': '📊',
      'JSON': '📋',
      'XML': '📋',
      'HTML': '🌐',
      'MP4': '🎬',
      'MP3': '🎵',
      'WAV': '🎵',
    };
    return icons[fileType.toUpperCase()] || '📎';
  },

  /**
   * Format file size to human readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file category based on file type
   * @param {string} fileType - The file type/extension
   * @returns {string} Category (IMAGE, PDF, DOCUMENT, ARCHIVE, OTHER)
   */
  getFileCategory: (fileType: string): string => {
    const imageTypes = ['JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'SVG', 'BMP', 'TIFF'];
    const docTypes = ['DOC', 'DOCX', 'XLS', 'XLSX', 'PPT', 'PPTX'];
    const archiveTypes = ['ZIP', 'RAR', '7Z', 'GZIP'];
    const pdfTypes = ['PDF'];
    
    const upperType = fileType.toUpperCase();
    if (imageTypes.includes(upperType)) return 'IMAGE';
    if (pdfTypes.includes(upperType)) return 'PDF';
    if (docTypes.includes(upperType)) return 'DOCUMENT';
    if (archiveTypes.includes(upperType)) return 'ARCHIVE';
    return 'OTHER';
  },

  /**
   * Get days until expiry for an attachment
   * @param {ServiceProviderAttachment} attachment - The attachment
   * @returns {number | null} Days until expiry or null if no expiry date
   */
  getDaysUntilExpiry: (attachment: ServiceProviderAttachment): number | null => {
    if (!attachment.expiryDate) return null;
    const expiry = new Date(attachment.expiryDate);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Get expiry status for an attachment
   * @param {ServiceProviderAttachment} attachment - The attachment
   * @returns {string} Status: EXPIRED, EXPIRING_SOON, VALID, UNKNOWN
   */
  getExpiryStatus: (attachment: ServiceProviderAttachment): 'EXPIRED' | 'EXPIRING_SOON' | 'VALID' | 'UNKNOWN' => {
    if (!attachment.expiryDate) return 'UNKNOWN';
    
    const daysUntilExpiry = serviceProvidersAPI.getDaysUntilExpiry(attachment);
    if (daysUntilExpiry === null) return 'UNKNOWN';
    
    if (daysUntilExpiry < 0) return 'EXPIRED';
    if (daysUntilExpiry <= 30) return 'EXPIRING_SOON';
    return 'VALID';
  },
};

export const commissionsAPI = {
  getManagerCommissions: async (managerId: string, params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: ManagerCommission[]; pagination: any }> => {
    try {
      const response = await api.get(`/commissions/manager/${managerId}`, { params });
      
      // Handle the nested data structure
      if (response.data && response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {}
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getCommissionStats: async (managerId: string): Promise<CommissionStats> => {
    try {
      const response = await api.get(`/commissions/manager/${managerId}/stats`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && response.data.data) {
        const apiData = response.data.data;
        
        // Transform the API response to match CommissionStats interface
        const commissionStats: CommissionStats = {
          totalEarned: apiData.summary?.totalEarned || 0,
          totalPending: apiData.summary?.pendingAmount || 0,
          totalProcessing: apiData.summary?.processingAmount || 0,
          totalPaid: apiData.summary?.totalEarned || 0,
          commissionsByProperty: Object.entries(apiData.propertyBreakdown || {}).map(([propertyName, propertyData]: [string, any]) => ({
            propertyId: propertyName,
            propertyName: propertyName,
            totalCommission: propertyData.totalAmount || 0,
          })),
          monthlyBreakdown: []
        };
        
        return commissionStats;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getCommissionsByProperty: async (managerId: string, propertyId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ data: ManagerCommission[]; pagination: any }> => {
    try {
      const response = await api.get(`/commissions/manager/${managerId}/property/${propertyId}`, { params });
      
      // Handle the nested data structure
      if (response.data && response.data.success) {
        return {
          data: response.data.data || [],
          pagination: response.data.pagination || {}
        };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getCommissionById: async (id: string): Promise<ManagerCommission> => {
    try {
      const response = await api.get(`/commissions/${id}`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  updateCommissionStatus: async (id: string, data: {
    status?: CommissionStatus;
    paidDate?: string;
    notes?: string;
  }): Promise<ManagerCommission> => {
    try {
      const response = await api.patch(`/commissions/${id}`, data);
      
      // Handle the nested data structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  markAsProcessing: async (id: string): Promise<ManagerCommission> => {
    try {
      const response = await api.patch(`/commissions/${id}/processing`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },

  markAsPaid: async (id: string): Promise<ManagerCommission> => {
    try {
      const response = await api.patch(`/commissions/${id}/paid`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },

  // NEW: Generate commission invoice
  generateCommissionInvoice: async (
    commissionId: string,
    data: GenerateCommissionInvoiceRequest
  ): Promise<CommissionInvoiceResponse> => {
    try {
      const response = await api.post(`/commissions/${commissionId}/commission-invoice`, data);
      
      if (response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Failed to generate commission invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate commission invoice';
      throw new Error(message);
    }
  },

  // NEW: Download commission invoice PDF
  downloadCommissionInvoice: async (commissionId: string): Promise<Blob> => {
    try {
      const response = await api.get(
        `/commissions/${commissionId}/commission-invoice/download`, // Using commissionId
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to download commission invoice:', error);
      
      // Special handling for blob error responses
      if (error.response && error.response.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to download commission invoice');
        } catch {
          throw new Error('Failed to download commission invoice');
        }
      }
      
      // For non-blob errors
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download commission invoice';
      throw new Error(message);
    }
  },
};

export const leadsAPI = {
  getAll: async (): Promise<Lead[]> => {
    try {
      const response = await api.get('/leads');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getById: async (id: string): Promise<Lead> => {
    try {
      const response = await api.get(`/leads/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  create: async (data: Partial<Lead>): Promise<Lead> => {
    try {
      const response = await api.post('/leads', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createWithOffer: async (data: {
    // Lead data
    name: string;
    email?: string;
    phone: string;
    address?: string;
    idNumber?: string;
    companyName?: string;
    natureOfLead?: string;
    notes?: string;
    
    // Property and Unit
    propertyId: string;
    unitId?: string;
    
    // Offer letter data
    rentAmount?: number;
    deposit?: number;
    leaseTerm?: string;
    serviceCharge?: number;
    escalationRate?: number;
    expiryDate?: string;
    additionalTerms?: string;
    letterType?: LetterType;
  }): Promise<Lead> => {
    try {
      const response = await api.post('/leads/with-offer', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  update: async (id: string, data: Partial<Lead>): Promise<Lead> => {
    try {
      const response = await api.put(`/leads/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/leads/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const todosAPI = {
  // Get all todos with optional filters
  getAll: async (params?: GetTodosQueryParams): Promise<ToDo[]> => {
    try {
      const response = await api.get('/todos', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get single todo by ID
  getById: async (id: string): Promise<ToDo> => {
    try {
      const response = await api.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Create new todo (self-created or manager assigned)
  create: async (data: CreateTodoRequest): Promise<ToDo> => {
    try {
      const response = await api.post('/todos', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update todo (status, details, etc.)
  update: async (id: string, data: UpdateTodoRequest): Promise<ToDo> => {
    try {
      const response = await api.put(`/todos/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Delete todo (Admin/Manager only)
  delete: async (id: string): Promise<{ message: string }> => {
    try {
      const response = await api.delete(`/todos/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Get task statistics for a user
  getStats: async (userId?: string): Promise<TodoStatistics> => {
    try {
      const url = userId ? `/todos/stats/${userId}` : '/todos/stats/';
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Manager approves or rejects self-created task
  approveSelfCreatedTask: async (id: string, data: ApproveSelfCreatedTaskRequest): Promise<{ message: string; todo: ToDo }> => {
    try {
      const response = await api.put(`/todos/${id}/approve-self-task`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Convenience methods for common operations
  
  // User marks task as complete (pending approval)
  markAsComplete: async (id: string, completionNotes?: string): Promise<ToDo> => {
    return todosAPI.update(id, { 
      status: 'PENDING_APPROVAL', 
      completionNotes 
    });
  },
  
  // Manager approves completed task
  approveTask: async (id: string): Promise<ToDo> => {
    return todosAPI.update(id, { status: 'COMPLETED' });
  },
  
  // Manager rejects task
  rejectTask: async (id: string, rejectionReason: string): Promise<ToDo> => {
    return todosAPI.update(id, { 
      status: 'REJECTED', 
      rejectionReason 
    });
  },
  
  // Manager approves self-created task
  approveSelfTask: async (id: string): Promise<{ message: string; todo: ToDo }> => {
    return todosAPI.approveSelfCreatedTask(id, { approved: true });
  },
  
  // Manager rejects self-created task
  rejectSelfTask: async (id: string, rejectionReason: string): Promise<{ message: string; todo: ToDo }> => {
    return todosAPI.approveSelfCreatedTask(id, { approved: false, rejectionReason });
  },
  
  // Get tasks by status
  getByStatus: async (status: ToDoStatus): Promise<ToDo[]> => {
    return todosAPI.getAll({ status });
  },
  
  // Get tasks by priority
  getByPriority: async (priority: TaskPriority): Promise<ToDo[]> => {
    return todosAPI.getAll({ priority });
  },
  
  // Get tasks for a specific user (Manager/Admin only)
  getUserTasks: async (userId: string, status?: ToDoStatus): Promise<ToDo[]> => {
    return todosAPI.getAll({ userId, status });
  }
};

export const newsAPI = {
  getAll: async (): Promise<News[]> => {
    try {
      const response = await api.get('/news');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<News> => {
    try {
      const response = await api.get(`/news/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Partial<News>): Promise<News> => {
    try {
      const response = await api.post('/news', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<News>): Promise<News> => {
    try {
      const response = await api.put(`/news/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/news/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

//  NEW: Bills API
export interface BillPaymentResponse {
  success: boolean;
  data: {
    bill: Bill;
    invoice: BillInvoice | null;
  };
  message: string;
}

export const billsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    type?: BillType;
    status?: BillStatus;
    tenantId?: string;
  }): Promise<BillResponse> => {
    try {
      const response = await api.get('/bills', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getByTenant: async (tenantId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<BillResponse> => {
    try {
      const response = await api.get(`/bills`, { params: { ...params, tenantId } });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
    // NEW: Get last bill info for previous readings
  getLastBillInfo: async (tenantId: string, type: BillType): Promise<{
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
  }> => {
    try {
      const response = await api.get('/bills/last-info', { 
        params: { tenantId, type } 
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },


  getById: async (id: string): Promise<Bill> => {
    try {
      const response = await api.get(`/bills/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  create: async (data: CreateBillRequest): Promise<Bill> => {
    try {
      const response = await api.post('/bills', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  update: async (id: string, data: UpdateBillRequest): Promise<Bill> => {
    try {
      const response = await api.put(`/bills/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/bills/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },

  payBill: async (id: string, data: PayBillRequest): Promise<BillPaymentResponse> => {
    try {
      const response = await api.post(`/bills/${id}/pay`, data);
      return response.data;
    } catch (error: any) {
      // Enhanced error handling for payment issues
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw new Error('Failed to process payment');
    }
  },
};

//Offer Letters API
export const offerLettersAPI = {
  getAll: async (params?: {
    propertyId?: string;
    leadId?: string;
    status?: OfferStatus;
  }): Promise<OfferLetter[]> => {
    try {
      const response = await api.get('/offer-letters', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  // Get offer letters by specific user ID - FIXED to use api instance
  getByUser: async (userId: string): Promise<OfferLetter[]> => {
    try {
      const response = await api.get(`/offer-letters/user/${userId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },


  getById: async (id: string): Promise<OfferLetter> => {
    try {
      const response = await api.get(`/offer-letters/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  create: async (data: {
    leadId: string;
    propertyId: string;
    unitId?: string;
    rentAmount?: number;
    deposit?: number;
    leaseTerm?: string;
    serviceCharge?: number;
    escalationRate?: number;
    expiryDate?: string;
    additionalTerms?: string;
    notes?: string;
    // Additional commercial fields
    rentPerSqFt?: number;
    serviceChargePerSqFt?: number;
    useOfPremises?: string;
    fitOutPeriodMonths?: number;
    depositMonths?: number;
    advanceRentMonths?: number;
    // Additional residential fields
    escalationFrequency?: 'ANNUALLY' | 'BI_ANNUALLY';
  }): Promise<OfferLetter> => {
    try {
      const response = await api.post('/offer-letters', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  createMixedUse: async (data: {
    leadId: string;
    propertyId: string;
    letterType: LetterType; // Must be explicitly provided for mixed-use
    unitId?: string;
    rentAmount?: number;
    deposit?: number;
    leaseTerm?: string;
    serviceCharge?: number;
    escalationRate?: number;
    expiryDate?: string;
    additionalTerms?: string;
    notes?: string;
    // Additional fields
    rentPerSqFt?: number;
    serviceChargePerSqFt?: number;
    useOfPremises?: string;
    fitOutPeriodMonths?: number;
    depositMonths?: number;
    advanceRentMonths?: number;
    escalationFrequency?: 'ANNUALLY' | 'BI_ANNUALLY';
  }): Promise<OfferLetter> => {
    try {
      const response = await api.post('/offer-letters/mixed-use', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  generatePDF: async (id: string): Promise<{ 
    message: string; 
    documentUrl: string; 
    offerLetter: OfferLetter;
  }> => {
    try {
      const response = await api.post(`/offer-letters/${id}/generate-pdf`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  downloadPDF: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/offer-letters/${id}/download`, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  update: async (id: string, data: {
    rentAmount?: number;
    deposit?: number;
    leaseTerm?: string;
    serviceCharge?: number;
    escalationRate?: number;
    expiryDate?: string;
    status?: OfferStatus;
    additionalTerms?: string;
    notes?: string;
    metadata?: Record<string, any>;
  }): Promise<OfferLetter> => {
    try {
      const response = await api.put(`/offer-letters/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  updateStatus: async (id: string, status: OfferStatus): Promise<OfferLetter> => {
    try {
      const response = await api.patch(`/offer-letters/${id}/status`, { status });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/offer-letters/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// Bill Invoice API functions
export const billInvoicesAPI = {
  generate: async (data: GenerateBillInvoiceRequest): Promise<BillInvoice> => {
    try {
      const response = await api.post('/bill-invoices/generate', data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to generate bill invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to generate bill invoice';
      throw new Error(message);
    }
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    tenantId?: string;
    billType?: BillType;
  }): Promise<BillInvoiceResponse> => { // Removed paymentPolicy from params
    try {
      const response = await api.get('/bill-invoices', { params });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to load bill invoices:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch bill invoices';
      throw new Error(message);
    }
  },

  // REMOVED: getByPaymentPolicy function since paymentPolicy is removed from backend
  // getByPaymentPolicy: async (policy: PaymentPolicy, params?: { ... }) => ...

  // REMOVED: getStatsByPaymentPolicy function since paymentPolicy is removed from backend
  // getStatsByPaymentPolicy: async (params?: { ... }): Promise<BillInvoiceStatsByPaymentPolicy> => ...

  getByTenant: async (tenantId: string, params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    billType?: BillType;
  }): Promise<BillInvoiceResponse> => { // Removed paymentPolicy from params
    try {
      const response = await api.get(`/bill-invoices/tenant/${tenantId}`, { params });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to load tenant bill invoices:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch tenant bill invoices';
      throw new Error(message);
    }
  },

  getById: async (id: string): Promise<BillInvoice> => {
    try {
      const response = await api.get(`/bill-invoices/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load bill invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch bill invoice';
      throw new Error(message);
    }
  },

  updatePayment: async (id: string, data: UpdateBillInvoicePaymentRequest): Promise<BillInvoice> => {
    try {
      const response = await api.patch(`/bill-invoices/${id}/payment`, data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update bill invoice payment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update bill invoice payment';
      throw new Error(message);
    }
  },

  // REMOVED: updatePaymentPolicy function since paymentPolicy is removed from backend
  // updatePaymentPolicy: async (id: string, data: { paymentPolicy: PaymentPolicy; }): Promise<BillInvoice> => ...

  recordPayment: async (id: string, data: {
    amountPaid: number;
    paymentDate: string;
    notes?: string;
  }): Promise<BillInvoice> => {
    try {
      const response = await api.post(`/bill-invoices/${id}/record-payment`, data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to record payment for bill invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to record payment for bill invoice';
      throw new Error(message);
    }
  },

  download: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/bill-invoices/${id}/download`, {
        responseType: 'blob',
      });
      
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download bill invoice:', error);
      
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to download bill invoice');
        } catch (parseError) {
          throw new Error('Failed to download bill invoice: Invalid PDF format');
        }
      }
      
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download bill invoice';
      throw new Error(message);
    }
  },

  // Enhanced delete bill invoice function
  deleteBillInvoice: async (id: string, data?: DeleteBillInvoiceRequest): Promise<DeleteBillInvoiceResponse> => {
    try {
      const response = await api.delete(`/bill-invoices/${id}`, {
        data: data || {} // Pass the delete options in request body
      });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to delete bill invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete bill invoice';
      throw new Error(message);
    }
  },

    // Delete bill invoice PDF only
  deleteBillInvoicePDF: async (id: string): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await api.delete(`/bill-invoices/${id}/pdf`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to delete bill invoice PDF:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete bill invoice PDF';
      throw new Error(message);
    }
  },
};

export const dailyReportsAPI = {
  // Create a new daily report
  create: async (data: CreateDailyReportRequest): Promise<DailyReport> => {
    try {
      const response = await api.post('/daily-reports', data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create daily report';
      throw new Error(message);
    }
  },

  // Get report by ID
  getById: async (id: string, includePdf = false): Promise<DailyReport> => {
    try {
      const response = await api.get(`/daily-reports/${id}`, {
        params: { includePdf: includePdf.toString() }
      });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to get daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch daily report';
      throw new Error(message);
    }
  },

  // Update report
  update: async (id: string, data: UpdateDailyReportRequest): Promise<DailyReport> => {
    try {
      const response = await api.put(`/daily-reports/${id}`, data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update daily report';
      throw new Error(message);
    }
  },

  // Submit report (change status from DRAFT to SUBMITTED)
  submit: async (id: string): Promise<DailyReport> => {
    try {
      const response = await api.post(`/daily-reports/${id}/submit`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to submit daily report';
      throw new Error(message);
    }
  },

  // Delete report
  delete: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/daily-reports/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to delete daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete daily report';
      throw new Error(message);
    }
  },

  // Get reports by property
  getByProperty: async (
    propertyId: string, 
    params?: {
      startDate?: string;
      endDate?: string;
      status?: ReportStatus;
      page?: number;
      limit?: number;
    }
  ): Promise<DailyReportsListResponse> => {
    try {
      const response = await api.get(`/daily-reports/property/${propertyId}`, { params });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to get property daily reports:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch property daily reports';
      throw new Error(message);
    }
  },

  // Download report PDF
  downloadPDF: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/daily-reports/${id}/download`, {
        responseType: 'blob',
      });
      
      // Check if we got a valid blob response
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download daily report PDF:', error);
      
      // Check if it's a JSON error response in the blob
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to download daily report PDF');
        } catch (parseError) {
          // If we can't parse as JSON, use generic error
          throw new Error('Failed to download daily report PDF: Invalid PDF format');
        }
      }
      
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download daily report PDF';
      throw new Error(message);
    }
  },

  // Get all reports (admin only)
  getAll: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: ReportStatus;
    propertyId?: string;
    managerId?: string;
  }): Promise<DailyReportsListResponse> => {
    try {
      const response = await api.get('/daily-reports', { params });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to get all daily reports:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch daily reports';
      throw new Error(message);
    }
  },

  // Review report (admin only - approve/reject)
  review: async (
    id: string, 
    action: 'APPROVE' | 'REJECT',
    comments?: string
  ): Promise<DailyReport> => {
    try {
      const response = await api.post(`/daily-reports/${id}/review`, {
        action,
        comments
      });
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to review daily report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to review daily report';
      throw new Error(message);
    }
  },
};

// Activation Requests API
export const activationsAPI = {
  // Get all activation requests with optional filters
  getAll: async (params?: ActivationQueryParams): Promise<ActivationsListResponse> => {
    try {
      const response = await api.get('/activations', { params });
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to load activation requests:', error);
      
      // Create a detailed error message
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch activation requests';
      
      // Include additional data like missingFields for validation errors
      const additionalData = {
        missingFields: errorData?.missingFields,
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Get single activation request by ID
  getById: async (id: string): Promise<ActivationRequest> => {
    try {
      const response = await api.get(`/activations/${id}`);
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load activation request:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch activation request';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Create new activation request
  create: async (data: CreateActivationRequest): Promise<ActivationRequest> => {
    try {
      const response = await api.post('/activations', data);
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create activation request:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to create activation request';
      
      // For validation errors, include missing fields
      const additionalData = {
        missingFields: errorData?.missingFields,
        statusCode: error?.response?.status,
        validationErrors: errorData?.validationErrors,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Update activation request
  update: async (id: string, data: UpdateActivationRequest): Promise<ActivationRequest> => {
    try {
      const response = await api.put(`/activations/${id}`, data);
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update activation request:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to update activation request';
      
      const additionalData = {
        statusCode: error?.response?.status,
        validationErrors: errorData?.validationErrors,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Delete activation request
  delete: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/activations/${id}`);
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }
    } catch (error: any) {
      console.error('Failed to delete activation request:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to delete activation request';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Generate PDF for activation request
  generatePDF: async (id: string, download?: boolean): Promise<{ 
    message: string; 
    documentUrl: string; 
    activation: ActivationRequest;
    pdfBuffer?: string;
  }> => {
    try {
      const response = await api.post(`/activations/${id}/generate-pdf`, null, {
        params: { download }
      });
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to generate activation PDF:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to generate PDF';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Submit activation request for review
  submit: async (id: string, data?: SubmitActivationRequest): Promise<ActivationRequest> => {
    try {
      const response = await api.post(`/activations/${id}/submit`, data);
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to submit activation request:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to submit activation request';
      
      // Include missingFields for validation errors during submission
      const additionalData = {
        missingFields: errorData?.missingFields,
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Download activation PDF
  downloadPDF: async (id: string, updateUrl?: boolean): Promise<Blob> => {
    try {
      const response = await api.get(`/activations/${id}/download`, {
        responseType: 'blob',
        params: { updateUrl }
      });
      
      // Check content type
      const contentType = response.headers['content-type'];
      
      if (contentType === 'application/json') {
        // Handle JSON error response
        const text = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.readAsText(response.data);
        });
        
        const errorData = JSON.parse(text as string);
        throw new ApiError(errorData.message || 'Failed to download activation PDF', errorData);
      }
      
      if (!response.data || response.data.size === 0) {
        throw new ApiError('Received empty PDF file');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download activation PDF:', error);
      
      // Check if it's already an ApiError object
      if (error instanceof ApiError) {
        throw error;
      }
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to download activation PDF';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Get activation statistics
  getStats: async (): Promise<ActivationStats> => {
    try {
      const response = await api.get('/activations/stats');
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch activation stats:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch activation statistics';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },

  // Get VAT summary for activations
  getVATSummary: async (params?: {
    startDate?: string;
    endDate?: string;
    propertyId?: string;
  }): Promise<VATSummaryResponse> => {
    try {
      const response = await api.get('/activations/vat-summary', { params });
      
      if (!response.data || !response.data.success) {
        const errorMessage = response.data?.message || 'Invalid response from server';
        throw new ApiError(errorMessage, response.data);
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch VAT summary:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch VAT summary';
      
      const additionalData = {
        statusCode: error?.response?.status,
        ...errorData
      };
      
      throw new ApiError(message, additionalData);
    }
  },
};

// Demand Letters API
export const demandLettersAPI = {
  // Generate a new demand letter
  generate: async (data: GenerateDemandLetterRequest): Promise<DemandLetter> => {
    try {
      const response = await api.post('/demand-letters/generate', data);
      
      // Backend returns { success, message, data }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to generate demand letter:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to generate demand letter';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Auto-generate demand letter for a tenant
  autoGenerate: async (tenantId: string, data?: { demandPeriod?: string; notes?: string }): Promise<DemandLetter> => {
    try {
      const response = await api.post(`/demand-letters/auto-generate/${tenantId}`, data || {});
      
      // Backend returns { success, message, data }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to auto-generate demand letter:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to auto-generate demand letter';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Batch generate demand letters
  batchGenerate: async (data: { tenantIds: string[]; demandPeriod?: string; notes?: string }): Promise<{
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
  }> => {
    try {
      const response = await api.post('/demand-letters/batch-generate', data);
      
      // Backend returns { success, message, data }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to batch generate demand letters:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to batch generate demand letters';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Get all demand letters with filters
  getAll: async (params?: DemandLetterQueryParams): Promise<{
    data: DemandLetter[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> => {
    try {
      const response = await api.get('/demand-letters', { params });
      
      // Backend returns { success, data, pagination }
      return {
        data: response.data.data,
        pagination: response.data.pagination
      };
    } catch (error: any) {
      console.error('Failed to load demand letters:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch demand letters';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Get single demand letter by ID
  getById: async (id: string): Promise<DemandLetter> => {
    try {
      const response = await api.get(`/demand-letters/${id}`);
      
      // Backend returns { success, data }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to load demand letter:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch demand letter';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Get overdue invoices for a tenant
  getOverdueInvoices: async (tenantId: string): Promise<{
    invoices: Invoice[];
    totalOutstanding: number;
    count: number;
    originalCount: number;
    deduplicationApplied: boolean;
  }> => {
    try {
      const response = await api.get(`/demand-letters/overdue-invoices/${tenantId}`);
      
      // Backend returns { success, data: { invoices, totalOutstanding, count, originalCount, deduplicationApplied } }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch overdue invoices:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to fetch overdue invoices';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Download demand letter PDF
  downloadPDF: async (id: string): Promise<{ documentUrl: string; letterNumber: string }> => {
    try {
      const response = await api.get(`/demand-letters/${id}/download`);
      
      // Backend returns { success, data: { documentUrl, letterNumber } }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to download demand letter PDF:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to download demand letter PDF';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Update demand letter status
  updateStatus: async (id: string, data: UpdateDemandLetterStatusRequest): Promise<DemandLetter> => {
    try {
      const response = await api.patch(`/demand-letters/${id}/status`, data);
      
      // Backend returns { success, message, data }
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update demand letter status:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to update demand letter status';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },

  // Delete demand letter
  delete: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/demand-letters/${id}`);
      
      // Backend returns { success, message }
      // No data to return
    } catch (error: any) {
      console.error('Failed to delete demand letter:', error);
      
      const errorData = error?.response?.data;
      const message = errorData?.message || error?.message || 'Failed to delete demand letter';
      
      throw new ApiError(message, {
        statusCode: error?.response?.status,
        ...errorData
      });
    }
  },
};

// ======================================================
// PERMISSION API FUNCTIONS
// ======================================================

export const permissionsAPI = {
  getAll: async (): Promise<Permission[]> => {
    try {
      const response = await api.get('/rbac/permissions');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch permissions:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch permissions');
    }
  },

  create: async (permissionData: CreatePermissionRequest): Promise<Permission> => {
    try {
      const response = await api.post('/rbac/permissions', permissionData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create permission:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to create permission');
    }
  },
};

// ======================================================
// CUSTOM ROLE API FUNCTIONS
// ======================================================

export const customRolesAPI = {
  getAll: async (): Promise<CustomRole[]> => {
    try {
      const response = await api.get('/rbac/roles');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch custom roles:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch custom roles');
    }
  },

  create: async (roleData: CreateCustomRoleRequest): Promise<CustomRole> => {
    try {
      const response = await api.post('/rbac/roles', roleData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create custom role:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to create custom role');
    }
  },

  update: async (roleId: string, roleData: UpdateCustomRoleRequest): Promise<CustomRole> => {
    try {
      const response = await api.put(`/rbac/roles/${roleId}`, roleData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update custom role:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update custom role');
    }
  },

  delete: async (roleId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/rbac/roles/${roleId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete custom role:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to delete custom role');
    }
  },
};

// ======================================================
// MANAGED USER API FUNCTIONS
// ======================================================

export const managedUsersAPI = {
  getAll: async (params?: {
    role?: string;
    isActive?: boolean;
    propertyId?: string;
  }): Promise<ManagedUser[]> => {
    try {
      const response = await api.get('/rbac/users', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch managed users:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch managed users');
    }
  },

  create: async (userData: CreateManagedUserRequest): Promise<CreateManagedUserResponse> => {
    try {
      const response = await api.post('/rbac/users', userData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create managed user:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to create managed user');
    }
  },

  delete: async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/rbac/users/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to delete managed user:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to delete managed user');
    }
  },

  updateAccess: async (
    userId: string,
    accessData: UpdateManagedUserAccessRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put(`/rbac/users/${userId}/access`, accessData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update managed user access:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update managed user access');
    }
  },

  getAccessDetails: async (userId: string): Promise<UserAccessDetails> => {
    try {
      const response = await api.get(`/rbac/users/${userId}/access-details`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch user access details:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch user access details');
    }
  },

  grantPropertyAccess: async (
    userId: string,
    accessData: GrantPropertyAccessRequest
  ): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await api.post(`/rbac/users/${userId}/property-access`, accessData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to grant property access:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to grant property access');
    }
  },

  revokePropertyAccess: async (
    userId: string,
    propertyId: string
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/rbac/users/${userId}/property-access/${propertyId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to revoke property access:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to revoke property access');
    }
  },

  updatePropertyPermissions: async (
    userId: string,
    propertyId: string,
    permissionsData: UpdatePropertyPermissionsRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put(
        `/rbac/users/${userId}/property-access/${propertyId}/permissions`,
        permissionsData
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to update property permissions:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to update property permissions');
    }
  },

  disable: async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Send an empty object as body to satisfy backend's req.body requirement
      const response = await api.post(`/rbac/users/${userId}/disable`, {});
      return response.data;
    } catch (error: any) {
      console.error('Failed to disable managed user:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to disable managed user');
    }
  },

  enable: async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
      // Send an empty object as body to satisfy backend's req.body requirement
      const response = await api.post(`/rbac/users/${userId}/enable`, {});
      return response.data;
    } catch (error: any) {
      console.error('Failed to enable managed user:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to enable managed user');
    }
  },

  bulkUpdateAccess: async (
    userId: string,
    bulkData: BulkUpdateAccessRequest
  ): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.put(`/rbac/users/${userId}/bulk-access`, bulkData);
      return response.data;
    } catch (error: any) {
      console.error('Failed to bulk update user access:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to bulk update user access');
    }
  },
};

// ======================================================
// AUDIT LOG API FUNCTIONS
// ======================================================

export const auditLogsAPI = {
  getAll: async (params?: AuditLogQueryParams): Promise<AuditLog[]> => {
    try {
      const response = await api.get('/rbac/audit-logs', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch audit logs:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch audit logs');
    }
  },
};

// ======================================================
// CACHE MANAGEMENT API FUNCTIONS
// ======================================================

export const cacheAPI = {
  getStats: async (): Promise<CacheStats> => {
    try {
      const response = await api.get('/rbac/cache-stats');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch cache stats:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to fetch cache stats');
    }
  },

  clearAll: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete('/rbac/cache');
      return response.data;
    } catch (error: any) {
      console.error('Failed to clear cache:', error);
      throw new Error(error?.response?.data?.message || error?.message || 'Failed to clear cache');
    }
  },
};

// ======================================================
// EMPLOYEE API FUNCTIONS
// ======================================================

export const employeesAPI = {
  // Create a new employee (ADMIN/MANAGER only)
  create: async (data: CreateEmployeeRequest): Promise<Employee> => {
    try {
      const response = await api.post('/employees', data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create employee:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to create employee';
      throw new Error(message);
    }
  },

  // Get all employees with filters (ADMIN/MANAGER only)
  getAll: async (params?: GetEmployeesParams): Promise<EmployeesListResponse> => {
    try {
      const response = await api.get('/employees', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch employees:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch employees';
      throw new Error(message);
    }
  },

  // Get employee by ID (ADMIN/MANAGER only)
  getById: async (id: string): Promise<Employee> => {
    try {
      const response = await api.get(`/employees/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch employee:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch employee';
      throw new Error(message);
    }
  },

  // Update employee (ADMIN/MANAGER only)
  update: async (id: string, data: UpdateEmployeeRequest): Promise<Employee> => {
    try {
      const response = await api.put(`/employees/${id}`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update employee:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to update employee';
      throw new Error(message);
    }
  },

  // Update employee status (ADMIN/MANAGER only)
  updateStatus: async (id: string, status: EmployeeStatus): Promise<Employee> => {
    try {
      const response = await api.patch(`/employees/${id}/status`, { status });
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update employee status:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to update employee status';
      throw new Error(message);
    }
  },

  // Get employees due for payment (ADMIN/MANAGER only)
  getDueForPayment: async (): Promise<EmployeesDueResponse> => {
    try {
      const response = await api.get('/employees/due');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch due employees:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch due employees';
      throw new Error(message);
    }
  },

  // Get upcoming payments (ADMIN/MANAGER only)
  getUpcomingPayments: async (): Promise<UpcomingPaymentsResponse> => {
    try {
      const response = await api.get('/employees/upcoming');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch upcoming payments:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch upcoming payments';
      throw new Error(message);
    }
  },

  // Record salary payment (ADMIN/MANAGER only)
  recordPayment: async (employeeId: string, data: RecordSalaryPaymentRequest): Promise<SalaryPayment> => {
    try {
      const response = await api.post(`/employees/${employeeId}/payments`, data);
      return response.data.data;
    } catch (error: any) {
      console.error('Failed to record payment:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to record payment';
      throw new Error(message);
    }
  },

  // Get payment history for an employee (ADMIN/MANAGER only)
  getPaymentHistory: async (employeeId: string): Promise<PaymentHistoryResponse> => {
    try {
      const response = await api.get(`/employees/${employeeId}/payments`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch payment history:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch payment history';
      throw new Error(message);
    }
  },

  // Get statistics (ADMIN/MANAGER only)
  getStatistics: async (): Promise<StatisticsResponse> => {
    try {
      const response = await api.get('/employees/statistics');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch statistics:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch statistics';
      throw new Error(message);
    }
  },

  // Get reminders (ADMIN/MANAGER only)
  getReminders: async (): Promise<RemindersResponse> => {
    try {
      const response = await api.get('/employees/reminders');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch reminders:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch reminders';
      throw new Error(message);
    }
  },

  // Send manual reminders (ADMIN only)
  sendManualReminders: async (): Promise<{ success: boolean; message: string; data: any }> => {
    try {
      const response = await api.post('/employees/reminders/send');
      return response.data;
    } catch (error: any) {
      console.error('Failed to send reminders:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to send reminders';
      throw new Error(message);
    }
  },

  // Get payment status summary (ADMIN/MANAGER only)
  getPaymentStatusSummary: async (): Promise<PaymentStatusSummaryResponse> => {
    try {
      const response = await api.get('/employees/payment-summary');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch payment summary:', error);
      const message = error?.response?.data?.error || error?.message || 'Failed to fetch payment summary';
      throw new Error(message);
    }
  },
};

// ==============================================
// OTHER INCOME API
// ==============================================

export const otherIncomeAPI = {
  /**
   * Get all other incomes for a manager
   * @param {string} managerId - The manager's ID
   * @param {Object} params - Query parameters
   * @param {string} params.status - Filter by status (UNPAID, PAID, PARTIAL, OVERDUE, CANCELLED)
   * @param {string} params.category - Filter by category
   * @param {string} params.startDate - Filter by start date (YYYY-MM-DD)
   * @param {string} params.endDate - Filter by end date (YYYY-MM-DD)
   * @returns {Promise<OtherIncomeListResponse>} List of other incomes with stats
   */
  getMyIncomes: async (
    managerId: string,
    params?: {
      status?: InvoiceStatus;
      category?: OtherIncomeCategory;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<OtherIncomeListResponse> => {
    try {
      const response = await api.get(`/other-income/manager/${managerId}`, { params });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch other incomes:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch other incomes';
      throw new Error(message);
    }
  },

  /**
   * Get a single other income by ID
   * @param {string} id - The other income ID
   * @returns {Promise<OtherIncome>} The other income details
   */
  getById: async (id: string): Promise<OtherIncome> => {
    try {
      const response = await api.get(`/other-income/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch other income:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch other income';
      throw new Error(message);
    }
  },

  /**
   * Create a new other income
   * @param {CreateOtherIncomeRequest} data - The other income data
   * @returns {Promise<OtherIncome>} The created other income
   */
  create: async (data: CreateOtherIncomeRequest): Promise<OtherIncome> => {
    try {
      const response = await api.post('/other-income', data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create other income:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create other income';
      throw new Error(message);
    }
  },

  /**
   * Update an existing other income
   * @param {string} id - The other income ID
   * @param {UpdateOtherIncomeRequest} data - The updated data
   * @returns {Promise<OtherIncome>} The updated other income
   */
  update: async (id: string, data: UpdateOtherIncomeRequest): Promise<OtherIncome> => {
    try {
      const response = await api.put(`/other-income/${id}`, data);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to update other income:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update other income';
      throw new Error(message);
    }
  },

  /**
   * Delete an other income
   * @param {string} id - The other income ID
   * @returns {Promise<{ success: boolean; message: string }>} Deletion confirmation
   */
  delete: async (id: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/other-income/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to delete other income:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete other income';
      throw new Error(message);
    }
  },

  /**
   * Mark an other income as paid
   * @param {string} id - The other income ID
   * @param {MarkOtherIncomeAsPaidRequest} data - Payment details
   * @returns {Promise<OtherIncome>} The updated other income
   */
  markAsPaid: async (id: string, data?: MarkOtherIncomeAsPaidRequest): Promise<OtherIncome> => {
    try {
      const response = await api.patch(`/other-income/${id}/mark-paid`, data || {});
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to mark income as paid:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to mark income as paid';
      throw new Error(message);
    }
  },

  /**
   * Download the invoice PDF for an other income
   * @param {string} id - The other income ID
   * @returns {Promise<Blob>} The PDF blob
   */
  downloadInvoice: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/other-income/${id}/download`, {
        responseType: 'blob',
      });
      
      // Check if we got a valid blob response
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download invoice:', error);
      
      // Check if it's a JSON error response in the blob
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.message || 'Failed to download invoice');
        } catch (parseError) {
          throw new Error('Failed to download invoice: Invalid PDF format');
        }
      }
      
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download invoice';
      throw new Error(message);
    }
  },

  /**
   * Upload an attachment for an other income
   * @param {string} id - The other income ID
   * @param {File} file - The file to upload
   * @param {string} description - Optional description
   * @returns {Promise<OtherIncomeAttachment>} The uploaded attachment
   */
  uploadAttachment: async (
    id: string,
    file: File,
    description?: string
  ): Promise<OtherIncomeAttachment> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (description) {
        formData.append('description', description);
      }

      const response = await api.post(`/other-income/${id}/attachments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to upload attachment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload attachment';
      throw new Error(message);
    }
  },

  /**
   * Delete an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<{ success: boolean; message: string }>} Deletion confirmation
   */
  deleteAttachment: async (attachmentId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.delete(`/other-income/attachments/${attachmentId}`);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to delete attachment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete attachment';
      throw new Error(message);
    }
  },

  /**
   * Get statistics for other income
   * @param {string} managerId - The manager's ID
   * @param {Object} params - Query parameters
   * @param {string} params.year - The year to get stats for
   * @returns {Promise<OtherIncomeStatsResponse>} Statistics data
   */
  getStats: async (
    managerId: string,
    params?: {
      year?: string;
    }
  ): Promise<OtherIncomeStatsResponse> => {
    try {
      const response = await api.get(`/other-income/stats/${managerId}`, { params });
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
      }

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch income stats:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to fetch income statistics';
      throw new Error(message);
    }
  },

  /**
   * Get the preview URL for an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {string} The preview URL
   */
  getAttachmentPreviewUrl: (attachmentId: string): string => {
    return `/api/other-income/attachments/${attachmentId}/preview`;
  },

  /**
   * Get the download URL for an attachment
   * @param {string} attachmentId - The attachment ID
   * @returns {string} The download URL
   */
  getAttachmentDownloadUrl: (attachmentId: string): string => {
    return `/api/other-income/attachments/${attachmentId}/download`;
  },

  /**
   * Preview an attachment in a new browser tab
   * @param {string} attachmentId - The attachment ID
   */
  previewAttachment: (attachmentId: string): void => {
    const previewUrl = otherIncomeAPI.getAttachmentPreviewUrl(attachmentId);
    window.open(previewUrl, '_blank');
  },

  /**
   * Download an attachment as a blob
   * @param {string} attachmentId - The attachment ID
   * @returns {Promise<Blob>} The file as a blob
   */
  downloadAttachmentBlob: async (attachmentId: string): Promise<Blob> => {
    try {
      const response = await api.get(
        `/other-income/attachments/${attachmentId}/download`,
        {
          responseType: 'blob',
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Failed to download attachment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to download attachment';
      throw new Error(message);
    }
  },

  /**
   * Trigger download of an attachment
   * @param {string} attachmentId - The attachment ID
   * @param {string} fileName - Optional custom file name
   */
  triggerAttachmentDownload: async (attachmentId: string, fileName?: string): Promise<void> => {
    try {
      const blob = await otherIncomeAPI.downloadAttachmentBlob(attachmentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `attachment-${attachmentId}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  },

  /**
   * Check if a file type is previewable in browser
   * @param {string} fileType - The file MIME type
   * @returns {boolean} True if previewable
   */
  isPreviewable: (fileType: string): boolean => {
    const previewableTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'application/pdf',
    ];
    return previewableTypes.includes(fileType.toLowerCase());
  },

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Get file icon based on file type
   * @param {string} fileType - The file MIME type
   * @returns {string} Emoji icon
   */
  getFileIcon: (fileType: string): string => {
    const icons: Record<string, string> = {
      'application/pdf': '📄',
      'image/jpeg': '🖼️',
      'image/jpg': '🖼️',
      'image/png': '🖼️',
      'image/gif': '🖼️',
      'image/webp': '🖼️',
      'image/svg+xml': '🖼️',
      'application/msword': '📝',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
      'application/vnd.ms-excel': '📊',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '📊',
      'application/vnd.ms-powerpoint': '📽️',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '📽️',
      'text/plain': '📃',
      'text/csv': '📊',
      'application/zip': '📦',
      'application/x-rar-compressed': '📦',
    };
    return icons[fileType.toLowerCase()] || '📎';
  },

  /**
   * Get income category label for display
   * @param {OtherIncomeCategory} category - The category
   * @returns {string} Human-readable category label
   */
  getCategoryLabel: (category: OtherIncomeCategory): string => {
    const labels: Record<OtherIncomeCategory, string> = {
      CONSULTANCY: 'Consultancy',
      PROPERTY_SALES: 'Property Sales',
      LEASING: 'Leasing',
      PROJECT_MANAGEMENT: 'Project Management',
      REFERRAL: 'Referral',
      DOCUMENTATION: 'Documentation',
      INSPECTION: 'Inspection',
      TRAINING: 'Training',
      OTHER: 'Other',
    };
    return labels[category] || category;
  },

  /**
   * Get all available categories for dropdown
   * @returns {Array<{ value: OtherIncomeCategory; label: string }>} List of categories
   */
  getCategories: (): Array<{ value: OtherIncomeCategory; label: string }> => {
    return [
      { value: 'CONSULTANCY', label: 'Consultancy' },
      { value: 'PROPERTY_SALES', label: 'Property Sales' },
      { value: 'LEASING', label: 'Leasing' },
      { value: 'PROJECT_MANAGEMENT', label: 'Project Management' },
      { value: 'REFERRAL', label: 'Referral' },
      { value: 'DOCUMENTATION', label: 'Documentation' },
      { value: 'INSPECTION', label: 'Inspection' },
      { value: 'TRAINING', label: 'Training' },
      { value: 'OTHER', label: 'Other' },
    ];
  },

  /**
   * Get VAT type options for dropdown
   * @returns {Array<{ value: VATType; label: string }>} List of VAT types
   */
  getVatTypes: (): Array<{ value: VATType; label: string }> => {
    return [
      { value: 'EXCLUSIVE', label: 'Exclusive (Add VAT)' },
      { value: 'INCLUSIVE', label: 'Inclusive (VAT Included)' },
      { value: 'NOT_APPLICABLE', label: 'Not Applicable' },
    ];
  },

  /**
   * Calculate VAT and total amounts
   * @param {number} amount - The base amount
   * @param {number} vatRate - The VAT rate (percentage)
   * @param {VATType} vatType - The VAT type
   * @returns {{ vatAmount: number; totalAmount: number }} Calculated amounts
   */
  calculateVat: (
    amount: number,
    vatRate: number,
    vatType: VATType
  ): { vatAmount: number; totalAmount: number } => {
    let vatAmount = 0;
    let totalAmount = amount;

    if (vatType === 'EXCLUSIVE') {
      vatAmount = (amount * vatRate) / 100;
      totalAmount = amount + vatAmount;
    } else if (vatType === 'INCLUSIVE') {
      vatAmount = (amount * vatRate) / (100 + vatRate);
      totalAmount = amount;
    }

    return { vatAmount, totalAmount };
  },

  /**
   * Generate a description for the invoice
   * @param {string} title - The income title
   * @param {string} clientName - The client name
   * @param {string} category - The income category
   * @returns {string} Generated description
   */
  generateDescription: (title: string, clientName: string, category: OtherIncomeCategory): string => {
    const categoryLabel = otherIncomeAPI.getCategoryLabel(category);
    return `${categoryLabel} services for ${clientName} - ${title}`;
  },

  /**
   * Validate form data before submission
   * @param {CreateOtherIncomeRequest} data - The form data
   * @returns {{ valid: boolean; errors: string[] }} Validation result
   */
  validateForm: (data: CreateOtherIncomeRequest): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }

    if (!data.clientName || data.clientName.trim().length === 0) {
      errors.push('Client name is required');
    }

    if (!data.amount || data.amount <= 0) {
      errors.push('Amount must be greater than 0');
    }

    if (data.vatType !== 'NOT_APPLICABLE') {
      if (data.vatRate === undefined || data.vatRate === null || data.vatRate < 0) {
        errors.push('VAT rate is required when VAT is applicable');
      }
    }

    if (!data.managerId) {
      errors.push('Manager ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
export default api;