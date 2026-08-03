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
  filteredPayments?: NextPaymentItem[] // Optional filtered payments
): Promise<{ buffer: Buffer; filename: string }> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Property Management System';
  workbook.created = new Date();

  // Determine which payments to use - if filteredPayments is provided, use it, otherwise use ALL payments
  const paymentsToExport = filteredPayments || data.payments;
  
  // Sort: Overdue first, then by days until due (closest first)
  const sortedPayments = [...paymentsToExport].sort((a, b) => {
    // Overdue first
    if (a.payment.isOverdue && !b.payment.isOverdue) return -1;
    if (!a.payment.isOverdue && b.payment.isOverdue) return 1;
    // Then by days until due (ascending)
    return a.payment.daysUntilDue - b.payment.daysUntilDue;
  });

  // Create main sheet
  const sheet = workbook.addWorksheet('All Tenant Payments', {
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

  // Set column widths - Expanded to include all fields
  sheet.columns = [
    { header: '#', key: 'index', width: 6 },
    { header: 'Status', key: 'status', width: 18 },
    { header: 'Tenant Name', key: 'tenantName', width: 28 },
    { header: 'Unit Number', key: 'unitNumber', width: 13 },
    { header: 'Unit Type', key: 'unitType', width: 18 },
    { header: 'Floor', key: 'floor', width: 14 },
    { header: 'Unit Size (sq ft)', key: 'unitSize', width: 14 },
    { header: 'Payment Policy', key: 'paymentPolicy', width: 13 },
    { header: 'Due Date', key: 'dueDate', width: 18 },
    { header: 'Overdue Since', key: 'overdueSince', width: 18 },
    { header: 'Days Until Due', key: 'daysUntilDue', width: 15 },
    { header: 'Days Overdue', key: 'daysOverdue', width: 15 },
    { header: 'Current Rent', key: 'currentRent', width: 15 },
    { header: 'Rent Amount Due', key: 'rentAmount', width: 18 },
    { header: 'Service Charge', key: 'serviceCharge', width: 18 },
    { header: 'VAT on Rent', key: 'vatOnRent', width: 15 },
    { header: 'VAT on Service Charge', key: 'vatOnServiceCharge', width: 20 },
    { header: 'Total VAT', key: 'vat', width: 15 },
    { header: 'Total Amount Due', key: 'totalAmount', width: 20 },
    { header: 'Outstanding Balance', key: 'outstandingBalance', width: 22 },
    { header: 'Regular Period Amount', key: 'regularPeriodAmount', width: 22 },
    { header: 'Total Paid', key: 'totalPaid', width: 16 },
    { header: 'Total Expected', key: 'totalExpected', width: 16 },
    { header: 'Payments Behind', key: 'paymentsBehind', width: 16 },
    { header: 'Due Per Period', key: 'duePerPeriod', width: 16 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 16 },
    { header: 'KRA PIN', key: 'kraPin', width: 16 },
    { header: 'Escalation Rate', key: 'escalationRate', width: 16 },
    { header: 'Escalation Frequency', key: 'escalationFrequency', width: 20 },
    { header: 'Next Escalation Date', key: 'nextEscalationDate', width: 20 },
    { header: 'Last Payment Date', key: 'lastPaymentDate', width: 20 },
    { header: 'Payments Made', key: 'paymentsMade', width: 16 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 35;
  headerRow.font = {
    name: 'Calibri',
    size: 10,
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
    // Cast payment.payment to access enhanced fields
    const paymentData = payment.payment as any;
    
    // Calculate total VAT from the payment amount
    const totalVAT = (payment.payment.amount.vatOnRent || 0) + (payment.payment.amount.vatOnServiceCharge || 0);
    
    // Determine status display
    let statusDisplay = payment.payment.status;
    if (payment.payment.isOverdue) {
      statusDisplay = 'OVERDUE';
    } else if (payment.payment.status === 'OVERPAID') {
      statusDisplay = 'OVERPAID';
    } else if (payment.payment.status === 'GRACE_PERIOD_SOON') {
      statusDisplay = 'GRACE PERIOD SOON';
    } else if (payment.payment.daysUntilDue === 0) {
      statusDisplay = 'DUE TODAY';
    } else if (payment.payment.daysUntilDue <= 5 && payment.payment.daysUntilDue > 0) {
      statusDisplay = 'DUE SOON';
    }
    
    // Get overdue since date - use the actual value or null
    const overdueSince = paymentData.overdueSince || null;
    const daysOverdue = paymentData.daysOverdue || 0;
    const outstandingBalance = paymentData.outstandingBalance || 0;
    const regularPeriodAmount = paymentData.regularPeriodAmount || 0;
    const daysUntilDue = payment.payment.daysUntilDue;
    
    const row = sheet.addRow({
      index: index + 1,
      status: statusDisplay,
      tenantName: payment.name,
      unitNumber: payment.unit.number,
      unitType: payment.unit.type,
      floor: payment.unit.floor,
      unitSize: payment.unit.size,
      paymentPolicy: payment.payment.policy.charAt(0) + payment.payment.policy.slice(1).toLowerCase(),
      dueDate: payment.payment.dueDate,
      overdueSince: overdueSince || 'N/A',
      daysUntilDue: daysUntilDue,
      daysOverdue: daysOverdue !== 0 ? daysOverdue : null,
      currentRent: payment.rent.current,
      rentAmount: payment.payment.amount.rent,
      serviceCharge: payment.payment.amount.serviceCharge,
      vatOnRent: payment.payment.amount.vatOnRent || 0,
      vatOnServiceCharge: payment.payment.amount.vatOnServiceCharge || 0,
      vat: totalVAT,
      totalAmount: payment.payment.amount.total,
      outstandingBalance: outstandingBalance,
      regularPeriodAmount: regularPeriodAmount,
      totalPaid: paymentData.totalPaid || 0,
      totalExpected: paymentData.totalExpected || 0,
      paymentsBehind: paymentData.paymentsBehind || 0,
      duePerPeriod: paymentData.totalDuePerPeriod || 0,
      email: payment.contact.email || 'N/A',
      phone: payment.contact.phone || 'N/A',
      kraPin: payment.contact.kra || 'N/A',
      escalationRate: payment.rent.escalation ? `${payment.rent.escalation.rate}%` : 'N/A',
      escalationFrequency: payment.rent.escalation ? payment.rent.escalation.frequency : 'N/A',
      nextEscalationDate: payment.rent.escalation
        ? new Date(payment.rent.escalation.nextDate).toLocaleDateString()
        : 'N/A',
      lastPaymentDate: payment.history?.lastPayment || 'N/A',
      paymentsMade: payment.history?.paymentsMade || 0,
    });

    // Style the row - white background by default
    row.height = 22;
    row.font = {
      name: 'Calibri',
      size: 10,
      color: { argb: 'FF000000' }, // Black text
    };
    row.alignment = {
      vertical: 'middle',
      wrapText: true,
    };

    // Set white background for all cells by default
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFFFFF' }, // White background
      };
    });

    // NOW apply special styling ONLY to the Status column (column 2)
    const isOverdue = payment.payment.isOverdue;
    const isOverpaid = payment.payment.status === 'OVERPAID';
    
    // Get the status cell (column 2)
    const statusCell = row.getCell(2);
    
    // Apply status-specific styling ONLY to the status column
    if (isOverdue) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF0000' }, // Red for OVERDUE
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White text
      };
    } else if (isOverpaid) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF9B59B6' }, // Purple for OVERPAID
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White text
      };
    } else if (daysUntilDue <= 3 && daysUntilDue > 0) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFF8C00' }, // Orange for urgent
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FFFFFFFF' }, // White text
      };
    } else if (daysUntilDue <= 7 && daysUntilDue > 0) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD93D' }, // Yellow for soon
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FF000000' }, // Black text
      };
    } else if (daysUntilDue <= 14 && daysUntilDue > 0) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFF3CD' }, // Light yellow
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FF000000' }, // Black text
      };
    } else if (daysUntilDue > 14) {
      statusCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD4EFDF' }, // Light green
      };
      statusCell.font = {
        name: 'Calibri',
        size: 10,
        bold: true,
        color: { argb: 'FF000000' }, // Black text
      };
    }
    
    // Center align the status cell
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' };

    // Now apply formatting to specific columns with white background
    row.eachCell((cell) => {
      const col = typeof cell.col === 'number' ? cell.col : Number(cell.col);

      // Skip the status column (already handled above)
      if (col === 2) return;

      // Format Days Until Due (column 11)
      if (col === 11) {
        cell.font = {
          ...cell.font,
          bold: true,
        };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Format Days Overdue (column 12) - show negative in red
      if (col === 12) {
        if (daysOverdue !== 0) {
          cell.font = {
            ...cell.font,
            bold: true,
            color: { argb: 'FFFF0000' }, // Red for overdue days
          };
          cell.numFmt = '#,##0';
        } else {
          cell.value = 'N/A';
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      }

      // Total Amount column (column 19) - make bold and colored
      if (col === 19) {
        cell.font = {
          ...cell.font,
          bold: true,
          color: { argb: isOverdue ? 'FFFF0000' : isOverpaid ? 'FF9B59B6' : 'FF2E86AB' },
        };
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Outstanding Balance column (column 20)
      if (col === 20) {
        if (outstandingBalance > 0) {
          cell.font = {
            ...cell.font,
            bold: true,
            color: { argb: 'FFFF0000' }, // Red for arrears
          };
        } else if (outstandingBalance < 0) {
          cell.font = {
            ...cell.font,
            bold: true,
            color: { argb: 'FF9B59B6' }, // Purple for credit
          };
        }
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Regular Period Amount column (column 21)
      if (col === 21) {
        cell.font = {
          ...cell.font,
          color: { argb: 'FF2E86AB' },
        };
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Format currency columns
      if ([14, 15, 16, 17, 18, 22, 23, 25].includes(col)) {
        cell.numFmt = '#,##0.00';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Format integer columns
      if ([24].includes(col)) {
        cell.numFmt = '#,##0';
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }

      // Borders for all cells
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
    { header: 'Metric', key: 'metric', width: 40 },
    { header: 'Value', key: 'value', width: 40 },
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
  const filteredTotalRent = sortedPayments.reduce((sum, p) => sum + p.payment.amount.rent, 0);
  const filteredTotalServiceCharge = sortedPayments.reduce((sum, p) => sum + p.payment.amount.serviceCharge, 0);
  const filteredTotalVAT = sortedPayments.reduce((sum, p) => {
    return sum + (p.payment.amount.vatOnRent || 0) + (p.payment.amount.vatOnServiceCharge || 0);
  }, 0);
  
  // Calculate filtered totals for enhanced fields
  const filteredTotalPaid = sortedPayments.reduce((sum, p) => {
    const paymentData = p.payment as any;
    return sum + (paymentData.totalPaid || 0);
  }, 0);
  const filteredTotalExpected = sortedPayments.reduce((sum, p) => {
    const paymentData = p.payment as any;
    return sum + (paymentData.totalExpected || 0);
  }, 0);
  const filteredTotalOutstanding = sortedPayments.reduce((sum, p) => {
    const paymentData = p.payment as any;
    return sum + (paymentData.outstandingBalance || 0);
  }, 0);
  const filteredTotalBehind = sortedPayments.reduce((sum, p) => {
    const paymentData = p.payment as any;
    return sum + (paymentData.paymentsBehind || 0);
  }, 0);

  // Count statuses
  const overdueCount = sortedPayments.filter(p => p.payment.isOverdue).length;
  const overpaidCount = sortedPayments.filter(p => p.payment.status === 'OVERPAID').length;
  const dueTodayCount = sortedPayments.filter(p => p.payment.daysUntilDue === 0).length;
  const dueSoonCount = sortedPayments.filter(p => p.payment.daysUntilDue > 0 && p.payment.daysUntilDue <= 7).length;
  const upcomingCount = sortedPayments.filter(p => p.payment.daysUntilDue > 7).length;

  // Add summary data
  const summaryData = [
    ['Property Name', options.propertyName],
    ['Export Date', options.exportDate || new Date().toLocaleDateString()],
    ['Date Range:', options.dateFrom && options.dateTo ? `${options.dateFrom} to ${options.dateTo}` : 
      options.dateFrom ? `From ${options.dateFrom}` : 
      options.dateTo ? `To ${options.dateTo}` : 
      'All tenants'],
    [''],
    ['FILTERED RESULTS:', ''],
    [`  Total Tenants in Filter`, sortedPayments.length],
    [`  - Overdue`, overdueCount],
    [`  - Overpaid`, overpaidCount],
    [`  - Due Today`, dueTodayCount],
    [`  - Due Within 7 Days`, dueSoonCount],
    [`  - Upcoming (>7 days)`, upcomingCount],
    [''],
    [`  Total Amount Due`, `Ksh ${filteredTotalAmount.toLocaleString()}`],
    [`  Total Rent Due`, `Ksh ${filteredTotalRent.toLocaleString()}`],
    [`  Total Service Charge`, `Ksh ${filteredTotalServiceCharge.toLocaleString()}`],
    [`  Total VAT`, `Ksh ${filteredTotalVAT.toLocaleString()}`],
    [''],
    [`  Total Paid (All Time)`, `Ksh ${filteredTotalPaid.toLocaleString()}`],
    [`  Total Expected (All Time)`, `Ksh ${filteredTotalExpected.toLocaleString()}`],
    [`  Total Outstanding Balance`, `Ksh ${filteredTotalOutstanding.toLocaleString()}`],
    [`  Total Payments Behind`, filteredTotalBehind],
    [''],
    ['ALL DATA SUMMARY:', ''],
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
  ];

  summaryData.forEach(([metric, value], index) => {
    const row = summarySheet.addRow({
      metric: metric || '',
      value: value || '',
    });

    row.height = 22;
    row.font = { name: 'Calibri', size: 11 };

    if (typeof metric === 'string' && (metric.includes(':') || metric.includes('FILTERED') || metric.includes('ALL DATA'))) {
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
    'Tenant Payment Summary',
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
  const filename = `Tenant_Payments_${options.propertyName.replace(/\s+/g, '_')}${dateRange}_${timestamp}.xlsx`;

  return {
    buffer: Buffer.from(buffer),
    filename,
  };
}