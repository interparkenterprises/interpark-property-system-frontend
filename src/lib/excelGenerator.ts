import ExcelJS from 'exceljs';
import { Property, VATType } from '@/types';

export interface ExportSection {
  id: string;
  label: string;
  selected: boolean;
}

// Helper functions for Excel generation
const addSubsectionHeader = (worksheet: ExcelJS.Worksheet, row: number, title: string) => {
  worksheet.mergeCells(`A${row}:R${row}`);
  const cell = worksheet.getCell(`A${row}`);
  cell.value = title.toUpperCase();
  cell.font = { size: 14, bold: true, color: { argb: 'FF1A3A5C' } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F2FF' },
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  worksheet.getRow(row).height = 30;
};

const addTableHeaders = (
  worksheet: ExcelJS.Worksheet,
  row: number,
  headers: string[]
) => {
  const headerRow = worksheet.getRow(row);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0066B2' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF004080' } },
      left: { style: 'thin', color: { argb: 'FF004080' } },
      bottom: { style: 'thin', color: { argb: 'FF004080' } },
      right: { style: 'thin', color: { argb: 'FF004080' } },
    };
  });
  headerRow.height = 32;
};

const addTableRow = (
  worksheet: ExcelJS.Worksheet,
  row: number,
  data: any[],
  isEvenRow: boolean = false,
  isTotalRow: boolean = false
) => {
  const rowData = worksheet.getRow(row);
  
  // Set row height
  rowData.height = isTotalRow ? 28 : 25;
  
  data.forEach((value, index) => {
    const cell = rowData.getCell(index + 1);
    
    if (value && typeof value === 'object' && ('formula' in value || 'result' in value)) {
      if (value.formula) {
        cell.value = { formula: value.formula };
      } else if (value.result !== undefined) {
        cell.value = value.result;
      }
    } else {
      cell.value = value;
    }
    
    // Center alignment for all cells
    cell.alignment = { 
      horizontal: 'center', 
      vertical: 'middle', 
      wrapText: true 
    };
    
    // Set font
    if (isTotalRow) {
      cell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
    } else {
      cell.font = { size: 10 };
    }
    
    // Apply currency formatting to numeric cells
    if (typeof value === 'number' && value > 0) {
      const colIndex = index + 1;
      // Columns that should be formatted as currency: J, L, M, N, O, P, R
      // Or specific columns for different sections
      if ([2, 3, 4, 11, 12, 13, 14, 15, 16, 17].includes(colIndex)) {
        cell.numFmt = '"Ksh "#,##0.00';
      }
    }
    
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };
  });

  if (isEvenRow && !isTotalRow) {
    rowData.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F8FA' },
      };
    });
  }
  
  if (isTotalRow) {
    rowData.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F0FE' },
      };
      cell.border = {
        top: { style: 'medium', color: { argb: 'FF0066B2' } },
        bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
      };
    });
  }
};

const addTotalRow = (
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  totals: any,
  totalLabel: string = 'Total'
) => {
  const totalRow = endRow + 1;
  
  // Clear any existing data in the total row
  for (let col = 1; col <= 18; col++) {
    worksheet.getCell(`${String.fromCharCode(64 + col)}${totalRow}`).value = null;
  }
  
  // Set total label centered across columns A-C
  worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
  const labelCell = worksheet.getCell(`A${totalRow}`);
  labelCell.value = totalLabel;
  labelCell.font = { bold: true, size: 12, color: { argb: 'FF1A3A5C' } };
  labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
  labelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  labelCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Ground Rent total (Column J)
  const groundRentCell = worksheet.getCell(`J${totalRow}`);
  groundRentCell.value = totals.groundRent || 0;
  groundRentCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  groundRentCell.numFmt = '"Ksh "#,##0.00';
  groundRentCell.alignment = { horizontal: 'center', vertical: 'middle' };
  groundRentCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  groundRentCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // VAT total (Column L)
  const vatCell = worksheet.getCell(`L${totalRow}`);
  vatCell.value = totals.vat || 0;
  vatCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  vatCell.numFmt = '"Ksh "#,##0.00';
  vatCell.alignment = { horizontal: 'center', vertical: 'middle' };
  vatCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  vatCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Service Charge total (Column M)
  const serviceChargeCell = worksheet.getCell(`M${totalRow}`);
  serviceChargeCell.value = totals.serviceCharge || 0;
  serviceChargeCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  serviceChargeCell.numFmt = '"Ksh "#,##0.00';
  serviceChargeCell.alignment = { horizontal: 'center', vertical: 'middle' };
  serviceChargeCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  serviceChargeCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Rent total (Column N)
  const rentCell = worksheet.getCell(`N${totalRow}`);
  rentCell.value = totals.rent || 0;
  rentCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  rentCell.numFmt = '"Ksh "#,##0.00';
  rentCell.alignment = { horizontal: 'center', vertical: 'middle' };
  rentCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  rentCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Amount Payable total (Column O)
  const amountPayableCell = worksheet.getCell(`O${totalRow}`);
  amountPayableCell.value = totals.amountPayable || 0;
  amountPayableCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  amountPayableCell.numFmt = '"Ksh "#,##0.00';
  amountPayableCell.alignment = { horizontal: 'center', vertical: 'middle' };
  amountPayableCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  amountPayableCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Amount Paid total (Column P)
  const amountPaidCell = worksheet.getCell(`P${totalRow}`);
  amountPaidCell.value = totals.amountPaid || 0;
  amountPaidCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  amountPaidCell.numFmt = '"Ksh "#,##0.00';
  amountPaidCell.alignment = { horizontal: 'center', vertical: 'middle' };
  amountPaidCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  amountPaidCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Balance total (Column R)
  const balanceCell = worksheet.getCell(`R${totalRow}`);
  balanceCell.value = totals.balance || 0;
  balanceCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
  balanceCell.numFmt = '"Ksh "#,##0.00';
  balanceCell.alignment = { horizontal: 'center', vertical: 'middle' };
  balanceCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F0FE' },
  };
  balanceCell.border = {
    top: { style: 'medium', color: { argb: 'FF0066B2' } },
    bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
  };
  
  // Set row height
  worksheet.getRow(totalRow).height = 30;
};

// Helper function to calculate VAT
const calculateVAT = (
  rentAmount: number,
  serviceChargeValue: number,
  vatType: VATType = 'NOT_APPLICABLE',
  vatRate: number = 16
): { vatAmount: number; taxableAmount: number } => {
  const vatRateDecimal = vatRate / 100;
  
  switch (vatType) {
    case 'INCLUSIVE':
      const totalInclusive = rentAmount + serviceChargeValue;
      const vatAmount = totalInclusive - (totalInclusive / (1 + vatRateDecimal));
      return { vatAmount, taxableAmount: totalInclusive - vatAmount };
    case 'EXCLUSIVE':
      const taxableAmount = rentAmount + serviceChargeValue;
      const vatExclusive = taxableAmount * vatRateDecimal;
      return { vatAmount: vatExclusive, taxableAmount };
    case 'NOT_APPLICABLE':
    default:
      return { vatAmount: 0, taxableAmount: rentAmount + serviceChargeValue };
  }
};

// Helper to get manager name from property
const getManagerName = (property: Property): string => {
  if (property.manager?.name) {
    return property.manager.name;
  }
  // If we have managerId but no name, try to find it in the collection statement
  return property.manager?.name || 'N/A';
};

// Helper to get tenant name from tenantId
const getTenantName = (tenantId: string | null, property: Property): string => {
  if (!tenantId) return 'Property Income';
  const unit = property.units?.find(u => u.tenant?.id === tenantId);
  return unit?.tenant?.fullName || 'Unknown';
};

// Main export function
export const exportPropertyToExcel = async (
  property: Property,
  selectedSectionIds: string[],
  totals: {
    totalIncome: number;
    totalCommissions: number;
    pendingCommissions: number;
    paidCommissions: number;
  },
  collectionStatement?: any
) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Interpark Enterprises Limited';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Collection Statement', {
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      margins: {
        left: 0.25, right: 0.25, top: 0.75, bottom: 0.75,
        header: 0,
        footer: 0
      },
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
    },
  });

  let currentRow = 1;

  // ========== PROPERTY INFORMATION SECTION ==========
  if (selectedSectionIds.includes('propertyInfo')) {
    // Property Name Header
    worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
    const propertyCell = worksheet.getCell(`C${currentRow}`);
    propertyCell.value = property.name.toUpperCase();
    propertyCell.font = { size: 20, bold: true, color: { argb: 'FF1A3A5C' } };
    propertyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow++;

    // Report Title
    worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
    const titleCell = worksheet.getCell(`C${currentRow}`);
    titleCell.value = 'PROPERTY COLLECTION STATEMENT';
    titleCell.font = { size: 16, bold: true, color: { argb: 'FF004080' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    titleCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F7FF' },
    };
    currentRow++;

    // Date Range
    worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
    const dateCell = worksheet.getCell(`C${currentRow}`);
    const dateRange = collectionStatement?.dateRange || {};
    dateCell.value = `Period: ${dateRange.startDate ? new Date(dateRange.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A'} - ${dateRange.endDate ? new Date(dateRange.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`;
    dateCell.font = { size: 14, italic: true, color: { argb: 'FF555555' } };
    dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
    currentRow += 2;

    // Property Details - Two column layout
    const propertyDetails = [
      ['Property Name:', property.name],
      ['Address:', property.address],
      ['LR Number:', property.lrNumber || 'N/A'],
      ['Form:', property.form || 'N/A'],
      ['Usage:', property.usage || 'N/A'],
      ['Landlord:', property.landlord?.name || 'N/A'],
      ['Manager:', getManagerName(property)],
      ['Commission Fee:', property.commissionFee ? `${property.commissionFee}%` : 'N/A'],
    ];

    propertyDetails.forEach(([label, value]) => {
      // Label column - left aligned
      const labelCell = worksheet.getCell(`A${currentRow}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      labelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F8FA' },
      };
      
      // Value column - left aligned
      worksheet.mergeCells(`B${currentRow}:R${currentRow}`);
      const valueCell = worksheet.getCell(`B${currentRow}`);
      valueCell.value = value;
      valueCell.font = { size: 11, color: { argb: 'FF333333' } };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      
      currentRow++;
    });

    currentRow += 2;
  }

  // ========== FINANCIAL SUMMARY SECTION ==========
  if (selectedSectionIds.includes('financialSummary')) {
    addSubsectionHeader(worksheet, currentRow, 'FINANCIAL SUMMARY');
    currentRow++;

    const summaryHeaders = ['Metric', 'Amount'];
    addTableHeaders(worksheet, currentRow, summaryHeaders);
    currentRow++;

    const summary = collectionStatement?.summary || {};
    
    const summaryData = [
      ['Total Units', summary.totalUnits || property.units?.length || 0],
      ['Occupied Units', summary.occupiedUnits || 0],
      ['Vacant Units', summary.vacantUnits || 0],
      ['Occupancy Rate', `${summary.occupancyRate || 0}%`],
      ['Total Rent Potential', `Ksh ${(summary.totalRentPotential || 0).toLocaleString()}`],
      ['Total Deposits', `Ksh ${(summary.totalDeposits || 0).toLocaleString()}`],
      ['Total Rent Collected', `Ksh ${(summary.totalRentCollected || 0).toLocaleString()}`],
      ['Total Service Charge', `Ksh ${(summary.totalServiceCharge || 0).toLocaleString()}`],
      ['Total VAT Collected', `Ksh ${(summary.totalVATCollected || 0).toLocaleString()}`],
      ['Total Bills Amount', `Ksh ${(summary.totalBillsAmount || 0).toLocaleString()}`],
      ['Total Other Incomes', `Ksh ${(summary.totalOtherIncomes || 0).toLocaleString()}`],
      ['Total Commissions', `Ksh ${(summary.totalCommissions || totals.totalCommissions || 0).toLocaleString()}`],
      ['Total Outstanding', `Ksh ${(summary.totalOutstanding || 0).toLocaleString()}`],
      ['Total Revenue', `Ksh ${(summary.totalRevenue || 0).toLocaleString()}`],
      ['Net Revenue', `Ksh ${(summary.netRevenue || 0).toLocaleString()}`],
    ];

    summaryData.forEach(([label, value], index) => {
      const labelCell = worksheet.getCell(`A${currentRow}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
      labelCell.alignment = { horizontal: 'left', vertical: 'middle' };
      if (index % 2 === 0) {
        labelCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F8FA' },
        };
      }
      
      worksheet.mergeCells(`B${currentRow}:R${currentRow}`);
      const valueCell = worksheet.getCell(`B${currentRow}`);
      valueCell.value = value;
      valueCell.font = { size: 11 };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      if (label.includes('Total') && !label.includes('Units')) {
        valueCell.font = { bold: true, size: 11, color: { argb: 'FF004080' } };
      }
      
      currentRow++;
    });

    currentRow += 2;
  }

  // ========== UNITS & TENANTS SECTION ==========
  if (selectedSectionIds.includes('unitsAndTenants')) {
    const unitSummaries = collectionStatement?.unitSummaries || [];
    
    addSubsectionHeader(worksheet, currentRow, 'UNITS & TENANTS');
    currentRow++;

    const unitHeaders = [
      'Unit No', 'Unit Type', 'Status', 'Tenant Name', 'Contact', 'Email',
      'KRAPin', 'Payment Policy', 'Rent Amount', 'Deposit', 'Rent Collected',
      'Service Charge', 'VAT Collected', 'Bills Amount', 'Outstanding'
    ];
    addTableHeaders(worksheet, currentRow, unitHeaders);
    currentRow++;

    let unitTotals = { 
      groundRent: 0, 
      deposit: 0, 
      rentCollected: 0, 
      serviceCharge: 0, 
      vat: 0, 
      billsAmount: 0, 
      outstanding: 0,
      rent: 0,
      amountPayable: 0,
      amountPaid: 0,
      balance: 0
    };

    if (unitSummaries.length > 0) {
      unitSummaries.forEach((unit: any, index: number) => {
        const rowData = [
          unit.unitNo || 'N/A',
          unit.unitType || 'N/A',
          unit.status || 'N/A',
          unit.tenant?.fullName || 'Vacant',
          unit.tenant?.contact || '-',
          unit.tenant?.email || '-',
          unit.tenant?.KRAPin || '-',
          unit.tenant?.paymentPolicy || '-',
          unit.rentAmount || 0,
          unit.financialSummary?.deposit || 0,
          unit.financialSummary?.rentCollected || 0,
          unit.financialSummary?.serviceCharge || 0,
          unit.financialSummary?.vatCollected || 0,
          unit.financialSummary?.billsAmount || 0,
          unit.financialSummary?.outstanding || 0,
        ];
        
        addTableRow(worksheet, currentRow, rowData, index % 2 === 0);
        
        // Update totals
        unitTotals.groundRent += unit.rentAmount || 0;
        unitTotals.deposit += unit.financialSummary?.deposit || 0;
        unitTotals.rentCollected += unit.financialSummary?.rentCollected || 0;
        unitTotals.serviceCharge += unit.financialSummary?.serviceCharge || 0;
        unitTotals.vat += unit.financialSummary?.vatCollected || 0;
        unitTotals.billsAmount += unit.financialSummary?.billsAmount || 0;
        unitTotals.outstanding += unit.financialSummary?.outstanding || 0;
        unitTotals.rent += unit.rentAmount || 0;
        unitTotals.amountPayable += unit.rentAmount || 0;
        unitTotals.amountPaid += unit.financialSummary?.rentCollected || 0;
        unitTotals.balance += unit.financialSummary?.outstanding || 0;
        
        currentRow++;
      });
    } else {
      // Fallback to property.units
      property.units?.forEach((unit, index) => {
        const tenant = unit.tenant;
        const rowData = [
          unit.unitNo || 'N/A',
          unit.unitType || 'N/A',
          unit.status || 'N/A',
          tenant?.fullName || 'Vacant',
          tenant?.contact || '-',
          tenant?.email || '-',
          tenant?.KRAPin || '-',
          tenant?.paymentPolicy || '-',
          unit.rentAmount || 0,
          tenant?.deposit || 0,
          '', // rent collected
          '', // service charge
          '', // vat collected
          '', // bills amount
          '', // outstanding
        ];
        
        addTableRow(worksheet, currentRow, rowData, index % 2 === 0);
        
        unitTotals.groundRent += unit.rentAmount || 0;
        unitTotals.deposit += tenant?.deposit || 0;
        unitTotals.rent += unit.rentAmount || 0;
        unitTotals.amountPayable += unit.rentAmount || 0;
        currentRow++;
      });
    }

    // Add unit totals row
    addTotalRow(worksheet, currentRow - (unitSummaries.length || property.units?.length || 1), currentRow - 1, unitTotals, 'GRAND TOTAL');
    currentRow += 2;
  }

  // ========== INCOME RECORDS SECTION ==========
  if (selectedSectionIds.includes('incomeRecords')) {
    addSubsectionHeader(worksheet, currentRow, 'INCOME RECORDS');
    currentRow++;

    const incomeHeaders = ['Tenant', 'Amount', 'Frequency', 'Date'];
    addTableHeaders(worksheet, currentRow, incomeHeaders);
    currentRow++;

    const incomes = collectionStatement?.rawData?.incomes || property.incomes || [];
    let totalIncomeAmount = 0;

    if (incomes.length > 0) {
      incomes.forEach((income: any, index: number) => {
        const tenantName = income.tenantId 
          ? getTenantName(income.tenantId, property)
          : 'Property Income';
        
        const rowData = [
          tenantName,
          income.amount || 0,
          income.frequency || 'MONTHLY',
          income.createdAt ? new Date(income.createdAt).toLocaleDateString('en-GB') : '-',
        ];
        
        addTableRow(worksheet, currentRow, rowData, index % 2 === 0);
        
        totalIncomeAmount += income.amount || 0;
        currentRow++;
      });
    } else {
      const rowData = ['No income records found', '', '', ''];
      addTableRow(worksheet, currentRow, rowData);
      currentRow++;
    }

    // Add income total
    const totalRow = currentRow;
    worksheet.mergeCells(`A${totalRow}:C${totalRow}`);
    const labelCell = worksheet.getCell(`A${totalRow}`);
    labelCell.value = 'Total Income';
    labelCell.font = { bold: true, size: 12, color: { argb: 'FF1A3A5C' } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    labelCell.border = {
      top: { style: 'medium', color: { argb: 'FF0066B2' } },
      bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
    };
    
    const amountCell = worksheet.getCell(`D${totalRow}`);
    amountCell.value = `Ksh ${totalIncomeAmount.toLocaleString()}`;
    amountCell.font = { bold: true, size: 12, color: { argb: 'FF1A3A5C' } };
    amountCell.alignment = { horizontal: 'center', vertical: 'middle' };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    amountCell.border = {
      top: { style: 'medium', color: { argb: 'FF0066B2' } },
      bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
    };
    
    currentRow += 2;
  }

  // ========== COMMISSION RECORDS SECTION ==========
  if (selectedSectionIds.includes('commissionRecords')) {
    addSubsectionHeader(worksheet, currentRow, 'COMMISSION RECORDS');
    currentRow++;

    const commissionHeaders = [
      'Manager', 'Commission Fee', 'Income Amount', 'Commission Amount',
      'Period Start', 'Period End', 'Status', 'Paid Date'
    ];
    addTableHeaders(worksheet, currentRow, commissionHeaders);
    currentRow++;

    const commissions = collectionStatement?.rawData?.commissions || property.commissions || [];
    let totalCommissionAmount = 0;
    let pendingCommissions = 0;
    let paidCommissions = 0;

    if (commissions.length > 0) {
      commissions.forEach((commission: any, index: number) => {
        // Get manager name - try from property first, then from commission data
        let managerName = getManagerName(property);
        if (managerName === 'N/A' && commission.managerId) {
          // Try to get from property manager
          managerName = property.manager?.name || commission.managerId;
        }
        
        const rowData = [
          managerName,
          commission.commissionFee ? `${commission.commissionFee}%` : '0%',
          commission.incomeAmount || 0,
          commission.commissionAmount || 0,
          commission.periodStart ? new Date(commission.periodStart).toLocaleDateString('en-GB') : '-',
          commission.periodEnd ? new Date(commission.periodEnd).toLocaleDateString('en-GB') : '-',
          commission.status || 'PENDING',
          commission.paidDate ? new Date(commission.paidDate).toLocaleDateString('en-GB') : '-',
        ];
        
        addTableRow(worksheet, currentRow, rowData, index % 2 === 0);
        
        totalCommissionAmount += commission.commissionAmount || 0;
        if (commission.status === 'PENDING') pendingCommissions += commission.commissionAmount || 0;
        if (commission.status === 'PAID') paidCommissions += commission.commissionAmount || 0;
        currentRow++;
      });
    } else {
      const rowData = ['No commission records found', '', '', '', '', '', '', ''];
      addTableRow(worksheet, currentRow, rowData);
      currentRow++;
    }

    // Add commission summary
    const commissionSummary = [
      ['Total Commissions:', `Ksh ${totalCommissionAmount.toLocaleString()}`],
      ['Pending Commissions:', `Ksh ${pendingCommissions.toLocaleString()}`],
      ['Paid Commissions:', `Ksh ${paidCommissions.toLocaleString()}`]
    ];

    commissionSummary.forEach(([label, value]) => {
      worksheet.mergeCells(`A${currentRow}:B${currentRow}`);
      const labelCell = worksheet.getCell(`A${currentRow}`);
      labelCell.value = label;
      labelCell.font = { bold: true, size: 11, color: { argb: 'FF1A3A5C' } };
      labelCell.alignment = { horizontal: 'right', vertical: 'middle' };
      
      worksheet.mergeCells(`C${currentRow}:H${currentRow}`);
      const valueCell = worksheet.getCell(`C${currentRow}`);
      valueCell.value = value;
      valueCell.font = { bold: true, size: 11, color: { argb: 'FF004080' } };
      valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
      
      currentRow++;
    });
    currentRow += 2;
  }

  // ========== SERVICE PROVIDERS SECTION ==========
  if (selectedSectionIds.includes('serviceProviders')) {
    addSubsectionHeader(worksheet, currentRow, 'SERVICE PROVIDERS');
    currentRow++;

    const providerHeaders = [
      'Provider Name', 'Contact', 'Service', 'Contract Period',
      'Charge Amount', 'Frequency'
    ];
    addTableHeaders(worksheet, currentRow, providerHeaders);
    currentRow++;

    const providers = collectionStatement?.serviceProviders || property.serviceProviders || [];
    let totalProviderCharges = 0;

    if (providers.length > 0) {
      providers.forEach((provider: any, index: number) => {
        const rowData = [
          provider.name || 'N/A',
          provider.contact || '-',
          provider.serviceContract || '-',
          provider.contractPeriod || '-',
          provider.chargeAmount || 0,
          provider.chargeFrequency || 'MONTHLY',
        ];
        
        addTableRow(worksheet, currentRow, rowData, index % 2 === 0);
        
        totalProviderCharges += provider.chargeAmount || 0;
        currentRow++;
      });
    } else {
      const rowData = ['No service providers found', '', '', '', '', ''];
      addTableRow(worksheet, currentRow, rowData);
      currentRow++;
    }

    // Add provider total
    const totalRow = currentRow;
    worksheet.mergeCells(`A${totalRow}:D${totalRow}`);
    const labelCell = worksheet.getCell(`A${totalRow}`);
    labelCell.value = 'Total Charges';
    labelCell.font = { bold: true, size: 12, color: { argb: 'FF1A3A5C' } };
    labelCell.alignment = { horizontal: 'center', vertical: 'middle' };
    labelCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    labelCell.border = {
      top: { style: 'medium', color: { argb: 'FF0066B2' } },
      bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
    };
    
    const amountCell = worksheet.getCell(`E${totalRow}`);
    amountCell.value = `Ksh ${totalProviderCharges.toLocaleString()}`;
    amountCell.font = { bold: true, size: 12, color: { argb: 'FF1A3A5C' } };
    amountCell.alignment = { horizontal: 'center', vertical: 'middle' };
    amountCell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F0FE' },
    };
    amountCell.border = {
      top: { style: 'medium', color: { argb: 'FF0066B2' } },
      bottom: { style: 'medium', color: { argb: 'FF0066B2' } },
    };
    
    // Merge Frequency column for total row
    worksheet.mergeCells(`F${totalRow}:F${totalRow}`);
    
    currentRow += 2;
  }

  // ========== FOOTER ==========
  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const footerLine = worksheet.getCell(`A${currentRow}`);
  footerLine.value = '_______________________________________________________________';
  footerLine.alignment = { horizontal: 'center' };
  footerLine.font = { color: { argb: 'FF666666' } };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const footerCell = worksheet.getCell(`A${currentRow}`);
  footerCell.value = 'INTERPARK ENTERPRISES LIMITED';
  footerCell.font = { size: 14, bold: true, color: { argb: 'FF0066B2' } };
  footerCell.alignment = { horizontal: 'center', vertical: 'middle' };
  
  // Add contact info
  currentRow++;
  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const contactCell = worksheet.getCell(`A${currentRow}`);
  contactCell.value = 'Phone: +254 700 000 000 | Email: info@interpark.co.ke | Website: www.interpark.co.ke';
  contactCell.font = { size: 10, color: { argb: 'FF666666' } };
  contactCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  const columnWidths = {
    A: 12,  // Unit No / Provider Name
    B: 15,  // Unit Type / Contact
    C: 12,  // Status / Service
    D: 20,  // Tenant Name / Contract Period
    E: 18,  // Contact / Charge Amount
    F: 25,  // Email / Frequency
    G: 15,  // KRAPin
    H: 15,  // Payment Policy
    I: 15,  // Rent Amount
    J: 15,  // Deposit
    K: 15,  // Rent Collected
    L: 15,  // Service Charge
    M: 15,  // VAT Collected
    N: 15,  // Bills Amount
    O: 15,  // Outstanding
    P: 15,  // Empty
    Q: 15,  // Empty
    R: 15,  // Empty
  };

  Object.entries(columnWidths).forEach(([col, width]) => {
    worksheet.getColumn(col).width = width;
  });

  // Generate filename
  const filename = `${property.name.replace(/\s+/g, '_')}_Collection_Statement_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  
  return {
    buffer,
    filename,
  };
};