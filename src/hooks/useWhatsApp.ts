// src/hooks/useWhatsApp.ts

import { useState } from 'react';
import api from '@/lib/api';

// Supported document types
const SUPPORTED_DOCUMENTS = [
  'All Payment Reports',
  'Bill Report',
  'Full Report',
  'Invoice',
  'Demand Letter',
  'Bill Invoices'
] as const;

type DocumentType = typeof SUPPORTED_DOCUMENTS[number];

interface WhatsAppSendStatus {
  documentType: DocumentType;
  lastSent: string | null;
  status: 'sent' | 'failed' | 'never_sent' | 'pending';
  whatsappMessageId: string | null;
}

interface WhatsAppSendResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    mediaId: string;
  };
}

interface WhatsAppLog {
  id: string;
  tenantId: string;
  propertyId: string;
  documentType: DocumentType;
  recipientPhone: string;
  whatsappMessageId: string | null;
  status: string;
  sentAt: string;
  tenant?: {
    id: string;
    name: string;
    phoneNumber: string;
  };
  property?: {
    id: string;
    name: string;
  };
}

// Document types that don't require a specific documentId to send
type CombinedReportType = 'All Payment Reports' | 'Bill Report' | 'Full Report';
type PerDocumentType = Exclude<DocumentType, CombinedReportType>;

export interface UseWhatsAppReturn {
  supportedDocuments: DocumentType[];
  sendDocument: (tenantId: string, documentType: PerDocumentType, documentId: string, propertyId?: string) => Promise<WhatsAppSendResponse>;
  sendAllPaymentReports: (tenantId: string, propertyId?: string, customMessage?: string) => Promise<WhatsAppSendResponse>;
  sendBillReport: (tenantId: string, propertyId?: string, customMessage?: string) => Promise<WhatsAppSendResponse>;
  sendComprehensiveReport: (tenantId: string, propertyId?: string, customMessage?: string) => Promise<WhatsAppSendResponse>;
  downloadAllPaymentReports: (tenantId: string, tenantName?: string) => Promise<{ success: boolean; message?: string }>;
  getSendStatus: (tenantId: string) => Promise<WhatsAppSendStatus[]>;
  getLogs: (params?: {
    tenantId?: string;
    propertyId?: string;
    documentType?: DocumentType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }) => Promise<{ data: WhatsAppLog[]; pagination: any }>;
  isLoading: boolean;
  error: string | null;
}

export function useWhatsApp(): UseWhatsAppReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const sendDocument = async (
    tenantId: string,
    documentType: PerDocumentType,
    documentId: string,
    propertyId?: string
  ): Promise<WhatsAppSendResponse> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.post('/whatsapp/send-document', {
        tenantId,
        documentType,
        documentId,
        propertyId,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send document';
      setApiError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendAllPaymentReports = async (
    tenantId: string,
    propertyId?: string,
    customMessage?: string
  ): Promise<WhatsAppSendResponse> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.post(`/whatsapp/send-payment-reports/${tenantId}`, {
        propertyId,
        customMessage,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send payment reports';
      setApiError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendBillReport = async (
    tenantId: string,
    propertyId?: string,
    customMessage?: string
  ): Promise<WhatsAppSendResponse> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.post(`/whatsapp/send-bill-report/${tenantId}`, {
        propertyId,
        customMessage,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send bill report';
      setApiError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const sendComprehensiveReport = async (
    tenantId: string,
    propertyId?: string,
    customMessage?: string
  ): Promise<WhatsAppSendResponse> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.post(`/whatsapp/send-comprehensive-report/${tenantId}`, {
        propertyId,
        customMessage,
      });

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to send comprehensive report';
      setApiError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const downloadAllPaymentReports = async (tenantId: string, tenantName?: string) => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.get(`/whatsapp/payment-reports/${tenantId}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Payment_Reports_${(tenantName || 'Tenant').replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Failed to download payment reports';
      setApiError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const getSendStatus = async (tenantId: string): Promise<WhatsAppSendStatus[]> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.get(`/whatsapp/status/${tenantId}`);

      if (response.data.success) {
        return response.data.data;
      }
      return [];
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch send status';
      setApiError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getLogs = async (params?: {
    tenantId?: string;
    propertyId?: string;
    documentType?: DocumentType;
    startDate?: string;
    endDate?: string;
    limit?: number;
    page?: number;
  }): Promise<{ data: WhatsAppLog[]; pagination: any }> => {
    try {
      setIsLoading(true);
      setApiError(null);

      const response = await api.get('/whatsapp/logs', { params });

      if (response.data.success) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      return { data: [], pagination: {} };
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        'Failed to fetch logs';
      setApiError(errorMessage);
      return { data: [], pagination: {} };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    supportedDocuments: [...SUPPORTED_DOCUMENTS],
    sendDocument,
    sendAllPaymentReports,
    sendBillReport,
    sendComprehensiveReport,
    downloadAllPaymentReports,
    getSendStatus,
    getLogs,
    isLoading,
    error: apiError,
  };
}