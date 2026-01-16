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
  cell.font = { size: 14, bold: true, color: { argb: 'FF000000' } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE6F2FF' },
  };
  cell.border = {
    top: { style: 'thin' },
    bottom: { style: 'thin' },
  };
  worksheet.getRow(row).height = 25;
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
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };
  });
  headerRow.height = 30;
};

const addTableRow = (
  worksheet: ExcelJS.Worksheet,
  row: number,
  data: any[],
  isEvenRow: boolean = false
) => {
  const rowData = worksheet.getRow(row);
  data.forEach((value, index) => {
    const cell = rowData.getCell(index + 1);
    
    // Handle formula objects specially
    if (value && typeof value === 'object' && ('formula' in value || 'result' in value)) {
      if (value.formula) {
        cell.value = { formula: value.formula };
      } else if (value.result !== undefined) {
        cell.value = value.result;
      }
    } else {
      cell.value = value;
    }
    
    cell.font = { size: 10 };
    cell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      left: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      bottom: { style: 'thin', color: { argb: 'FFD3D3D3' } },
      right: { style: 'thin', color: { argb: 'FFD3D3D3' } },
    };
  });

  if (isEvenRow) {
    rowData.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9F9F9' },
      };
    });
  }
};

const addTotalRow = (
  worksheet: ExcelJS.Worksheet,
  startRow: number,
  endRow: number,
  totals: any
) => {
  const totalRow = endRow + 1;
  
  // Label
  worksheet.getCell(`A${totalRow}`).value = 'Total';
  worksheet.getCell(`A${totalRow}`).font = { bold: true, size: 11 };
  
  // Deposit total
  worksheet.getCell(`H${totalRow}`).value = totals.deposit || 0;
  worksheet.getCell(`H${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`H${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Ground Rent total
  worksheet.getCell(`J${totalRow}`).value = totals.groundRent || 0;
  worksheet.getCell(`J${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`J${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Water Bill total
  worksheet.getCell(`K${totalRow}`).value = totals.waterBill || 0;
  worksheet.getCell(`K${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`K${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // VAT total
  worksheet.getCell(`L${totalRow}`).value = totals.vat || 0;
  worksheet.getCell(`L${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`L${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Service Charge total
  worksheet.getCell(`M${totalRow}`).value = totals.serviceCharge || 0;
  worksheet.getCell(`M${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`M${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Rent total formula
  worksheet.getCell(`N${totalRow}`).value = {
    formula: `SUM(N${startRow}:N${endRow})`,
    result: totals.rent || 0
  };
  worksheet.getCell(`N${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`N${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Amount Payable formula
  worksheet.getCell(`O${totalRow}`).value = {
    formula: `SUM(O${startRow}:O${endRow})`,
    result: totals.amountPayable || 0
  };
  worksheet.getCell(`O${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`O${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Amount Paid formula
  worksheet.getCell(`P${totalRow}`).value = {
    formula: `SUM(P${startRow}:P${endRow})`,
    result: totals.amountPaid || 0
  };
  worksheet.getCell(`P${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`P${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Balance formula
  worksheet.getCell(`R${totalRow}`).value = {
    formula: `SUM(R${startRow}:R${endRow})`,
    result: totals.balance || 0
  };
  worksheet.getCell(`R${totalRow}`).font = { bold: true, size: 11 };
  worksheet.getCell(`R${totalRow}`).numFmt = '"Ksh "#,##0.00';
  
  // Format total row
  for (let col = 1; col <= 18; col++) {
    const cell = worksheet.getRow(totalRow).getCell(col);
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' },
    };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
    };
  }
};

// Helper function to calculate VAT based on VAT type
const calculateVAT = (
  rentAmount: number,
  serviceChargeValue: number,
  vatType: VATType = 'NOT_APPLICABLE',
  vatRate: number = 16 // Default VAT rate of 16% (not 0.16)
): { vatAmount: number; taxableAmount: number } => {
  
  // Convert percentage to decimal for calculation
  const vatRateDecimal = vatRate / 100;
  
  switch (vatType) {
    case 'INCLUSIVE':
      // VAT is already included in the rent amount
      const totalInclusive = rentAmount + serviceChargeValue;
      const vatAmount = totalInclusive - (totalInclusive / (1 + vatRateDecimal));
      return { vatAmount, taxableAmount: totalInclusive - vatAmount };
      
    case 'EXCLUSIVE':
      // VAT needs to be added on top of the rent amount
      const taxableAmount = rentAmount + serviceChargeValue;
      const vatExclusive = taxableAmount * vatRateDecimal;
      return { vatAmount: vatExclusive, taxableAmount };
      
    case 'NOT_APPLICABLE':
    default:
      // No VAT applicable
      return { vatAmount: 0, taxableAmount: rentAmount + serviceChargeValue };
  }
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
  }
) => {
  // Create a new workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Interpark Enterprises Limited';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Collection Statement', {
    pageSetup: {
      paperSize: 9, // A4
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

  // Property Name Header
  worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
  const propertyCell = worksheet.getCell(`C${currentRow}`);
  propertyCell.value = property.name.toUpperCase();
  propertyCell.font = { size: 18, bold: true, color: { argb: 'FF000000' } };
  propertyCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  // Report Title
  worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
  const titleCell = worksheet.getCell(`C${currentRow}`);
  titleCell.value = 'COLLECTION STATEMENT';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF000000' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow++;

  // Date
  worksheet.mergeCells(`C${currentRow}:R${currentRow}`);
  const dateCell = worksheet.getCell(`C${currentRow}`);
  dateCell.value = `As at ${new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })}`;
  dateCell.font = { size: 14, italic: true };
  dateCell.alignment = { horizontal: 'center', vertical: 'middle' };
  currentRow += 2;

  // Prepare units data organized by floor/wing
  const unitsByFloor: Record<string, any[]> = {};
  
  if (property.units && property.units.length > 0) {
    property.units.forEach(unit => {
      // Determine floor/wing based on unit type or location
      let floor = 'OTHER';
      if (unit.type?.toLowerCase().includes('ground')) floor = 'GROUND FLOOR';
      else if (unit.type?.toLowerCase().includes('first')) floor = 'FIRST FLOOR';
      else if (unit.type?.toLowerCase().includes('second')) floor = 'SECOND FLOOR';
      else if (unit.type?.toLowerCase().includes('third')) floor = 'THIRD FLOOR';
      else if (unit.type?.toLowerCase().includes('commercial')) floor = 'COMMERCIAL WING';
      else if (unit.type?.toLowerCase().includes('residential')) floor = 'RESIDENTIAL WING';
      
      if (!unitsByFloor[floor]) {
        unitsByFloor[floor] = [];
      }
      
      const tenant = unit.tenant;
      const serviceCharge = tenant?.serviceCharge;
      let serviceChargeValue = 0;
      let serviceChargeType = '-';

      if (serviceCharge) {
        if (serviceCharge.type === 'PERCENTAGE') {
          serviceChargeValue = (unit.rentAmount * (serviceCharge.percentage || 0)) / 100;
          serviceChargeType = `${serviceCharge.percentage}%`;
        } else if (serviceCharge.type === 'FIXED') {
          serviceChargeValue = serviceCharge.fixedAmount || 0;
          serviceChargeType = `Fixed Ksh ${serviceChargeValue.toLocaleString()}`;
        } else if (serviceCharge.type === 'PER_SQ_FT') {
          serviceChargeValue = (unit.sizeSqFt * (serviceCharge.perSqFtRate || 0));
          serviceChargeType = `Ksh ${serviceCharge.perSqFtRate}/sq ft`;
        }
      }

      // Calculate VAT based on tenant's VAT type
      const vatType = tenant?.vatType || 'NOT_APPLICABLE';
      const vatRate = tenant?.vatRate || 16; // Default to 16% if not specified
      const { vatAmount, taxableAmount } = calculateVAT(
        unit.rentAmount,
        serviceChargeValue,
        vatType,
        vatRate
      );
      
      // Find tenant's income/payments
      const tenantIncomes = property.incomes?.filter(income => income.tenantId === tenant?.id) || [];
      const totalPaid = tenantIncomes.reduce((sum, income) => sum + income.amount, 0);
      
      // Calculate amount payable based on VAT type
      let amountPayable = 0;
      if (vatType === 'INCLUSIVE') {
        // VAT is already included in rent, so amount payable is just rent + service charge
        amountPayable = unit.rentAmount + serviceChargeValue;
      } else {
        // For EXCLUSIVE and NOT_APPLICABLE, amount payable is taxable amount + VAT
        amountPayable = taxableAmount + vatAmount;
      }
      
      const balance = amountPayable - totalPaid;

      unitsByFloor[floor].push({
        unit,
        tenant,
        serviceChargeValue,
        serviceChargeType,
        vatAmount,
        vatType,
        taxableAmount,
        amountPayable,
        totalPaid,
        balance
      });
    });
  }

  // Process each floor/wing
  const floorHeaders = [
    'ENTRANCE',
    'TENANT NAME',
    'TELEPHONE NUMBER',
    'SQUARE FEET',
    'LOCATION',
    'RATES',
    'NATURE OF THE BUSINESS',
    'DEPOSIT',
    'ELECTRICITY/BCF',
    'GROUND RENT PER MONTH',
    'WATER BILL',
    'VAT',
    'SERVICE CHARGE',
    `${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })} Rent`,
    'AMOUNT PAYABLE',
    'AMT PID',
    'DATE',
    'BALANCE'
  ];

  const grandTotals = {
    deposit: 0,
    groundRent: 0,
    waterBill: 0,
    vat: 0,
    serviceCharge: 0,
    rent: 0,
    amountPayable: 0,
    amountPaid: 0,
    balance: 0
  };

  const floorTotals: Record<string, typeof grandTotals> = {};

  // Add each floor section
  Object.entries(unitsByFloor).forEach(([floorName, units], floorIndex) => {
    if (units.length === 0) return;

    // Floor header
    addSubsectionHeader(worksheet, currentRow, floorName);
    currentRow++;

    // Table headers
    addTableHeaders(worksheet, currentRow, floorHeaders);
    currentRow++;

    const startRow = currentRow;
    let floorTotal = {
      deposit: 0,
      groundRent: 0,
      waterBill: 0,
      vat: 0,
      serviceCharge: 0,
      rent: 0,
      amountPayable: 0,
      amountPaid: 0,
      balance: 0
    };

    // Add unit rows
    units.forEach((unitData, unitIndex) => {
      const { 
        unit, 
        tenant, 
        serviceChargeValue, 
        serviceChargeType, 
        vatAmount, 
        vatType,
        taxableAmount,
        amountPayable, 
        totalPaid, 
        balance 
      } = unitData;
      
      const tenantIncomes = property.incomes?.filter(income => income.tenantId === tenant?.id) || [];
      
      // Calculate rates description
      const ratePerSqFt = unit.rentAmount / unit.sizeSqFt;
      const ratesDesc = `${Math.round(ratePerSqFt)} PER SQ/FT`;

      // Format VAT display based on VAT type (for text display in VAT column)
      let vatDisplay = '';
      if (vatType === 'NOT_APPLICABLE') {
        vatDisplay = 'N/A';
      } else {
        vatDisplay = `Ksh ${vatAmount.toFixed(2)} (${vatType})`;
      }

      // Calculate the rent amount to display (depends on VAT type)
      let rentDisplayAmount = 0;
      if (vatType === 'INCLUSIVE') {
        // For INCLUSIVE VAT, the displayed rent should be the amount without VAT
        rentDisplayAmount = taxableAmount;
      } else {
        // For EXCLUSIVE and NOT_APPLICABLE, the displayed rent is just rent amount
        rentDisplayAmount = unit.rentAmount;
      }

      const rowData = [
        unit.type?.substring(0, 3) || `U${unitIndex + 1}`, // A: ENTRANCE
        tenant?.fullName || 'VACANT', // B: TENANT NAME
        tenant?.contact || '-', // C: TELEPHONE NUMBER
        `${unit.sizeSqFt}Sq/ft`, // D: SQUARE FEET
        floorName, // E: LOCATION
        ratesDesc, // F: RATES
        tenant?.fullName ? (unit.type || 'RETAIL') : 'VACANT', // G: NATURE OF BUSINESS
        '', // H: DEPOSIT
        '', // I: ELECTRICITY/BCF
        rentDisplayAmount, // J: GROUND RENT (numeric value for formulas)
        '', // K: WATER BILL (empty for now)
        vatAmount, // L: VAT (numeric value for formulas)
        serviceChargeValue, // M: SERVICE CHARGE (numeric value for formulas)
        {
          formula: `SUM(J${currentRow}:M${currentRow})`,
          result: rentDisplayAmount + serviceChargeValue + vatAmount
        }, // N: Rent (formula - includes VAT for all types)
        {
          formula: `SUM(J${currentRow}:M${currentRow})`,
          result: amountPayable
        }, // O: AMOUNT PAYABLE (formula)
        totalPaid > 0 ? totalPaid : '', // P: AMT PID (numeric!)
        tenantIncomes?.length > 0 ? new Date(tenantIncomes[0].createdAt).toLocaleDateString('en-GB') : '', // Q: DATE
        {
          formula: `O${currentRow}-P${currentRow}`,
          result: balance
        } // R: BALANCE (formula)
      ];

      addTableRow(worksheet, currentRow, rowData, unitIndex % 2 === 0);
      
      // Apply number formatting AFTER adding the row
      const row = worksheet.getRow(currentRow);
      
      // Format Ground Rent (Column J) as currency
      if (rentDisplayAmount > 0) {
        const cell = row.getCell(10); // Column J is index 10
        cell.numFmt = '"Ksh "#,##0.00';
      }
      
      // Format VAT (Column L) as currency - but we need to display text
      // Override the numeric value with formatted text display
      const vatCell = row.getCell(12); // Column L is index 12
      vatCell.value = vatDisplay; // Set the text display value
      
      // Format Service Charge (Column M) as currency
      if (serviceChargeValue > 0) {
        const cell = row.getCell(13); // Column M is index 13
        cell.numFmt = '"Ksh "#,##0.00';
      }
      
      // Format Amount Paid (Column P) as currency
      if (totalPaid > 0) {
        const cell = row.getCell(16); // Column P is index 16
        cell.numFmt = '"Ksh "#,##0.00';
      }
      
      // Format Rent, Amount Payable, and Balance columns
      row.getCell(14).numFmt = '"Ksh "#,##0.00'; // Column N: Rent
      row.getCell(15).numFmt = '"Ksh "#,##0.00'; // Column O: Amount Payable
      row.getCell(18).numFmt = '"Ksh "#,##0.00'; // Column R: Balance
      
      // Update floor totals
      floorTotal.groundRent += rentDisplayAmount;
      floorTotal.vat += vatAmount;
      floorTotal.serviceCharge += serviceChargeValue;
      
      // Calculate total rent - always include VAT amount
      floorTotal.rent += rentDisplayAmount + serviceChargeValue + vatAmount;
      floorTotal.amountPayable += amountPayable;
      floorTotal.amountPaid += totalPaid;
      floorTotal.balance += balance;
      
      currentRow++;
    });

    // Add floor total
    addTotalRow(worksheet, startRow, currentRow - 1, floorTotal);
    currentRow += 2;
    
    // Store floor totals for grand total
    floorTotals[floorName] = floorTotal;
    
    // Update grand totals
    Object.keys(grandTotals).forEach(key => {
      grandTotals[key as keyof typeof grandTotals] += floorTotal[key as keyof typeof floorTotal];
    });
  });

  // Add Grand Total section
  addSubsectionHeader(worksheet, currentRow, 'GRAND TOTAL SUMMARY');
  currentRow++;

  const summaryHeaders = [
    'SUMMARY',
    '',
    '',
    '',
    '',
    '',
    '',
    'Deposit',
    '',
    'Ground Rent',
    'Water Bill',
    'VAT',
    'Service Charge',
    'Total Rent',
    'Total Payable',
    'Total Paid',
    '',
    'Total Balance'
  ];

  addTableHeaders(worksheet, currentRow, summaryHeaders);
  currentRow++;

  const summaryData = [
    'All Floors',
    '',
    '',
    '',
    '',
    '',
    '',
    grandTotals.deposit, // H: Deposit (numeric)
    '',
    grandTotals.groundRent, // J: Ground Rent (numeric)
    grandTotals.waterBill, // K: Water Bill (numeric)
    grandTotals.vat, // L: VAT (numeric)
    grandTotals.serviceCharge, // M: Service Charge (numeric)
    grandTotals.rent, // N: Total Rent (numeric)
    grandTotals.amountPayable, // O: Total Payable (numeric)
    grandTotals.amountPaid, // P: Total Paid (numeric)
    '',
    grandTotals.balance // R: Total Balance (numeric)
  ];

  addTableRow(worksheet, currentRow, summaryData);
  
  // Apply number formatting to summary row
  const summaryRow = worksheet.getRow(currentRow);
  [8, 10, 11, 12, 13, 14, 15, 18].forEach(colIndex => {
    const cell = summaryRow.getCell(colIndex);
    cell.numFmt = '"Ksh "#,##0.00';
  });
  
  currentRow++;

  // Add financial summary section (similar to previous format)
  currentRow += 2;
  addSubsectionHeader(worksheet, currentRow, 'FINANCIAL OVERVIEW');
  currentRow++;

  const financialData = [
    ['Total Expected Collection:', `Ksh ${grandTotals.amountPayable.toLocaleString()}`],
    ['Total Collected:', `Ksh ${grandTotals.amountPaid.toLocaleString()}`],
    ['Total Outstanding:', `Ksh ${grandTotals.balance.toLocaleString()}`],
    ['', ''],
    ['Commission Information:', ''],
    ['Total Commissions:', `Ksh ${totals.totalCommissions.toLocaleString()}`],
    ['Pending Commissions:', `Ksh ${totals.pendingCommissions.toLocaleString()}`],
    ['Paid Commissions:', `Ksh ${totals.paidCommissions.toLocaleString()}`]
  ];

  financialData.forEach(([label, value]) => {
    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`A${currentRow}`).font = { bold: true, size: 11 };
    
    if (value) {
      worksheet.mergeCells(`B${currentRow}:R${currentRow}`);
      worksheet.getCell(`B${currentRow}`).value = value;
      worksheet.getCell(`B${currentRow}`).font = { bold: true, size: 11, color: { argb: value.includes('Outstanding') ? 'FFFF0000' : 'FF000000' } };
    }
    
    currentRow++;
  });

  // Add footer notes if needed
  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'NOTES:';
  worksheet.getCell(`A${currentRow}`).font = { italic: true, size: 10 };
  currentRow++;

  // Add VAT note
  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  worksheet.getCell(`A${currentRow}`).value = 'VAT Types: INCLUSIVE (VAT included in rent), EXCLUSIVE (VAT added on top), NOT_APPLICABLE (No VAT)';
  worksheet.getCell(`A${currentRow}`).font = { italic: true, size: 9 };
  currentRow++;

  // Add company footer
  currentRow += 2;
  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const footerLine = worksheet.getCell(`A${currentRow}`);
  footerLine.value = '_______________________________________________________________';
  footerLine.alignment = { horizontal: 'center' };
  currentRow++;

  worksheet.mergeCells(`A${currentRow}:R${currentRow}`);
  const footerCell = worksheet.getCell(`A${currentRow}`);
  footerCell.value = 'INTERPARK ENTERPRISES LIMITED';
  footerCell.font = { size: 12, bold: true, color: { argb: 'FF0066B2' } };
  footerCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Set column widths
  worksheet.columns = [
    { width: 10 },  // A: ENTRANCE
    { width: 25 },  // B: TENANT NAME
    { width: 15 },  // C: TELEPHONE NUMBER
    { width: 12 },  // D: SQUARE FEET
    { width: 25 },  // E: LOCATION
    { width: 15 },  // F: RATES
    { width: 20 },  // G: NATURE OF BUSINESS
    { width: 12 },  // H: DEPOSIT
    { width: 12 },  // I: ELECTRICITY/BCF
    { width: 18 },  // J: GROUND RENT
    { width: 12 },  // K: WATER BILL
    { width: 20 },  // L: VAT (increased width to show VAT type)
    { width: 15 },  // M: SERVICE CHARGE
    { width: 15 },  // N: MONTH Rent
    { width: 15 },  // O: AMOUNT PAYABLE
    { width: 12 },  // P: AMT PID
    { width: 12 },  // Q: DATE
    { width: 15 }   // R: BALANCE
  ];

  // Auto-fit rows
  for (let i = 1; i <= currentRow; i++) {
    const row = worksheet.getRow(i);
    row.commit();
  }

  // Generate filename
  const filename = `${property.name.replace(/\s+/g, '_')}_Collection_Statement_${
    new Date().toISOString().split('T')[0]
  }.xlsx`;

  // Write the file
  const buffer = await workbook.xlsx.writeBuffer();
  
  return {
    buffer,
    filename,
  };
};