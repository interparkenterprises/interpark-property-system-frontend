import ExcelJS from 'exceljs';
import { NextPaymentsResponse, NextPaymentItem } from '@/types';

interface ExportOptions {
  propertyName: string;
  exportDate?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function exportUpcomingPaymentsToExcel(
  data: NextPaymentsResponse,
  options: ExportOptions,
  filteredPayments?: NextPaymentItem[] // Add optional filtered payments
): Promise<{ buffer: Buffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Property Management System';
  workbook.created = new Date();

  // Determine which payments to use
  const paymentsToExport = filteredPayments || data.payments.filter((p) => !p.payment.isOverdue);
  
  // Sort by days until due (closest first)
  const sortedPayments = [...paymentsToExport].sort(
    (a, b) => a.payment.daysUntilDue - b.payment.daysUntilDue
  );

  // Create main sheet
  const sheet = workbook.addWorksheet('Upcoming Payments', {
    properties: { tabColor: { argb: 'FF2E86AB' } },
    pageSetup: {
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 1,
      margins: {
        left: 0.7,
        right: 0.7,
        top: 0.7,
        bottom: 0.7,
        header: 0.3,
        footer: 0.3,
      },
    },
  });

  // Set column widths
  sheet.columns = [
    { header: '#', key: 'index', width: 8 },
    { header: 'Tenant Name', key: 'tenantName', width: 25 },
    { header: 'Unit Number', key: 'unitNumber', width: 15 },
    { header: 'Unit Type', key: 'unitType', width: 15 },
    { header: 'Floor', key: 'floor', width: 12 },
    { header: 'Unit Size (sq ft)', key: 'unitSize', width: 15 },
    { header: 'Payment Policy', key: 'paymentPolicy', width: 15 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Days Until Due', key: 'daysUntilDue', width: 15 },
    { header: 'Rent Amount', key: 'rentAmount', width: 15 },
    { header: 'Service Charge', key: 'serviceCharge', width: 15 },
    { header: 'VAT', key: 'vat', width: 15 },
    { header: 'Total Amount', key: 'totalAmount', width: 18 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Phone', key: 'phone', width: 18 },
    { header: 'KRA PIN', key: 'kraPin', width: 15 },
    { header: 'Escalation Rate', key: 'escalationRate', width: 15 },
    { header: 'Escalation Frequency', key: 'escalationFrequency', width: 18 },
    { header: 'Next Escalation Date', key: 'nextEscalationDate', width: 18 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.font = {
    name: 'Calibri',
    size: 11,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E86AB' },
  };
  headerRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
    wrapText: true,
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      left: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      bottom: { style: 'thin', color: { argb: 'FFB0B0B0' } },
      right: { style: 'thin', color: { argb: 'FFB0B0B0' } },
    };
  });

  // Add data rows
  sortedPayments.forEach((payment: NextPaymentItem, index: number) => {
    // Calculate total VAT from the payment amount (vatOnRent + vatOnServiceCharge)
    const totalVAT = (payment.payment.amount.vatOnRent || 0) + (payment.payment.amount.vatOnServiceCharge || 0);
    
    const row = sheet.addRow({
      index: index + 1,
      tenantName: payment.name,
      unitNumber: payment.unit.number,
      unitType: payment.unit.type,
      floor: payment.unit.floor,
      unitSize: payment.unit.size,
      paymentPolicy: payment.payment.policy.charAt(0) + payment.payment.policy.slice(1).toLowerCase(),
      dueDate: payment.payment.dueDate,
      daysUntilDue: payment.payment.daysUntilDue,
      rentAmount: payment.payment.amount.rent,
      serviceCharge: payment.payment.amount.serviceCharge,
      vat: totalVAT, // Use calculated total VAT
      totalAmount: payment.payment.amount.total,
      email: payment.contact.email || 'N/A',
      phone: payment.contact.phone || 'N/A',
      kraPin: payment.contact.kra || 'N/A',
      escalationRate: payment.rent.escalation ? `${payment.rent.escalation.rate}%` : 'N/A',
      escalationFrequency: payment.rent.escalation ? payment.rent.escalation.frequency : 'N/A',
      nextEscalationDate: payment.rent.escalation
        ? new Date(payment.rent.escalation.nextDate).toLocaleDateString()
        : 'N/A',
    });

    // Style the row
    row.height = 22;
    row.font = {
      name: 'Calibri',
      size: 10,
    };
    row.alignment = {
      vertical: 'middle',
      wrapText: true,
    };

    // Color-code days until due
    const daysUntilDue = payment.payment.daysUntilDue;
    let fillColor = 'FFFFFFFF'; // White default
    let fontColor = 'FF000000'; // Black default

    if (daysUntilDue <= 0) {
      fillColor = 'FFFF0000'; // Red - Overdue
      fontColor = 'FFFFFFFF';
    } else if (daysUntilDue <= 3) {
      fillColor = 'FFFF6B6B'; // Light Red - Urgent
      fontColor = 'FF000000';
    } else if (daysUntilDue <= 7) {
      fillColor = 'FFFFD93D'; // Yellow - Soon
      fontColor = 'FF000000';
    } else if (daysUntilDue <= 14) {
      fillColor = 'FFFFF3CD'; // Light Yellow - Coming up
      fontColor = 'FF000000';
    }

    // Apply fill and font color to the row
    row.eachCell((cell) => {
      const col = typeof cell.col === 'number' ? cell.col : Number(cell.col);

      if (col === 1 || col === 9) {
        // Index and Days Until Due columns
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: fillColor },
        };
        cell.font = {
          ...cell.font,
          color: { argb: fontColor },
          bold: col === 9, // Bold for days until due
        };
      } else if (col === 13) {
        // Total Amount column - make bold
        cell.font = {
          ...cell.font,
          bold: true,
          color: { argb: 'FF2E86AB' },
        };
        cell.numFmt = '#,##0.00';
      } else if (col === 10 || col === 11 || col === 12) {
        // Amount columns - format as currency (Rent, Service Charge, VAT)
        cell.numFmt = '#,##0.00';
      }

      // Add borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  });

  // Add summary sheet
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF4CAF50' } },
  });

  // Set summary columns
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 30 },
  ];

  // Style summary header
  const summaryHeaderRow = summarySheet.getRow(1);
  summaryHeaderRow.height = 30;
  summaryHeaderRow.font = {
    name: 'Calibri',
    size: 12,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  summaryHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4CAF50' },
  };
  summaryHeaderRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  // Calculate filtered totals
  const filteredTotalAmount = sortedPayments.reduce((sum, p) => sum + p.payment.amount.total, 0);
  const filteredTotalVAT = sortedPayments.reduce((sum, p) => {
    return sum + (p.payment.amount.vatOnRent || 0) + (p.payment.amount.vatOnServiceCharge || 0);
  }, 0);

  // Add summary data
  const summaryData = [
    ['Property Name', options.propertyName],
    ['Export Date', options.exportDate || new Date().toLocaleDateString()],
    ['Date Range:', options.dateFrom && options.dateTo ? `${options.dateFrom} to ${options.dateTo}` : 
      options.dateFrom ? `From ${options.dateFrom}` : 
      options.dateTo ? `To ${options.dateTo}` : 
      'All upcoming payments'],
    [''],
    ['Filtered Results:', ''],
    [`  Total Tenants in Filter`, sortedPayments.length],
    [`  Total Amount in Filter`, `Ksh ${filteredTotalAmount.toLocaleString()}`],
    [`  Total VAT in Filter`, `Ksh ${filteredTotalVAT.toLocaleString()}`],
    [''],
    ['All Data Summary:', ''],
    ['Total Tenants (All)', data.summary.total],
    ['Upcoming Payments (All)', data.summary.upcoming],
    ['Overdue Payments (All)', data.summary.overdue],
    ['Total Upcoming Amount (All)', `Ksh ${data.summary.amounts.upcoming.toLocaleString()}`],
    ['Total Outstanding Amount (All)', `Ksh ${data.summary.amounts.outstanding.toLocaleString()}`],
    [''],
    ['Payment Policy Breakdown (All):'],
    [`  Monthly`, data.summary.byPolicy.MONTHLY],
    [`  Quarterly`, data.summary.byPolicy.QUARTERLY],
    [`  Annual`, data.summary.byPolicy.ANNUAL],
    [''],
    ['Status Summary (Filtered):'],
    [`  Due Within 7 Days`, sortedPayments.filter((p) => p.payment.daysUntilDue <= 7 && p.payment.daysUntilDue > 0).length],
    [`  Due Within 14 Days`, sortedPayments.filter((p) => p.payment.daysUntilDue <= 14 && p.payment.daysUntilDue > 0).length],
    [`  Due Within 30 Days`, sortedPayments.filter((p) => p.payment.daysUntilDue <= 30 && p.payment.daysUntilDue > 0).length],
  ];

  summaryData.forEach(([metric, value], index) => {
    const row = summarySheet.addRow({
      metric: metric || '',
      value: value || '',
    });

    row.height = 22;
    row.font = { name: 'Calibri', size: 11 };

    if (typeof metric === 'string' && metric.includes(':')) {
      row.font = { name: 'Calibri', size: 11, bold: true };
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF5F5F5' },
      };
    }

    if (metric === '') {
      row.height = 10;
    }

    if (index === 0) {
      // First row after header
      row.font = { name: 'Calibri', size: 12, bold: true };
    }

    // Add borders
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
        right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      };
    });
  });

  // Add title row with styling
  const titleRow = summarySheet.insertRow(1, [
    'Upcoming Payments Summary',
    '',
  ]);
  titleRow.height = 40;
  titleRow.font = {
    name: 'Calibri',
    size: 16,
    bold: true,
    color: { argb: 'FF2E86AB' },
  };
  titleRow.alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };
  summarySheet.mergeCells('A1:B1');

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer();

  // Generate filename with date range
  let dateRange = '';
  if (options.dateFrom && options.dateTo) {
    dateRange = `_${options.dateFrom}_to_${options.dateTo}`;
  } else if (options.dateFrom) {
    dateRange = `_from_${options.dateFrom}`;
  } else if (options.dateTo) {
    dateRange = `_to_${options.dateTo}`;
  }
  
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `Upcoming_Payments_${options.propertyName.replace(/\s+/g, '_')}${dateRange}_${timestamp}.xlsx`;

  return {
    buffer: Buffer.from(buffer),
    filename,
  };
}