import ExcelJS from 'exceljs';
import { Property } from '@/types';

export interface ExportSection {
  id: string;
  label: string;
  selected: boolean;
}

// Helper functions for Excel generation
const addSectionTitle = (worksheet: ExcelJS.Worksheet, row: number, title: string) => {
  worksheet.mergeCells(`A${row}:R${row}`);
  const cell = worksheet.getCell(`A${row}`);
  cell.value = title.toUpperCase();
  cell.font = { size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0066B2' },
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(row).height = 30;
};

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
    cell.value = value;
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
  
  // Ground Rent total
  worksheet.getCell(`J${totalRow}`).value = totals.groundRent || 0;
  worksheet.getCell(`J${totalRow}`).font = { bold: true, size: 11 };
  
  // Water Bill total
  worksheet.getCell(`K${totalRow}`).value = totals.waterBill || 0;
  worksheet.getCell(`K${totalRow}`).font = { bold: true, size: 11 };
  
  // VAT total
  worksheet.getCell(`L${totalRow}`).value = totals.vat || 0;
  worksheet.getCell(`L${totalRow}`).font = { bold: true, size: 11 };
  
  // Service Charge total
  worksheet.getCell(`M${totalRow}`).value = totals.serviceCharge || 0;
  worksheet.getCell(`M${totalRow}`).font = { bold: true, size: 11 };
  
  // Rent total formula
  worksheet.getCell(`N${totalRow}`).value = {
    formula: `SUM(N${startRow}:N${endRow})`,
    result: totals.rent || 0
  };
  worksheet.getCell(`N${totalRow}`).font = { bold: true, size: 11 };
  
  // Amount Payable formula
  worksheet.getCell(`O${totalRow}`).value = {
    formula: `SUM(O${startRow}:O${endRow})`,
    result: totals.amountPayable || 0
  };
  worksheet.getCell(`O${totalRow}`).font = { bold: true, size: 11 };
  
  // Amount Paid formula
  worksheet.getCell(`P${totalRow}`).value = {
    formula: `SUM(P${startRow}:P${endRow})`,
    result: totals.amountPaid || 0
  };
  worksheet.getCell(`P${totalRow}`).font = { bold: true, size: 11 };
  
  // Balance formula
  worksheet.getCell(`R${totalRow}`).value = {
    formula: `SUM(R${startRow}:R${endRow})`,
    result: totals.balance || 0
  };
  worksheet.getCell(`R${totalRow}`).font = { bold: true, size: 11 };
  
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

      // Calculate VAT (16% of rent + service charge)
      const vat = (unit.rentAmount + serviceChargeValue) * 0.16;
      
      // Find tenant's income/payments
      const tenantIncomes = property.incomes?.filter(income => income.tenantId === tenant?.id) || [];
      const totalPaid = tenantIncomes.reduce((sum, income) => sum + income.amount, 0);
      const amountPayable = unit.rentAmount + serviceChargeValue + vat;
      const balance = amountPayable - totalPaid;

      unitsByFloor[floor].push({
        unit,
        tenant,
        serviceChargeValue,
        serviceChargeType,
        vat,
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
    'VAT 16 %',
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
      const { unit, tenant, serviceChargeValue, serviceChargeType, vat, amountPayable, totalPaid, balance } = unitData;
      const tenantIncomes = property.incomes?.filter(income => income.tenantId === tenant?.id) || [];
      
      // Calculate rates description
      const ratePerSqFt = unit.rentAmount / unit.sizeSqFt;
      const ratesDesc = `${Math.round(ratePerSqFt)} PER SQ/FT`;

      const rowData = [
        unit.type?.substring(0, 3) || `U${unitIndex + 1}`, // ENTRANCE
        tenant?.fullName || 'VACANT', // TENANT NAME
        tenant?.contact || '-', // TELEPHONE NUMBER
        `${unit.sizeSqFt}Sq/ft`, // SQUARE FEET
        floorName, // LOCATION
        ratesDesc, // RATES
        tenant?.fullName ? (unit.type || 'RETAIL') : 'VACANT', // NATURE OF THE BUSINESS
        '', // DEPOSIT (not in current data model)
        '', // ELECTRICITY/BCF (not in current data model)
        `Ksh ${unit.rentAmount.toLocaleString()}`, // GROUND RENT PER MONTH
        '', // WATER BILL (not in current data model)
        `Ksh ${vat.toFixed(2)}`, // VAT 16 %
        serviceChargeValue > 0 ? `Ksh ${serviceChargeValue.toLocaleString()}` : '-', // SERVICE CHARGE
        {
          formula: `SUM(J${currentRow}:M${currentRow})`,
          result: unit.rentAmount + serviceChargeValue + vat
        }, // Rent (formula)
        {
          formula: `SUM(J${currentRow}:M${currentRow})`,
          result: amountPayable
        }, // AMOUNT PAYABLE (formula)
        totalPaid > 0 ? `Ksh ${totalPaid.toLocaleString()}` : '', // AMT PID
        tenantIncomes?.length > 0 ? new Date(tenantIncomes[0].createdAt).toLocaleDateString('en-GB') : '', // DATE
        {
          formula: `O${currentRow}-P${currentRow}`,
          result: balance
        } // BALANCE (formula)
      ];

      addTableRow(worksheet, currentRow, rowData, unitIndex % 2 === 0);
      
      // Update floor totals
      floorTotal.groundRent += unit.rentAmount;
      floorTotal.vat += vat;
      floorTotal.serviceCharge += serviceChargeValue;
      floorTotal.rent += unit.rentAmount + serviceChargeValue + vat;
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
    `Ksh ${grandTotals.deposit.toLocaleString()}`,
    '',
    `Ksh ${grandTotals.groundRent.toLocaleString()}`,
    `Ksh ${grandTotals.waterBill.toLocaleString()}`,
    `Ksh ${grandTotals.vat.toLocaleString()}`,
    `Ksh ${grandTotals.serviceCharge.toLocaleString()}`,
    `Ksh ${grandTotals.rent.toLocaleString()}`,
    `Ksh ${grandTotals.amountPayable.toLocaleString()}`,
    `Ksh ${grandTotals.amountPaid.toLocaleString()}`,
    '',
    `Ksh ${grandTotals.balance.toLocaleString()}`
  ];

  addTableRow(worksheet, currentRow, summaryData);
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

  // Set column widths (similar to November Collection format)
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
    { width: 12 },  // L: VAT
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