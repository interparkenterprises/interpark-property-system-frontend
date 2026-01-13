import axios from 'axios';
import { 
  User, Landlord, Property, Unit, Tenant, 
  PaymentReport, PaymentPreview, Income, ServiceProvider, Lead, 
  ToDo, News, AuthResponse, ManagerCommission, CommissionStats,
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
  ActivationStatus,
  PaymentPolicy,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.interparkpropertysystem.co.ke/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

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

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
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
      const response = await api.get(`/properties/manager/${managerId}`);
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
  getAll: async (): Promise<Tenant[]> => {
    try {
      const response = await api.get('/tenants');
      return response.data;
    } catch (error) {
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

  previewPayment: async (tenantId: string): Promise<PaymentPreview> => {
    try {
      const response = await api.get(`/payments/preview/${tenantId}`);
      
      // Extract data from response structure
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to preview payment:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to preview payment';
      throw new Error(message);
    }
  },

  createPaymentReport: async (data: Partial<PaymentReport>): Promise<PaymentReport> => {
    try {
      const response = await api.post('/payments', data);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to create payment report:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to create payment report';
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

    // Enhanced delete invoice function
  deleteInvoice: async (id: string, data?: DeleteInvoiceRequest): Promise<DeleteInvoiceResponse> => {
    try {
      const response = await api.delete(`/invoices/${id}`, {
        data: data || {} // Pass the delete options in request body
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
  getAll: async (): Promise<ServiceProvider[]> => {
    try {
      const response = await api.get('/service-providers');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getByProperty: async (propertyId: string): Promise<ServiceProvider[]> => {
    try {
      const response = await api.get(`/service-providers/property/${propertyId}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<ServiceProvider> => {
    try {
      const response = await api.get(`/service-providers/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Partial<ServiceProvider>): Promise<ServiceProvider> => {
    try {
      const response = await api.post('/service-providers', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<ServiceProvider>): Promise<ServiceProvider> => {
    try {
      const response = await api.put(`/service-providers/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/service-providers/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
};

export const commissionsAPI = {
  getManagerCommissions: async (managerId: string): Promise<ManagerCommission[]> => {
    try {
      const response = await api.get(`/commissions/manager/${managerId}`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
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
          totalPaid: apiData.summary?.totalEarned || 0, // Assuming totalEarned represents paid amount
          commissionsByProperty: Object.entries(apiData.propertyBreakdown || {}).map(([propertyName, propertyData]: [string, any]) => ({
            propertyId: propertyName, // You might need to get actual property IDs
            propertyName: propertyName,
            totalCommission: propertyData.totalAmount || 0,
          })),
          monthlyBreakdown: [] // Add this if your API provides monthly data
        };
        
        return commissionStats;
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      return handleApiError(error);
    }
  },
  
  getCommissionsByProperty: async (managerId: string, propertyId: string): Promise<ManagerCommission[]> => {
    try {
      const response = await api.get(`/commissions/manager/${managerId}/property/${propertyId}`);
      
      // Handle the nested data structure
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        return response.data.data;
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
  
  updateCommissionStatus: async (id: string, status: string, paidDate?: string, notes?: string): Promise<ManagerCommission> => {
    try {
      const response = await api.put(`/commissions/${id}/status`, { status, paidDate, notes });
      
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
  getAll: async (): Promise<ToDo[]> => {
    try {
      const response = await api.get('/todos');
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  getById: async (id: string): Promise<ToDo> => {
    try {
      const response = await api.get(`/todos/${id}`);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  create: async (data: Partial<ToDo>): Promise<ToDo> => {
    try {
      const response = await api.post('/todos', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  update: async (id: string, data: Partial<ToDo>): Promise<ToDo> => {
    try {
      const response = await api.put(`/todos/${id}`, data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
  delete: async (id: string): Promise<void> => {
    try {
      await api.delete(`/todos/${id}`);
    } catch (error) {
      return handleApiError(error);
    }
  },
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
  getAll: async (params?: {
    propertyId?: string;
    status?: ActivationStatus;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<ActivationsListResponse> => {
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
  generatePDF: async (id: string): Promise<{ 
    message: string; 
    documentUrl: string; 
    activation: ActivationRequest;
  }> => {
    try {
      const response = await api.post(`/activations/${id}/generate-pdf`);
      
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
  submit: async (id: string): Promise<ActivationRequest> => {
    try {
      const response = await api.post(`/activations/${id}/submit`);
      
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
  downloadPDF: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/activations/${id}/download`, {
        responseType: 'blob',
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
};
export default api;