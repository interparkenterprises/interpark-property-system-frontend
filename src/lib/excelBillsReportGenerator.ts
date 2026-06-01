import ExcelJS from 'exceljs';

export interface BillsReportData {
  property: {
    id: string;
    name: string;
    address: string;
  };
  summary: {
    totalTenants: number;
    totalBillInvoices: number;
    water: {
      totalBilled: number;
      totalCollected: number;
      totalArrears: number;
      collectionRate: number;
      status: string;
    };
    electricity: {
      totalBilled: number;
      totalCollected: number;
      totalArrears: number;
      collectionRate: number;
      status: string;
    };
    overall: {
      totalBilled: number;
      totalCollected: number;
      totalArrears: number;
      collectionRate: number;
      delinquentBillsCount: number;
      paymentBreakdown: {
        paid: number;
        partial: number;
        unpaid: number;
        overdue: number;
      };
    };
  };
  monthlyTrends: Array<{
    month: string;
    water: { expected: number; collected: number; arrears: number };
    electricity: { expected: number; collected: number; arrears: number };
    total: { expected: number; collected: number; arrears: number };
  }>;
  tenantOutstanding: Array<{
    tenantId: string;
    tenantName: string;
    unitNo: string;
    unitType: string;
    water: { total: number; paid: number; outstanding: number; status: string };
    electricity: { total: number; paid: number; outstanding: number; status: string };
    totalOutstanding: number;
  }>;
  delinquentBills: Array<{
    id: string;
    invoiceNumber: string;
    tenantName: string;
    unitNo: string;
    billType: string;
    amount: number;
    amountPaid: number;
    balance: number;
    issueDate: string;
    dueDate: string;
    daysOverdue: number;
    status: string;
  }>;
  billInvoices: Array<{
    id: string;
    invoiceNumber: string;
    tenantName: string;
    unitNo: string;
    billType: string;
    billReferenceNumber: string;
    billReferenceDate: string;
    issueDate: string;
    dueDate: string;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    status: string;
    unitsConsumed: number;
    chargePerUnit: number;
    previousReading: number;
    currentReading: number;
    vatRate: number | null;
    vatAmount: number | null;
  }>;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ExportBillsReportOptions {
  periodFrom?: string;
  periodTo?: string;
  billType?: string;
  status?: string;
}

// Helper function to apply standard cell styling
const applyHeaderStyle = (cell: ExcelJS.Cell, color: string = 'FF1976D2') => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: color }
  };
  cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 12 };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    left: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    bottom: { style: 'thin', color: { argb: 'FFD4D4D4' } },
    right: { style: 'thin', color: { argb: 'FFD4D4D4' } }
  };
};

const applyTitleStyle = (cell: ExcelJS.Cell) => {
  cell.font = { bold: true, size: 16, color: { argb: 'FF1976D2' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
};

const applySubtitleStyle = (cell: ExcelJS.Cell) => {
  cell.font = { bold: true, size: 12 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE3F2FD' }
  };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
};

const applyNumberStyle = (cell: ExcelJS.Cell) => {
  cell.numFmt = '#,##0.00';
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
};

const applyPositiveStyle = (cell: ExcelJS.Cell) => {
  cell.font = { color: { argb: 'FF2E7D32' }, bold: true };
  cell.numFmt = '#,##0.00';
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
};

const applyNegativeStyle = (cell: ExcelJS.Cell) => {
  cell.font = { color: { argb: 'FFD32F2F' }, bold: true };
  cell.numFmt = '#,##0.00';
  cell.alignment = { horizontal: 'right', vertical: 'middle' };
};

/**
 * Generate Excel file for property bills payment report using ExcelJS
 */
export async function exportBillsReportToExcel(
  reportData: BillsReportData,
  options?: ExportBillsReportOptions
): Promise<{ buffer: Buffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Property Management System';
  workbook.created = new Date();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `Bills_Report_${reportData.property.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

  // 1. Cover Sheet
  const coverSheet = workbook.addWorksheet('Cover', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  
  coverSheet.mergeCells('A1:B1');
  const titleCell = coverSheet.getCell('A1');
  titleCell.value = 'PROPERTY BILLS PAYMENT REPORT';
  titleCell.font = { bold: true, size: 18, color: { argb: 'FF1976D2' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  coverSheet.getRow(1).height = 30;

  coverSheet.getRow(2).height = 20;
  
  // Property Info
  coverSheet.getCell('A4').value = 'Property Name:';
  coverSheet.getCell('A4').font = { bold: true };
  coverSheet.getCell('B4').value = reportData.property.name;
  
  coverSheet.getCell('A5').value = 'Property Address:';
  coverSheet.getCell('A5').font = { bold: true };
  coverSheet.getCell('B5').value = reportData.property.address;
  
  coverSheet.getRow(7).height = 20;
  
  coverSheet.getCell('A8').value = 'Report Generated:';
  coverSheet.getCell('A8').font = { bold: true };
  coverSheet.getCell('B8').value = new Date().toLocaleString();
  
  coverSheet.getCell('A9').value = 'Period:';
  coverSheet.getCell('A9').font = { bold: true };
  coverSheet.getCell('B9').value = options?.periodFrom && options?.periodTo 
    ? `${options.periodFrom} to ${options.periodTo}` 
    : 'All Time';
  
  coverSheet.getCell('A10').value = 'Bill Type:';
  coverSheet.getCell('A10').font = { bold: true };
  coverSheet.getCell('B10').value = options?.billType || 'All';
  
  coverSheet.getCell('A11').value = 'Status Filter:';
  coverSheet.getCell('A11').font = { bold: true };
  coverSheet.getCell('B11').value = options?.status || 'All';
  
  coverSheet.getRow(13).height = 30;
  
  coverSheet.getCell('A15').value = 'Report prepared by:';
  coverSheet.getCell('A15').font = { bold: true };
  coverSheet.getCell('A16').value = '_________________________';
  coverSheet.getCell('A17').value = 'Signature';
  coverSheet.getCell('A17').alignment = { horizontal: 'center' };
  
  coverSheet.getColumn('A').width = 30;
  coverSheet.getColumn('B').width = 50;

  // 2. Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  
  summarySheet.mergeCells('A1:B1');
  const summaryTitle = summarySheet.getCell('A1');
  summaryTitle.value = 'PROPERTY BILLS SUMMARY';
  applyTitleStyle(summaryTitle);
  summarySheet.getRow(1).height = 25;
  
  summarySheet.getRow(3).height = 20;
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Tenants', reportData.summary.totalTenants],
    ['Total Bill Invoices', reportData.summary.totalBillInvoices],
    ['', ''],
    ['WATER BILLS', ''],
    ['Total Billed (Ksh)', reportData.summary.water.totalBilled],
    ['Total Collected (Ksh)', reportData.summary.water.totalCollected],
    ['Total Arrears (Ksh)', reportData.summary.water.totalArrears],
    ['Collection Rate', `${reportData.summary.water.collectionRate}%`],
    ['Status', reportData.summary.water.status],
    ['', ''],
    ['ELECTRICITY BILLS', ''],
    ['Total Billed (Ksh)', reportData.summary.electricity.totalBilled],
    ['Total Collected (Ksh)', reportData.summary.electricity.totalCollected],
    ['Total Arrears (Ksh)', reportData.summary.electricity.totalArrears],
    ['Collection Rate', `${reportData.summary.electricity.collectionRate}%`],
    ['Status', reportData.summary.electricity.status],
    ['', ''],
    ['OVERALL SUMMARY', ''],
    ['Total Billed (Ksh)', reportData.summary.overall.totalBilled],
    ['Total Collected (Ksh)', reportData.summary.overall.totalCollected],
    ['Total Arrears (Ksh)', reportData.summary.overall.totalArrears],
    ['Overall Collection Rate', `${reportData.summary.overall.collectionRate}%`],
    ['Delinquent Bills (>30 days)', reportData.summary.overall.delinquentBillsCount],
    ['', ''],
    ['PAYMENT BREAKDOWN', ''],
    ['Paid', reportData.summary.overall.paymentBreakdown.paid],
    ['Partial', reportData.summary.overall.paymentBreakdown.partial],
    ['Unpaid', reportData.summary.overall.paymentBreakdown.unpaid],
    ['Overdue', reportData.summary.overall.paymentBreakdown.overdue],
  ];
  
  summaryData.forEach((row, idx) => {
    const rowNum = idx + 4;
    const colACell = summarySheet.getCell(`A${rowNum}`);
    const colBCell = summarySheet.getCell(`B${rowNum}`);
    
    colACell.value = row[0];
    colBCell.value = row[1];
    
    if (idx === 0) {
      applyHeaderStyle(colACell, 'FF1976D2');
      applyHeaderStyle(colBCell, 'FF1976D2');
    } else if (row[0] === 'WATER BILLS' || row[0] === 'ELECTRICITY BILLS' || row[0] === 'OVERALL SUMMARY' || row[0] === 'PAYMENT BREAKDOWN') {
      colACell.font = { bold: true, size: 12 };
      colACell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE3F2FD' }
      };
    } else if (typeof row[1] === 'number') {
      applyNumberStyle(colBCell);
      if (row[0] === 'Total Arrears (Ksh)' || row[0] === 'Unpaid' || row[0] === 'Overdue') {
        applyNegativeStyle(colBCell);
      } else if (row[0] === 'Total Collected (Ksh)') {
        applyPositiveStyle(colBCell);
      }
    }
  });
  
  summarySheet.getColumn('A').width = 35;
  summarySheet.getColumn('B').width = 25;

  // 3. Monthly Trends Sheet
  if (reportData.monthlyTrends.length > 0) {
    const trendsSheet = workbook.addWorksheet('Monthly Trends', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    trendsSheet.mergeCells('A1:J1');
    const trendsTitle = trendsSheet.getCell('A1');
    trendsTitle.value = 'MONTHLY TRENDS';
    applyTitleStyle(trendsTitle);
    trendsSheet.getRow(1).height = 25;
    
    const headers = ['Month', 'Water Expected', 'Water Collected', 'Water Arrears', 'Elec Expected', 'Elec Collected', 'Elec Arrears', 'Total Expected', 'Total Collected', 'Total Arrears'];
    const headerRow = trendsSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell, 'FF1976D2');
    });
    trendsSheet.getRow(3).height = 25;
    
    reportData.monthlyTrends.forEach((trend, idx) => {
      const rowNum = idx + 4;
      
      trendsSheet.getCell(`A${rowNum}`).value = trend.month;
      trendsSheet.getCell(`B${rowNum}`).value = trend.water.expected;
      trendsSheet.getCell(`C${rowNum}`).value = trend.water.collected;
      trendsSheet.getCell(`D${rowNum}`).value = trend.water.arrears;
      trendsSheet.getCell(`E${rowNum}`).value = trend.electricity.expected;
      trendsSheet.getCell(`F${rowNum}`).value = trend.electricity.collected;
      trendsSheet.getCell(`G${rowNum}`).value = trend.electricity.arrears;
      trendsSheet.getCell(`H${rowNum}`).value = trend.total.expected;
      trendsSheet.getCell(`I${rowNum}`).value = trend.total.collected;
      trendsSheet.getCell(`J${rowNum}`).value = trend.total.arrears;
      
      for (let col = 2; col <= 10; col++) {
        const cell = trendsSheet.getCell(`${String.fromCharCode(64 + col)}${rowNum}`);
        if (col === 4 || col === 7 || col === 10) {
          if (cell.value && parseFloat(cell.value.toString()) > 0) {
            applyNegativeStyle(cell);
          } else {
            applyNumberStyle(cell);
          }
        } else {
          applyNumberStyle(cell);
        }
      }
    });
    
    trendsSheet.getColumn('A').width = 12;
    for (let i = 2; i <= 10; i++) {
      trendsSheet.getColumn(i).width = 18;
    }
  }

  // 4. Tenant Outstanding Balances Sheet
  if (reportData.tenantOutstanding.length > 0) {
    const outstandingSheet = workbook.addWorksheet('Outstanding Bills', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    outstandingSheet.mergeCells('A1:L1');
    const outstandingTitle = outstandingSheet.getCell('A1');
    outstandingTitle.value = 'TENANT OUTSTANDING BILLS';
    applyTitleStyle(outstandingTitle);
    outstandingSheet.getRow(1).height = 25;
    
    const headers = ['Tenant Name', 'Unit Number', 'Unit Type', 'Water Total', 'Water Paid', 'Water Outstanding', 'Water Status', 'Elec Total', 'Elec Paid', 'Elec Outstanding', 'Elec Status', 'Total Outstanding'];
    const headerRow = outstandingSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell, 'FF1976D2');
    });
    outstandingSheet.getRow(3).height = 25;
    
    reportData.tenantOutstanding.forEach((tenant, idx) => {
      const rowNum = idx + 4;
      
      outstandingSheet.getCell(`A${rowNum}`).value = tenant.tenantName;
      outstandingSheet.getCell(`B${rowNum}`).value = tenant.unitNo;
      outstandingSheet.getCell(`C${rowNum}`).value = tenant.unitType;
      outstandingSheet.getCell(`D${rowNum}`).value = tenant.water.total;
      outstandingSheet.getCell(`E${rowNum}`).value = tenant.water.paid;
      outstandingSheet.getCell(`F${rowNum}`).value = tenant.water.outstanding;
      outstandingSheet.getCell(`G${rowNum}`).value = tenant.water.status;
      outstandingSheet.getCell(`H${rowNum}`).value = tenant.electricity.total;
      outstandingSheet.getCell(`I${rowNum}`).value = tenant.electricity.paid;
      outstandingSheet.getCell(`J${rowNum}`).value = tenant.electricity.outstanding;
      outstandingSheet.getCell(`K${rowNum}`).value = tenant.electricity.status;
      outstandingSheet.getCell(`L${rowNum}`).value = tenant.totalOutstanding;
      
      const numberCols = [4, 5, 6, 8, 9, 10, 12];
      numberCols.forEach(col => {
        const cell = outstandingSheet.getCell(`${String.fromCharCode(64 + col)}${rowNum}`);
        if (col === 6 || col === 10 || col === 12) {
          if (cell.value && parseFloat(cell.value.toString()) > 0) {
            applyNegativeStyle(cell);
          } else {
            applyNumberStyle(cell);
          }
        } else {
          applyNumberStyle(cell);
        }
      });
      
      // Status styling
      const waterStatusCell = outstandingSheet.getCell(`G${rowNum}`);
      if (tenant.water.status === 'PAID') {
        waterStatusCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
      } else if (tenant.water.outstanding > 0) {
        waterStatusCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      }
      
      const elecStatusCell = outstandingSheet.getCell(`K${rowNum}`);
      if (tenant.electricity.status === 'PAID') {
        elecStatusCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
      } else if (tenant.electricity.outstanding > 0) {
        elecStatusCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      }
    });
    
    const colWidths = [25, 12, 15, 18, 18, 18, 15, 18, 18, 18, 15, 18];
    colWidths.forEach((width, idx) => {
      outstandingSheet.getColumn(idx + 1).width = width;
    });
  }

  // 5. Delinquent Bills Sheet
  if (reportData.delinquentBills.length > 0) {
    const delinquentSheet = workbook.addWorksheet('Delinquent Bills', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    delinquentSheet.mergeCells('A1:K1');
    const delinquentTitle = delinquentSheet.getCell('A1');
    delinquentTitle.value = 'DELINQUENT BILLS (>30 DAYS OVERDUE)';
    applyTitleStyle(delinquentTitle);
    delinquentSheet.getRow(1).height = 25;
    
    const headers = ['Invoice Number', 'Tenant Name', 'Unit Number', 'Bill Type', 'Total Amount', 'Amount Paid', 'Balance', 'Issue Date', 'Due Date', 'Days Overdue', 'Status'];
    const headerRow = delinquentSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell, 'FFD32F2F');
    });
    delinquentSheet.getRow(3).height = 25;
    
    reportData.delinquentBills.forEach((bill, idx) => {
      const rowNum = idx + 4;
      
      delinquentSheet.getCell(`A${rowNum}`).value = bill.invoiceNumber;
      delinquentSheet.getCell(`B${rowNum}`).value = bill.tenantName;
      delinquentSheet.getCell(`C${rowNum}`).value = bill.unitNo;
      delinquentSheet.getCell(`D${rowNum}`).value = bill.billType;
      delinquentSheet.getCell(`E${rowNum}`).value = bill.amount;
      delinquentSheet.getCell(`F${rowNum}`).value = bill.amountPaid;
      delinquentSheet.getCell(`G${rowNum}`).value = bill.balance;
      delinquentSheet.getCell(`H${rowNum}`).value = new Date(bill.issueDate).toLocaleDateString();
      delinquentSheet.getCell(`I${rowNum}`).value = new Date(bill.dueDate).toLocaleDateString();
      delinquentSheet.getCell(`J${rowNum}`).value = bill.daysOverdue;
      delinquentSheet.getCell(`K${rowNum}`).value = bill.status;
      
      const numberCols = [5, 6, 7, 10];
      numberCols.forEach(col => {
        const cell = delinquentSheet.getCell(`${String.fromCharCode(64 + col)}${rowNum}`);
        if (col === 7) {
          applyNegativeStyle(cell);
        } else {
          applyNumberStyle(cell);
        }
      });
      
      // Days overdue styling
      const daysCell = delinquentSheet.getCell(`J${rowNum}`);
      if (bill.daysOverdue > 90) {
        daysCell.font = { color: { argb: 'FFB71C1C' }, bold: true };
      } else if (bill.daysOverdue > 60) {
        daysCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      } else if (bill.daysOverdue > 30) {
        daysCell.font = { color: { argb: 'FFF57C00' }, bold: true };
      }
    });
    
    const colWidths = [18, 25, 12, 12, 18, 18, 18, 12, 12, 14, 12];
    colWidths.forEach((width, idx) => {
      delinquentSheet.getColumn(idx + 1).width = width;
    });
  }

  // 6. Bill Invoices Detail Sheet
  if (reportData.billInvoices.length > 0) {
    const invoicesSheet = workbook.addWorksheet('Bill Invoices', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    invoicesSheet.mergeCells('A1:Q1');
    const invoicesTitle = invoicesSheet.getCell('A1');
    invoicesTitle.value = 'BILL INVOICES DETAILS';
    applyTitleStyle(invoicesTitle);
    invoicesSheet.getRow(1).height = 25;
    
    const headers = ['Invoice Number', 'Tenant Name', 'Unit Number', 'Bill Type', 'Bill Reference', 'Issue Date', 'Due Date', 'Units', 'Rate/Unit', 'Prev Reading', 'Current Reading', 'Total Amount', 'Amount Paid', 'Balance', 'VAT Rate', 'VAT Amount', 'Status'];
    const headerRow = invoicesSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell, 'FF1976D2');
    });
    invoicesSheet.getRow(3).height = 25;
    
    reportData.billInvoices.forEach((invoice, idx) => {
      const rowNum = idx + 4;
      
      invoicesSheet.getCell(`A${rowNum}`).value = invoice.invoiceNumber;
      invoicesSheet.getCell(`B${rowNum}`).value = invoice.tenantName;
      invoicesSheet.getCell(`C${rowNum}`).value = invoice.unitNo;
      invoicesSheet.getCell(`D${rowNum}`).value = invoice.billType;
      invoicesSheet.getCell(`E${rowNum}`).value = invoice.billReferenceNumber;
      invoicesSheet.getCell(`F${rowNum}`).value = new Date(invoice.issueDate).toLocaleDateString();
      invoicesSheet.getCell(`G${rowNum}`).value = new Date(invoice.dueDate).toLocaleDateString();
      invoicesSheet.getCell(`H${rowNum}`).value = invoice.unitsConsumed;
      invoicesSheet.getCell(`I${rowNum}`).value = invoice.chargePerUnit;
      invoicesSheet.getCell(`J${rowNum}`).value = invoice.previousReading;
      invoicesSheet.getCell(`K${rowNum}`).value = invoice.currentReading;
      invoicesSheet.getCell(`L${rowNum}`).value = invoice.totalAmount;
      invoicesSheet.getCell(`M${rowNum}`).value = invoice.amountPaid;
      invoicesSheet.getCell(`N${rowNum}`).value = invoice.balance;
      invoicesSheet.getCell(`O${rowNum}`).value = invoice.vatRate ? `${invoice.vatRate}%` : '-';
      invoicesSheet.getCell(`P${rowNum}`).value = invoice.vatAmount || '-';
      invoicesSheet.getCell(`Q${rowNum}`).value = invoice.status;
      
      const numberCols = [8, 9, 10, 11, 12, 13, 14];
      numberCols.forEach(col => {
        const cell = invoicesSheet.getCell(`${String.fromCharCode(64 + col)}${rowNum}`);
        if (col === 14) {
          if (cell.value && parseFloat(cell.value.toString()) > 0) {
            applyNegativeStyle(cell);
          } else {
            applyNumberStyle(cell);
          }
        } else {
          applyNumberStyle(cell);
        }
      });
      
      // Status styling
      const statusCell = invoicesSheet.getCell(`Q${rowNum}`);
      if (invoice.status === 'PAID') {
        statusCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
      } else if (invoice.status === 'PARTIAL') {
        statusCell.font = { color: { argb: 'FFF57C00' }, bold: true };
      } else if (invoice.status === 'OVERDUE') {
        statusCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      }
    });
    
    const colWidths = [18, 25, 12, 12, 15, 12, 12, 10, 12, 15, 15, 18, 18, 18, 12, 15, 12];
    colWidths.forEach((width, idx) => {
      invoicesSheet.getColumn(idx + 1).width = width;
    });
  }

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return { buffer: Buffer.from(buffer), filename };
}