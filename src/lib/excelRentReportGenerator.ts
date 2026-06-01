import ExcelJS from 'exceljs';

export interface RentReportData {
  property: {
    id: string;
    name: string;
    address: string;
  };
  summary: {
    totalTenants: number;
    totalRentCollected: number;
    totalRentExpected: number;
    totalArrears: number;
    collectionRate: number;
    collectionRateStatus: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'POOR';
    paymentBreakdown: {
      fullyPaid: number;
      partiallyPaid: number;
      unpaid: number;
      overdue: number;
    };
  };
  monthlyTrends: Array<{
    month: string;
    expected: number;
    collected: number;
    arrears: number;
    reportCount: number;
  }>;
  tenantOutstanding: Array<{
    tenantId: string;
    tenantName: string;
    unitNo: string;
    unitType: string;
    expectedTotal: number;
    paidTotal: number;
    outstandingBalance: number;
    arrears: number;
    lastPaymentDate: string | null;
    paymentStatus: string;
  }>;
  paymentReports: Array<{
    id: string;
    tenantName: string;
    unitNo: string;
    paymentPeriod: string;
    expectedAmount: number;
    amountPaid: number;
    arrears: number;
    status: string;
    invoiceCount: number;
    datePaid: string;
  }>;
  dateRange?: {
    from: string;
    to: string;
  };
}

export interface ExportRentReportOptions {
  periodFrom?: string;
  periodTo?: string;
  status?: string;
}

// Helper function to apply standard cell styling
const applyHeaderStyle = (cell: ExcelJS.Cell) => {
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E7D32' } // Green
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
  cell.font = { bold: true, size: 16, color: { argb: 'FF2E7D32' } };
  cell.alignment = { horizontal: 'center', vertical: 'middle' };
};

const applySubtitleStyle = (cell: ExcelJS.Cell) => {
  cell.font = { bold: true, size: 12 };
  cell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE8F5E9' }
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
 * Generate Excel file for property rent payment report using ExcelJS
 */
export async function exportRentReportToExcel(
  reportData: RentReportData,
  options?: ExportRentReportOptions
): Promise<{ buffer: ArrayBuffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Property Management System';
  workbook.created = new Date();
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `Rent_Report_${reportData.property.name.replace(/\s+/g, '_')}_${timestamp}.xlsx`;

  // 1. Cover Sheet
  const coverSheet = workbook.addWorksheet('Cover', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  
  coverSheet.mergeCells('A1:B1');
  const titleCell = coverSheet.getCell('A1');
  titleCell.value = 'PROPERTY RENT PAYMENT REPORT';
  titleCell.font = { bold: true, size: 18, color: { argb: 'FF2E7D32' } };
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
  
  coverSheet.getCell('A10').value = 'Status Filter:';
  coverSheet.getCell('A10').font = { bold: true };
  coverSheet.getCell('B10').value = options?.status || 'All';
  
  coverSheet.getRow(12).height = 30;
  
  coverSheet.getCell('A14').value = 'Report prepared by:';
  coverSheet.getCell('A14').font = { bold: true };
  coverSheet.getCell('A15').value = '_________________________';
  coverSheet.getCell('A16').value = 'Signature';
  coverSheet.getCell('A16').alignment = { horizontal: 'center' };
  
  coverSheet.getColumn('A').width = 30;
  coverSheet.getColumn('B').width = 50;

  // 2. Summary Sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait' }
  });
  
  summarySheet.mergeCells('A1:B1');
  const summaryTitle = summarySheet.getCell('A1');
  summaryTitle.value = 'PROPERTY RENT SUMMARY';
  applyTitleStyle(summaryTitle);
  summarySheet.getRow(1).height = 25;
  
  summarySheet.getRow(3).height = 20;
  
  const summaryData = [
    ['Metric', 'Value'],
    ['Total Tenants', reportData.summary.totalTenants],
    ['Total Rent Expected (Ksh)', reportData.summary.totalRentExpected],
    ['Total Rent Collected (Ksh)', reportData.summary.totalRentCollected],
    ['Total Arrears (Ksh)', reportData.summary.totalArrears],
    ['Collection Rate', `${reportData.summary.collectionRate}%`],
    ['Collection Rate Status', reportData.summary.collectionRateStatus],
    ['', ''],
    ['PAYMENT BREAKDOWN', ''],
    ['Fully Paid Tenants', reportData.summary.paymentBreakdown.fullyPaid],
    ['Partially Paid Tenants', reportData.summary.paymentBreakdown.partiallyPaid],
    ['Unpaid Tenants', reportData.summary.paymentBreakdown.unpaid],
    ['Overdue Tenants', reportData.summary.paymentBreakdown.overdue],
  ];
  
  summaryData.forEach((row, idx) => {
    const rowNum = idx + 4;
    const colACell = summarySheet.getCell(`A${rowNum}`);
    const colBCell = summarySheet.getCell(`B${rowNum}`);
    
    colACell.value = row[0];
    colBCell.value = row[1];
    
    if (idx === 0) {
      applyHeaderStyle(colACell);
      applyHeaderStyle(colBCell);
    } else if (row[0] === 'PAYMENT BREAKDOWN') {
      colACell.font = { bold: true, size: 12 };
      colACell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE8F5E9' }
      };
    } else if (typeof row[1] === 'number') {
      applyNumberStyle(colBCell);
      if (row[0] === 'Total Arrears (Ksh)' || row[0] === 'Overdue Tenants') {
        applyNegativeStyle(colBCell);
      } else if (row[0] === 'Total Rent Collected (Ksh)') {
        applyPositiveStyle(colBCell);
      }
    }
  });
  
  summarySheet.getColumn('A').width = 30;
  summarySheet.getColumn('B').width = 25;

  // 3. Monthly Trends Sheet
  if (reportData.monthlyTrends.length > 0) {
    const trendsSheet = workbook.addWorksheet('Monthly Trends', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    trendsSheet.mergeCells('A1:F1');
    const trendsTitle = trendsSheet.getCell('A1');
    trendsTitle.value = 'MONTHLY TRENDS';
    applyTitleStyle(trendsTitle);
    trendsSheet.getRow(1).height = 25;
    
    const headers = ['Month', 'Expected (Ksh)', 'Collected (Ksh)', 'Arrears (Ksh)', 'Collection Rate', 'Report Count'];
    const headerRow = trendsSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell);
    });
    trendsSheet.getRow(3).height = 25;
    
    reportData.monthlyTrends.forEach((trend, idx) => {
      const rowNum = idx + 4;
      const collectionRate = trend.expected > 0 ? ((trend.collected / trend.expected) * 100).toFixed(2) : '0';
      
      trendsSheet.getCell(`A${rowNum}`).value = trend.month;
      trendsSheet.getCell(`B${rowNum}`).value = trend.expected;
      trendsSheet.getCell(`C${rowNum}`).value = trend.collected;
      trendsSheet.getCell(`D${rowNum}`).value = trend.arrears;
      trendsSheet.getCell(`E${rowNum}`).value = `${collectionRate}%`;
      trendsSheet.getCell(`F${rowNum}`).value = trend.reportCount;
      
      applyNumberStyle(trendsSheet.getCell(`B${rowNum}`));
      applyNumberStyle(trendsSheet.getCell(`C${rowNum}`));
      if (trend.arrears > 0) {
        applyNegativeStyle(trendsSheet.getCell(`D${rowNum}`));
      } else {
        applyNumberStyle(trendsSheet.getCell(`D${rowNum}`));
      }
    });
    
    trendsSheet.getColumn('A').width = 15;
    trendsSheet.getColumn('B').width = 20;
    trendsSheet.getColumn('C').width = 20;
    trendsSheet.getColumn('D').width = 20;
    trendsSheet.getColumn('E').width = 18;
    trendsSheet.getColumn('F').width = 15;
  }

  // 4. Tenant Outstanding Balances Sheet
  if (reportData.tenantOutstanding.length > 0) {
    const outstandingSheet = workbook.addWorksheet('Outstanding Balances', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    outstandingSheet.mergeCells('A1:I1');
    const outstandingTitle = outstandingSheet.getCell('A1');
    outstandingTitle.value = 'TENANT OUTSTANDING BALANCES';
    applyTitleStyle(outstandingTitle);
    outstandingSheet.getRow(1).height = 25;
    
    const headers = ['Tenant Name', 'Unit Number', 'Unit Type', 'Expected Total (Ksh)', 'Paid Total (Ksh)', 'Outstanding Balance (Ksh)', 'Arrears (Ksh)', 'Last Payment Date', 'Payment Status'];
    const headerRow = outstandingSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell);
    });
    outstandingSheet.getRow(3).height = 25;
    
    reportData.tenantOutstanding.forEach((tenant, idx) => {
      const rowNum = idx + 4;
      
      outstandingSheet.getCell(`A${rowNum}`).value = tenant.tenantName;
      outstandingSheet.getCell(`B${rowNum}`).value = tenant.unitNo;
      outstandingSheet.getCell(`C${rowNum}`).value = tenant.unitType;
      outstandingSheet.getCell(`D${rowNum}`).value = tenant.expectedTotal;
      outstandingSheet.getCell(`E${rowNum}`).value = tenant.paidTotal;
      outstandingSheet.getCell(`F${rowNum}`).value = tenant.outstandingBalance;
      outstandingSheet.getCell(`G${rowNum}`).value = tenant.arrears;
      outstandingSheet.getCell(`H${rowNum}`).value = tenant.lastPaymentDate ? new Date(tenant.lastPaymentDate).toLocaleDateString() : 'No payments';
      outstandingSheet.getCell(`I${rowNum}`).value = tenant.paymentStatus;
      
      applyNumberStyle(outstandingSheet.getCell(`D${rowNum}`));
      applyNumberStyle(outstandingSheet.getCell(`E${rowNum}`));
      if (tenant.outstandingBalance > 0) {
        applyNegativeStyle(outstandingSheet.getCell(`F${rowNum}`));
        applyNegativeStyle(outstandingSheet.getCell(`G${rowNum}`));
      } else {
        applyNumberStyle(outstandingSheet.getCell(`F${rowNum}`));
        applyNumberStyle(outstandingSheet.getCell(`G${rowNum}`));
      }
      
      // Status cell styling
      const statusCell = outstandingSheet.getCell(`I${rowNum}`);
      if (tenant.paymentStatus === 'PAID') {
        statusCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
      } else if (tenant.paymentStatus === 'PARTIAL') {
        statusCell.font = { color: { argb: 'FFF57C00' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      }
    });
    
    const colWidths = [25, 12, 15, 18, 18, 18, 18, 18, 15];
    colWidths.forEach((width, idx) => {
      outstandingSheet.getColumn(idx + 1).width = width;
    });
  }

  // 5. Payment Reports Detail Sheet
  if (reportData.paymentReports.length > 0) {
    const paymentsSheet = workbook.addWorksheet('Payment Reports', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }
    });
    
    paymentsSheet.mergeCells('A1:I1');
    const paymentsTitle = paymentsSheet.getCell('A1');
    paymentsTitle.value = 'PAYMENT REPORTS DETAILS';
    applyTitleStyle(paymentsTitle);
    paymentsSheet.getRow(1).height = 25;
    
    const headers = ['Tenant Name', 'Unit Number', 'Payment Period', 'Expected Amount (Ksh)', 'Amount Paid (Ksh)', 'Arrears (Ksh)', 'Status', 'Invoice Count', 'Date Paid'];
    const headerRow = paymentsSheet.getRow(3);
    headers.forEach((header, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.value = header;
      applyHeaderStyle(cell);
    });
    paymentsSheet.getRow(3).height = 25;
    
    reportData.paymentReports.forEach((report, idx) => {
      const rowNum = idx + 4;
      
      paymentsSheet.getCell(`A${rowNum}`).value = report.tenantName;
      paymentsSheet.getCell(`B${rowNum}`).value = report.unitNo;
      paymentsSheet.getCell(`C${rowNum}`).value = report.paymentPeriod;
      paymentsSheet.getCell(`D${rowNum}`).value = report.expectedAmount;
      paymentsSheet.getCell(`E${rowNum}`).value = report.amountPaid;
      paymentsSheet.getCell(`F${rowNum}`).value = report.arrears;
      paymentsSheet.getCell(`G${rowNum}`).value = report.status;
      paymentsSheet.getCell(`H${rowNum}`).value = report.invoiceCount;
      paymentsSheet.getCell(`I${rowNum}`).value = report.datePaid ? new Date(report.datePaid).toLocaleDateString() : '-';
      
      applyNumberStyle(paymentsSheet.getCell(`D${rowNum}`));
      applyNumberStyle(paymentsSheet.getCell(`E${rowNum}`));
      if (report.arrears > 0) {
        applyNegativeStyle(paymentsSheet.getCell(`F${rowNum}`));
      } else {
        applyNumberStyle(paymentsSheet.getCell(`F${rowNum}`));
      }
      
      // Status cell styling
      const statusCell = paymentsSheet.getCell(`G${rowNum}`);
      if (report.status === 'PAID') {
        statusCell.font = { color: { argb: 'FF2E7D32' }, bold: true };
      } else if (report.status === 'PARTIAL') {
        statusCell.font = { color: { argb: 'FFF57C00' }, bold: true };
      } else if (report.status === 'PREPAID') {
        statusCell.font = { color: { argb: 'FF2196F3' }, bold: true };
      } else {
        statusCell.font = { color: { argb: 'FFD32F2F' }, bold: true };
      }
    });
    
    const colWidths = [25, 12, 18, 18, 18, 18, 15, 12, 15];
    colWidths.forEach((width, idx) => {
      paymentsSheet.getColumn(idx + 1).width = width;
    });
  }

  // Write workbook to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  
  return { buffer: buffer as any, filename };
}