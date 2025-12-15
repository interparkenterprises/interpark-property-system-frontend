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
  ArrearsResponse
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

export const invoicesAPI = {
  generateInvoice: async (data: GenerateInvoiceRequest): Promise<Invoice> => {
    try {
      const response = await api.post('/invoices/generate', data);
      return response.data.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  getInvoicesByTenant: async (tenantId: string, params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
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
  // FIXED: Get all partial payments using axios
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

  // FIXED: Generate invoice from partial payment using axios
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

export const billInvoicesAPI = {
  // Generate invoice for a bill
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

  // Get all bill invoices
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    tenantId?: string;
    billType?: BillType;
  }): Promise<BillInvoiceResponse> => {
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

  // Get bill invoices by tenant
  getByTenant: async (tenantId: string, params?: {
    page?: number;
    limit?: number;
    status?: InvoiceStatus;
    billType?: BillType;
  }): Promise<BillInvoiceResponse> => {
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

  // Get single bill invoice by ID
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

  // Update bill invoice payment
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

  // Record payment for bill invoice
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

  // Download bill invoice PDF
  download: async (id: string): Promise<Blob> => {
    try {
      const response = await api.get(`/bill-invoices/${id}/download`, {
        responseType: 'blob',
      });
      
      // Check if we got a valid blob response
      if (!response.data || response.data.size === 0) {
        throw new Error('Received empty PDF file');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to download bill invoice:', error);
      
      // Check if it's a JSON error response in the blob
      if (error.response?.data instanceof Blob) {
        try {
          const errorText = await error.response.data.text();
          const errorData = JSON.parse(errorText);
          throw new Error(errorData.error || 'Failed to download bill invoice');
        } catch (parseError) {
          // If we can't parse as JSON, use generic error
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

  // Delete bill invoice
  delete: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/bill-invoices/${id}`);
      
      if (!response.data || !response.data.success) {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to delete bill invoice:', error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete bill invoice';
      throw new Error(message);
    }
  },
};
export default api;