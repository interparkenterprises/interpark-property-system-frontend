'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { otherIncomeAPI } from '@/lib/api';
import {
  OtherIncome,
  OtherIncomeCategory,
  VATType,
  CreateOtherIncomeRequest,
  UpdateOtherIncomeRequest,
} from '@/types';

interface OtherIncomeFormData {
  title: string;
  description: string;
  amount: number;
  vatRate: number;
  vatType: VATType;
  category: OtherIncomeCategory;
  subCategory: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCompany: string;
  dueDate: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  bankCode: string;
  swiftCode: string;
  currency: string;
}

interface IncomeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingIncome?: OtherIncome | null;
  managerId: string;
}

const OTHER_INCOME_FORM_KEY = 'otherIncomeFormData';

const initialFormData = (): OtherIncomeFormData => ({
  title: '',
  description: '',
  amount: 0,
  vatRate: 16,
  vatType: 'EXCLUSIVE',
  category: 'CONSULTANCY',
  subCategory: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  clientCompany: '',
  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0],
  bankName: '',
  accountName: '',
  accountNumber: '',
  branch: '',
  bankCode: '',
  swiftCode: '',
  currency: 'KES',
});

export default function IncomeFormModal({
  isOpen,
  onClose,
  onSuccess,
  editingIncome = null,
  managerId,
}: IncomeFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OtherIncomeFormData>(initialFormData());

  useEffect(() => {
    if (!isOpen) return;

    if (editingIncome) {
      setFormData({
        title: editingIncome.title,
        description: editingIncome.description || '',
        amount: editingIncome.amount,
        vatRate: editingIncome.vatRate || 0,
        vatType: editingIncome.vatType,
        category: editingIncome.category,
        subCategory: editingIncome.subCategory || '',
        clientName: editingIncome.clientName,
        clientEmail: editingIncome.clientEmail || '',
        clientPhone: editingIncome.clientPhone || '',
        clientAddress: editingIncome.clientAddress || '',
        clientCompany: editingIncome.clientCompany || '',
        dueDate: editingIncome.dueDate ? editingIncome.dueDate.split('T')[0] : '',
        bankName: editingIncome.bankName || '',
        accountName: editingIncome.accountName || '',
        accountNumber: editingIncome.accountNumber || '',
        branch: editingIncome.branch || '',
        bankCode: editingIncome.bankCode || '',
        swiftCode: editingIncome.swiftCode || '',
        currency: editingIncome.currency || 'KES',
      });
      return;
    }

    const saved = localStorage.getItem(OTHER_INCOME_FORM_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData({
          ...initialFormData(),
          ...parsed,
          title: '',
          description: '',
        });
      } catch (error) {
        console.error('Error loading saved form:', error);
        setFormData(initialFormData());
      }
    } else {
      setFormData(initialFormData());
    }
  }, [isOpen, editingIncome]);

  useEffect(() => {
    if (!isOpen || editingIncome) return;
    localStorage.setItem(OTHER_INCOME_FORM_KEY, JSON.stringify(formData));
  }, [formData, isOpen, editingIncome]);

  const formatCurrency = (amount: number, currency = formData.currency || 'KES') => {
    try {
      return new Intl.NumberFormat('en-KE', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setLoading(true);

      const requestData: CreateOtherIncomeRequest = {
        title: formData.title,
        description: formData.description || undefined,
        amount: formData.amount,
        vatRate: formData.vatType !== 'NOT_APPLICABLE' ? formData.vatRate : undefined,
        vatType: formData.vatType,
        category: formData.category,
        subCategory: formData.subCategory || undefined,
        clientName: formData.clientName,
        clientEmail: formData.clientEmail || undefined,
        clientPhone: formData.clientPhone || undefined,
        clientAddress: formData.clientAddress || undefined,
        clientCompany: formData.clientCompany || undefined,
        dueDate: formData.dueDate || undefined,
        bankName: formData.bankName || undefined,
        accountName: formData.accountName || undefined,
        accountNumber: formData.accountNumber || undefined,
        branch: formData.branch || undefined,
        bankCode: formData.bankCode || undefined,
        swiftCode: formData.swiftCode || undefined,
        currency: formData.currency || 'KES',
        managerId,
      };

      if (editingIncome) {
        const updateData: UpdateOtherIncomeRequest = {
          title: requestData.title,
          description: requestData.description,
          amount: requestData.amount,
          vatRate: requestData.vatRate,
          vatType: requestData.vatType,
          category: requestData.category,
          subCategory: requestData.subCategory,
          clientName: requestData.clientName,
          clientEmail: requestData.clientEmail,
          clientPhone: requestData.clientPhone,
          clientAddress: requestData.clientAddress,
          clientCompany: requestData.clientCompany,
          dueDate: requestData.dueDate,
          bankName: requestData.bankName,
          accountName: requestData.accountName,
          accountNumber: requestData.accountNumber,
          branch: requestData.branch,
          bankCode: requestData.bankCode,
          swiftCode: requestData.swiftCode,
          currency: requestData.currency,
        };

        await otherIncomeAPI.update(editingIncome.id, updateData);
        alert('Income updated successfully!');
      } else {
        await otherIncomeAPI.create(requestData);
        alert('Income created successfully!');
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving income:', error);
      alert(error instanceof Error ? error.message : 'Failed to save income');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const calculated =
    formData.amount > 0
      ? otherIncomeAPI.calculateVat(formData.amount, formData.vatRate, formData.vatType)
      : { vatAmount: 0, totalAmount: formData.amount };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <span aria-hidden="true" className="hidden sm:inline-block sm:h-screen sm:align-middle">
          &#8203;
        </span>

        <div className="relative z-10 inline-block w-full max-w-4xl transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:align-middle">
          <div className="border-b border-gray-200 bg-white px-4 pt-5 pb-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingIncome ? 'Edit Income' : 'Add Other Income'}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
                disabled={loading}
                type="button"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="max-h-[75vh] overflow-y-auto px-4 pt-5 pb-4 sm:p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Property Valuation Services"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as OtherIncomeCategory })
                    }
                    disabled={loading}
                  >
                    {otherIncomeAPI.getCategories().map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the service"
                  disabled={loading}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Amount <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                    }
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">VAT Type</label>
                  <select
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.vatType}
                    onChange={(e) => setFormData({ ...formData, vatType: e.target.value as VATType })}
                    disabled={loading}
                  >
                    {otherIncomeAPI.getVatTypes().map((vat) => (
                      <option key={vat.value} value={vat.value}>
                        {vat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">VAT Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    value={formData.vatRate}
                    onChange={(e) =>
                      setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })
                    }
                    disabled={formData.vatType === 'NOT_APPLICABLE' || loading}
                  />
                </div>
              </div>

              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-3">
                  <div>
                    <span className="font-medium">Base Amount:</span>{' '}
                    {formatCurrency(formData.amount)}
                  </div>
                  <div>
                    <span className="font-medium">VAT Amount:</span>{' '}
                    {formatCurrency(calculated.vatAmount)}
                  </div>
                  <div>
                    <span className="font-medium">Total:</span>{' '}
                    <span className="font-semibold text-green-700">
                      {formatCurrency(calculated.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Client Information</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Client Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.clientName}
                      onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Client Company
                    </label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.clientCompany}
                      onChange={(e) => setFormData({ ...formData, clientCompany: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.clientEmail}
                      onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.clientPhone}
                      onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Address</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.clientAddress}
                      onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-gray-900">Payment Details</h4>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Due Date</label>
                    <input
                      type="date"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.dueDate}
                      onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value.toUpperCase() })}
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">Bank Name</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Account Name</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.accountName}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Account Number</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Branch</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Bank Code</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.bankCode}
                      onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                      disabled={loading}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-gray-700">SWIFT Code</label>
                    <input
                      type="text"
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={formData.swiftCode}
                      onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loading}
              >
                {loading ? (editingIncome ? 'Updating...' : 'Creating...') : editingIncome ? 'Update Income' : 'Create Income'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
