import { useCallback, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { PermissionCode } from '@/types';

interface ActionPermissions {
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}

interface ModulePermissions {
  properties: ActionPermissions;
  units: ActionPermissions;
  tenants: ActionPermissions;
  leads: ActionPermissions;
  landlords: ActionPermissions;
  offers: ActionPermissions;
  invoices: ActionPermissions;
  payments: ActionPermissions;
  commissions: ActionPermissions;
  users: ActionPermissions;
  roles: ActionPermissions;
  reports: ActionPermissions;
  todos: ActionPermissions;
  news: ActionPermissions;
  serviceProviders: ActionPermissions;
  activations: ActionPermissions;
  bills: ActionPermissions;           // ADDED
  billInvoices: ActionPermissions;   // ADDED
  demandLetters: ActionPermissions;  // ADDED
  income: ActionPermissions;         // ADDED
}

export function usePermissions() {
  const auth = useAuth();

  // ALWAYS call hooks first — before any conditional logic
  const accessiblePropertyIds = useMemo(
    () => auth?.getAccessiblePropertyIds() ?? [],
    [auth?.getAccessiblePropertyIds]
  );

  // Helper function for creating action permissions
  const createActionPermissions = useCallback((
    viewCode: PermissionCode | string,
    createCode: PermissionCode | string,
    editCode: PermissionCode | string,
    deleteCode: PermissionCode | string,
    exportCode: PermissionCode | string
  ): ActionPermissions => ({
    canView: auth?.hasPermission(viewCode) ?? false,
    canCreate: auth?.hasPermission(createCode) ?? false,
    canEdit: auth?.hasPermission(editCode) ?? false,
    canDelete: auth?.hasPermission(deleteCode) ?? false,
    canExport: auth?.hasPermission(exportCode) ?? false,
  }), [auth]);

  // Build permissions with useMemo
  const permissions = useMemo((): ModulePermissions => {
    // If auth is loading or not ready, return all false
    if (!auth || auth.isLoading) {
      return {
        properties: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        units: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        tenants: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        leads: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        landlords: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        offers: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        invoices: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        payments: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        commissions: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        users: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        roles: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        reports: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        todos: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        news: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        serviceProviders: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        activations: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        bills: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        billInvoices: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        demandLetters: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
        income: { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false },
      };
    }

    const {
      hasPermission,
      isAdmin,
      isManager,
      isManagedUser,
    } = auth;

    // Helper to check if managed user has property access
    const hasManagedPropertyAccess = isManagedUser && accessiblePropertyIds.length > 0;

    const makePerms = (
      viewCode: PermissionCode | string,
      createCode: PermissionCode | string,
      editCode: PermissionCode | string,
      deleteCode: PermissionCode | string,
      exportCode: PermissionCode | string
    ): ActionPermissions => ({
      canView: hasPermission(viewCode),
      canCreate: hasPermission(createCode),
      canEdit: hasPermission(editCode),
      canDelete: hasPermission(deleteCode),
      canExport: hasPermission(exportCode),
    });

    return {
      properties: {
        canView: isAdmin || isManager || hasPermission(PermissionCode.VIEW_PROPERTIES) || hasManagedPropertyAccess,
        canCreate: isAdmin || isManager || hasPermission(PermissionCode.CREATE_PROPERTY),
        canEdit: isAdmin || hasPermission(PermissionCode.EDIT_PROPERTY),
        canDelete: isAdmin || hasPermission(PermissionCode.DELETE_PROPERTY),
        canExport: isAdmin || isManager || hasPermission(PermissionCode.VIEW_PROPERTIES) || hasManagedPropertyAccess,
      },
      units: makePerms(
        PermissionCode.VIEW_UNITS,
        PermissionCode.CREATE_UNIT,
        PermissionCode.EDIT_UNIT,
        PermissionCode.DELETE_UNIT,
        PermissionCode.VIEW_UNITS
      ),
      tenants: makePerms(
        PermissionCode.VIEW_TENANTS,
        PermissionCode.CREATE_TENANT,
        PermissionCode.EDIT_TENANT,
        PermissionCode.DELETE_TENANT,
        PermissionCode.VIEW_TENANT_FINANCIALS
      ),
      leads: makePerms(
        PermissionCode.VIEW_LEADS,
        PermissionCode.CREATE_LEAD,
        PermissionCode.EDIT_LEAD,
        PermissionCode.DELETE_LEAD,
        PermissionCode.VIEW_LEADS
      ),
      landlords: makePerms(
        PermissionCode.VIEW_LANDLORDS,
        PermissionCode.CREATE_LANDLORD,
        PermissionCode.EDIT_LANDLORD,
        PermissionCode.DELETE_LANDLORD,
        PermissionCode.VIEW_LANDLORDS
      ),
      offers: makePerms(
        PermissionCode.VIEW_OFFER_LETTERS,
        PermissionCode.CREATE_OFFER_LETTER,
        PermissionCode.EDIT_OFFER_LETTER,
        PermissionCode.DELETE_OFFER_LETTER,
        PermissionCode.VIEW_OFFER_LETTERS
      ),
      invoices: makePerms(
        PermissionCode.VIEW_INVOICES,
        PermissionCode.CREATE_INVOICE,
        PermissionCode.EDIT_INVOICE_STATUS,
        PermissionCode.DELETE_INVOICE,
        PermissionCode.DOWNLOAD_INVOICE
      ),
      payments: makePerms(
        PermissionCode.VIEW_PAYMENT_REPORTS,
        PermissionCode.CREATE_PAYMENT_REPORT,
        PermissionCode.EDIT_PAYMENT_REPORT,
        PermissionCode.DELETE_PAYMENT_REPORT,
        PermissionCode.DOWNLOAD_PAYMENT_RECEIPT
      ),
      commissions: makePerms(
        PermissionCode.VIEW_COMMISSIONS,
        PermissionCode.PROCESS_COMMISSIONS,
        PermissionCode.PROCESS_COMMISSIONS,
        'DELETE_COMMISSION', // Keeping as string since not in enum yet
        PermissionCode.VIEW_COMMISSIONS
      ),
      users: {
        canView: isAdmin || isManager || hasPermission(PermissionCode.VIEW_ALL_USERS),
        canCreate: isAdmin || isManager || hasPermission(PermissionCode.CREATE_USER),
        canEdit: isAdmin || hasPermission(PermissionCode.EDIT_USER_ROLE),
        canDelete: isAdmin || hasPermission(PermissionCode.DELETE_USER),
        canExport: isAdmin || isManager || hasPermission(PermissionCode.VIEW_ALL_USERS),
      },
      roles: {
        canView: isAdmin || hasPermission(PermissionCode.MANAGE_ROLES),
        canCreate: isAdmin || hasPermission(PermissionCode.MANAGE_ROLES),
        canEdit: isAdmin || hasPermission(PermissionCode.MANAGE_ROLES),
        canDelete: isAdmin || hasPermission(PermissionCode.MANAGE_ROLES),
        canExport: isAdmin || hasPermission(PermissionCode.MANAGE_ROLES),
      },
      reports: makePerms(
        PermissionCode.VIEW_DAILY_REPORTS,
        PermissionCode.CREATE_DAILY_REPORTS,
        PermissionCode.EDIT_DAILY_REPORTS,
        PermissionCode.DELETE_DAILY_REPORTS,
        PermissionCode.VIEW_DAILY_REPORTS
      ),
      todos: {
        canView: true,
        canCreate: true,
        canEdit: true,
        canDelete: true,
        canExport: false,
      },
      news: {
        canView: true,
        canCreate: hasPermission('MANAGE_NEWS'),
        canEdit: hasPermission('MANAGE_NEWS'),
        canDelete: hasPermission('MANAGE_NEWS'),
        canExport: false,
      },
      // Service Providers module permissions
      serviceProviders: makePerms(
        PermissionCode.VIEW_SERVICE_PROVIDERS,
        PermissionCode.CREATE_SERVICE_PROVIDER,
        PermissionCode.EDIT_SERVICE_PROVIDER,
        PermissionCode.DELETE_SERVICE_PROVIDER,
        PermissionCode.VIEW_SERVICE_PROVIDERS
      ),
      // Activations module permissions
      activations: makePerms(
        PermissionCode.VIEW_ACTIVATION_REQUESTS,
        PermissionCode.CREATE_ACTIVATION_REQUEST,
        PermissionCode.EDIT_ACTIVATION_REQUEST,
        PermissionCode.DELETE_ACTIVATION_REQUEST,
        PermissionCode.VIEW_ACTIVATION_REQUESTS
      ),
      // Bills (Utility) module permissions
      bills: makePerms(
        PermissionCode.VIEW_BILLS,
        PermissionCode.CREATE_BILL,
        PermissionCode.EDIT_BILL,
        PermissionCode.DELETE_BILL,
        PermissionCode.VIEW_BILLS
      ),
      // Bill Invoices module permissions
      billInvoices: makePerms(
        PermissionCode.VIEW_BILL_INVOICES,
        PermissionCode.CREATE_BILL_INVOICE,
        PermissionCode.EDIT_BILL_INVOICE_PAYMENT,
        PermissionCode.DELETE_BILL_INVOICE,
        PermissionCode.DOWNLOAD_BILL_INVOICE
      ),
      // Demand Letters module permissions
      demandLetters: makePerms(
        PermissionCode.VIEW_DEMAND_LETTERS,
        PermissionCode.CREATE_DEMAND_LETTER,
        PermissionCode.EDIT_DEMAND_LETTER_STATUS,
        PermissionCode.DELETE_DEMAND_LETTER,
        PermissionCode.DOWNLOAD_DEMAND_LETTER
      ),
      // Income module permissions
      income: makePerms(
        PermissionCode.VIEW_INCOMES,
        PermissionCode.CREATE_INCOME,
        PermissionCode.EDIT_INCOME,
        PermissionCode.DELETE_INCOME,
        PermissionCode.VIEW_INCOMES
      ),
    };
  }, [auth, accessiblePropertyIds]);

  const canAccessModule = useCallback((module: keyof ModulePermissions): boolean => {
    const modulePerms = permissions[module];
    return modulePerms.canView || modulePerms.canCreate || modulePerms.canEdit || modulePerms.canDelete;
  }, [permissions]);

  const getVisibleNavigation = useCallback(() => {
    const navigation = [];

    if (permissions.properties.canView) {
      navigation.push({ name: 'Properties', href: '/properties', icon: '🏠' });
    }
    if (permissions.leads.canView && (auth?.isAdmin || auth?.isManager)) {
      navigation.push({ name: 'Leads', href: '/leads', icon: '👥' });
    }
    if (permissions.landlords.canView && (auth?.isAdmin || auth?.isManager)) {
      navigation.push({ name: 'Landlords', href: '/landlords', icon: '👤' });
    }
    if (permissions.offers.canView) {
      navigation.push({ name: 'Offers', href: '/offers', icon: '📄' });
    }
    if (permissions.bills.canView) {
      navigation.push({ name: 'Utility Bills', href: '/bills', icon: '💡' });
    }
    if (permissions.invoices.canView) {
      navigation.push({ name: 'Invoices', href: '/invoices', icon: '📑' });
    }
    if (permissions.payments.canView) {
      navigation.push({ name: 'Payments', href: '/payments', icon: '💰' });
    }
    if (permissions.demandLetters.canView) {
      navigation.push({ name: 'Demand Letters', href: '/demand-letters', icon: '📧' });
    }
    if (permissions.commissions.canView && (auth?.isAdmin || auth?.isManager)) {
      navigation.push({ name: 'My Income', href: '/myIncome', icon: '💰' });
    }
    if (permissions.todos.canView) {
      navigation.push({ name: 'To-Dos', href: '/todos', icon: '✅' });
    }
    if (permissions.news.canView) {
      navigation.push({ name: 'News', href: '/news', icon: '📰' });
    }

    return navigation;
  }, [permissions, auth?.isAdmin, auth?.isManager]);

  // If auth is loading or not ready, return defaults
  if (!auth || auth.isLoading) {
    return {
      permissions,
      hasPermission: () => false,
      canAccessModule: () => false,
      getVisibleNavigation: () => [],
      user: null,
      roleName: null,
      isAdmin: false,
      isManager: false,
      isManagedUser: false,
      getAccessiblePropertyIds: () => [],
      canViewProperty: () => false,
      canEditProperty: () => false,
      canDeleteProperty: () => false,
      canExportProperty: () => false,
      canViewProperties: false,
      canCreateProperty: false,
      canAssignLandlord: false,
      canViewLandlordsForAssignment: false,
      canCreateNewLandlord: false,
      canViewLeads: false,
      canCreateLead: false,
      canEditLead: false,
      canDeleteLead: false,
      canViewLandlords: false,
      canCreateLandlord: false,
      canEditLandlord: false,
      canDeleteLandlord: false,
      canViewOffers: false,
      canCreateOffer: false,
      canEditOffer: false,
      canDeleteOffer: false,
      canViewIncome: false,
      canManageUsers: false,
      canManageRoles: false,
      canViewServiceProviders: false,
      canCreateServiceProvider: false,
      canEditServiceProvider: false,
      canDeleteServiceProvider: false,
      canViewActivations: false,
      canCreateActivation: false,
      canEditActivation: false,
      canDeleteActivation: false,
      // New module flags
      canViewBills: false,
      canCreateBill: false,
      canEditBill: false,
      canDeleteBill: false,
      canViewBillInvoices: false,
      canCreateBillInvoice: false,
      canEditBillInvoice: false,
      canDeleteBillInvoice: false,
      canViewDemandLetters: false,
      canCreateDemandLetter: false,
      canEditDemandLetter: false,
      canDeleteDemandLetter: false,
      canViewIncomeRecords: false,
      canCreateIncomeRecord: false,
      canEditIncomeRecord: false,
      canDeleteIncomeRecord: false,
    };
  }

  const {
    hasPermission,
    isAdmin,
    isManager,
    isManagedUser,
    user,
    roleName,
    getAccessiblePropertyIds: getIds,
    canViewProperty,
    canEditProperty,
    canDeleteProperty,
    canExportProperty,
  } = auth;

  // Helper functions for landlord access based on property creation permission
  const canAssignLandlord = (): boolean => {
    if (isAdmin || isManager) return true;
    
    const hasPropertyCreateAccess = permissions.properties.canCreate;
    const hasLandlordViewAccess = permissions.landlords.canView;
    const hasLandlordCreateAccess = permissions.landlords.canCreate;
    
    return hasPropertyCreateAccess || hasLandlordViewAccess || hasLandlordCreateAccess;
  };

  const canViewLandlordsForAssignment = (): boolean => {
    if (isAdmin || isManager) return true;
    
    if (permissions.properties.canCreate) return true;
    
    return permissions.landlords.canView;
  };

  const canCreateNewLandlord = (): boolean => {
    if (isAdmin || isManager) return true;
    
    if (permissions.properties.canCreate) return true;
    
    return permissions.landlords.canCreate;
  };

  return {
    permissions,
    hasPermission,
    canAccessModule,
    getVisibleNavigation,
    user,
    roleName,
    isAdmin,
    isManager,
    isManagedUser,
    getAccessiblePropertyIds: getIds,
    canViewProperty,
    canEditProperty,
    canDeleteProperty,
    canExportProperty,
    canViewProperties: permissions.properties.canView,
    canCreateProperty: permissions.properties.canCreate,
    canAssignLandlord: canAssignLandlord(),
    canViewLandlordsForAssignment: canViewLandlordsForAssignment(),
    canCreateNewLandlord: canCreateNewLandlord(),
    canViewLeads: (isAdmin || isManager) && permissions.leads.canView,
    canCreateLead: (isAdmin || isManager) && permissions.leads.canCreate,
    canEditLead: (isAdmin || isManager) && permissions.leads.canEdit,
    canDeleteLead: (isAdmin || isManager) && permissions.leads.canDelete,
    canViewLandlords: (isAdmin || isManager) && permissions.landlords.canView,
    canCreateLandlord: (isAdmin || isManager) && permissions.landlords.canCreate,
    canEditLandlord: (isAdmin || isManager) && permissions.landlords.canEdit,
    canDeleteLandlord: (isAdmin || isManager) && permissions.landlords.canDelete,
    canViewOffers: permissions.offers.canView,
    canCreateOffer: permissions.offers.canCreate,
    canEditOffer: permissions.offers.canEdit,
    canDeleteOffer: permissions.offers.canDelete,
    canViewIncome: (isAdmin || isManager) && permissions.commissions.canView,
    canManageUsers: isAdmin || isManager || permissions.users.canView, // FIXED: Now includes isAdmin and isManager
    canManageRoles: isAdmin || permissions.roles.canView, // FIXED: Only ADMINS can manage roles
    // Service Providers
    canViewServiceProviders: permissions.serviceProviders.canView,
    canCreateServiceProvider: permissions.serviceProviders.canCreate,
    canEditServiceProvider: permissions.serviceProviders.canEdit,
    canDeleteServiceProvider: permissions.serviceProviders.canDelete,
    // Activations
    canViewActivations: permissions.activations.canView,
    canCreateActivation: permissions.activations.canCreate,
    canEditActivation: permissions.activations.canEdit,
    canDeleteActivation: permissions.activations.canDelete,
    // Bills (Utility)
    canViewBills: permissions.bills.canView,
    canCreateBill: permissions.bills.canCreate,
    canEditBill: permissions.bills.canEdit,
    canDeleteBill: permissions.bills.canDelete,
    // Bill Invoices
    canViewBillInvoices: permissions.billInvoices.canView,
    canCreateBillInvoice: permissions.billInvoices.canCreate,
    canEditBillInvoice: permissions.billInvoices.canEdit,
    canDeleteBillInvoice: permissions.billInvoices.canDelete,
    // Demand Letters
    canViewDemandLetters: permissions.demandLetters.canView,
    canCreateDemandLetter: permissions.demandLetters.canCreate,
    canEditDemandLetter: permissions.demandLetters.canEdit,
    canDeleteDemandLetter: permissions.demandLetters.canDelete,
    // Income Records
    canViewIncomeRecords: permissions.income.canView,
    canCreateIncomeRecord: permissions.income.canCreate,
    canEditIncomeRecord: permissions.income.canEdit,
    canDeleteIncomeRecord: permissions.income.canDelete,
  };
}