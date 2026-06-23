import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Tenant, PaymentReport, BillInvoice, Invoice } from '@/types';

interface CompanyInfo {
  name: string;
  phone: string;
  email: string;
  website: string;
}

const companyInfo: CompanyInfo = {
  name: 'Interpark Enterprises Limited',
  phone: '0110 060 088',
  email: 'info@interparkenterprises.co.ke',
  website: 'www.interparkenterprises.co.ke',
};

// Helper function to safely get text from cell
const getCellText = (cell: any): string => {
  if (!cell || !cell.text) return '';
  if (Array.isArray(cell.text)) {
    return cell.text.join(' ');
  }
  return String(cell.text);
};

// Helper function to extract numeric value from formatted currency string
const extractNumericValue = (text: string): number => {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
};

// Helper function to group payment reports by period and consolidate
const consolidatePaymentReports = (paymentReports: PaymentReport[]) => {
  // Sort reports by date (oldest first)
  const sorted = [...paymentReports].sort(
    (a, b) => new Date(a.datePaid).getTime() - new Date(b.datePaid).getTime()
  );

  // Group by period
  const periodGroups = new Map<string, PaymentReport[]>();
  sorted.forEach(report => {
    const periodKey = new Date(report.paymentPeriod).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    if (!periodGroups.has(periodKey)) {
      periodGroups.set(periodKey, []);
    }
    periodGroups.get(periodKey)!.push(report);
  });

  // For each period, get the latest report (final state) and sum all payments
  let consolidatedRent = 0;
  let consolidatedServiceCharge = 0;
  let consolidatedVat = 0;
  let consolidatedTotalDue = 0;
  let totalPaidAll = 0;
  let consolidatedArrears = 0;
  let periodCount = 0;

  periodGroups.forEach((reports, periodKey) => {
    // Get the most recent report for this period (final state)
    const sortedByDate = reports.sort(
      (a, b) => new Date(b.datePaid).getTime() - new Date(a.datePaid).getTime()
    );
    const latestReport = sortedByDate[0];

    // Use the latest report's values as the consolidated amounts
    consolidatedRent += latestReport.rent;
    consolidatedServiceCharge += latestReport.serviceCharge || 0;
    consolidatedVat += latestReport.vat || 0;
    consolidatedTotalDue += latestReport.totalDue;
    totalPaidAll += reports.reduce((sum, r) => sum + r.amountPaid, 0);
    consolidatedArrears += latestReport.arrears;
    periodCount++;
  });

  return {
    consolidatedRent,
    consolidatedServiceCharge,
    consolidatedVat,
    consolidatedTotalDue,
    totalPaidAll,
    consolidatedArrears,
    periodCount
  };
};

// Helper function to consolidate bill invoices by period
const consolidateBillInvoices = (billInvoices: BillInvoice[]) => {
  // Group by period (month/year of issue date)
  const periodGroups = new Map<string, BillInvoice[]>();
  billInvoices.forEach(invoice => {
    const periodKey = new Date(invoice.issueDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short'
    });
    if (!periodGroups.has(periodKey)) {
      periodGroups.set(periodKey, []);
    }
    periodGroups.get(periodKey)!.push(invoice);
  });

  let totalAmount = 0;
  let totalVAT = 0;
  let grandTotal = 0;
  let totalPaid = 0;
  let totalBalance = 0;
  let totalUnits = 0;

  periodGroups.forEach((invoices) => {
    // For each period, use the latest invoice's amounts and sum all payments
    const sortedByDate = invoices.sort(
      (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
    );
    const latestInvoice = sortedByDate[0];

    totalAmount += latestInvoice.totalAmount;
    totalVAT += latestInvoice.vatAmount || 0;
    grandTotal += latestInvoice.grandTotal;
    totalUnits += invoices.reduce((sum, inv) => sum + inv.units, 0);
    totalPaid += invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    totalBalance += latestInvoice.balance;
  });

  return {
    totalUnits,
    totalAmount,
    totalVAT,
    grandTotal,
    totalPaid,
    totalBalance
  };
};

// ============================================
// PAYMENT REPORT PDF GENERATION
// ============================================
export const generatePaymentReportPDF = async (
  tenant: Tenant,
  paymentReports: PaymentReport[]
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  try {
    // Add company header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT PAYMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Report date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 15;

    // Tenant Information Box
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 45, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', margin + 5, yPosition + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let infoY = yPosition + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.fullName, margin + 35, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.contact || 'N/A', margin + 35, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Unit:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.unit?.type || 'N/A', margin + 35, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Rent:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Ksh ${tenant.rent.toLocaleString()}`, margin + 35, infoY);

    if (tenant.KRAPin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRA PIN:', pageWidth / 2, yPosition + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tenant.KRAPin, pageWidth / 2 + 35, yPosition + 15);
    }

    yPosition += 55;

    // Payment History Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT HISTORY', margin, yPosition);
    yPosition += 8;

    // Payment Reports Table
    if (paymentReports.length > 0) {
      // Sort reports by date (ascending)
      const sortedReports = [...paymentReports].sort(
        (a, b) => new Date(a.datePaid).getTime() - new Date(b.datePaid).getTime()
      );

      const tableData = sortedReports.map((report) => [
        new Date(report.paymentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        new Date(report.datePaid).toLocaleDateString(),
        `Ksh ${report.rent.toLocaleString()}`,
        report.serviceCharge ? `Ksh ${report.serviceCharge.toLocaleString()}` : '-',
        report.vat ? `Ksh ${report.vat.toLocaleString()}` : '-',
        `Ksh ${report.totalDue.toLocaleString()}`,
        `Ksh ${report.amountPaid.toLocaleString()}`,
        `Ksh ${report.arrears.toLocaleString()}`,
        report.status,
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [
          [
            'Period',
            'Date Paid',
            'Rent',
            'Service Charge',
            'VAT',
            'Total Due',
            'Amount Paid',
            'Arrears',
            'Status',
          ],
        ],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 9,
        },
        bodyStyles: {
          fontSize: 8,
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 15 },
          5: { cellWidth: 20 },
          6: { cellWidth: 20 },
          7: { cellWidth: 18 },
          8: { cellWidth: 16 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: margin, right: margin },
        tableWidth: pageWidth - (margin * 2),
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 10;

      // Get consolidated summary
      const summary = consolidatePaymentReports(paymentReports);

      // Check if we need a new page for the summary table
      const summaryHeight = 60;
      const footerHeight = 25;
      
      if (finalY + summaryHeight > pageHeight - footerHeight) {
        pdf.addPage();
        yPosition = margin;
      } else {
        yPosition = finalY;
      }

      // Summary Title
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY', margin, yPosition);
      yPosition += 6;

      // Summary Table using consolidated values
      const summaryData = [
        ['Total Rent:', `Ksh ${summary.consolidatedRent.toLocaleString()}`, 'Total Due:', `Ksh ${summary.consolidatedTotalDue.toLocaleString()}`],
        ['Total Service Charge:', `Ksh ${summary.consolidatedServiceCharge.toLocaleString()}`, 'Total Paid:', `Ksh ${summary.totalPaidAll.toLocaleString()}`],
        ['Total VAT:', `Ksh ${summary.consolidatedVat.toLocaleString()}`, 'Total Arrears:', `Ksh ${summary.consolidatedArrears.toLocaleString()}`],
      ];

      autoTable(pdf, {
        startY: yPosition,
        body: summaryData,
        theme: 'grid',
        bodyStyles: {
          fontSize: 9,
          cellPadding: 4,
        },
        columnStyles: {
          0: { cellWidth: 40, fontStyle: 'bold', fillColor: [240, 240, 240] },
          1: { cellWidth: 50, halign: 'right' },
          2: { cellWidth: 40, fontStyle: 'bold', fillColor: [240, 240, 240] },
          3: { cellWidth: 50, halign: 'right' },
        },
        styles: {
          lineColor: [200, 200, 200],
          lineWidth: 0.5,
        },
        margin: { left: margin, right: margin },
        tableWidth: pageWidth - (margin * 2),
        didParseCell: function (data: any) {
          if (data.section === 'body') {
            // Total Paid - Green
            if (data.row.index === 1 && data.column.index === 3) {
              data.cell.styles.textColor = [0, 128, 0];
              data.cell.styles.fontStyle = 'bold';
            }
            // Total Arrears - Red (only show red if there are arrears)
            if (data.row.index === 2 && data.column.index === 3) {
              const cellText = getCellText(data.cell);
              const arrearsValue = extractNumericValue(cellText);
              if (arrearsValue > 0) {
                data.cell.styles.textColor = [255, 0, 0];
              } else {
                data.cell.styles.textColor = [0, 128, 0];
              }
              data.cell.styles.fontStyle = 'bold';
            }
            // Total Due - Bold
            if (data.row.index === 0 && data.column.index === 3) {
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 20;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No payment records found.', margin, yPosition);
      yPosition += 20;
    }

    // Add footer
    const totalPages = pdf.internal.pages.length;
    pdf.setPage(totalPages);
    
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`© ${new Date().getFullYear()} ${companyInfo.name}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    const fileName = `Payment_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================
// BILL INVOICE REPORT PDF GENERATION
// ============================================
export const generateBillInvoiceReportPDF = async (
  tenant: Tenant,
  billInvoices: BillInvoice[]
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  try {
    // Add company header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 10;

    // Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL PAYMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Report date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 10;

    // Tenant Information Box
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 30, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', margin + 5, yPosition + 7);
    
    pdf.setFontSize(9);
    let infoY = yPosition + 13;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.fullName, margin + 20, infoY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', margin + 5, infoY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.contact || 'N/A', margin + 25, infoY + 6);
    
    if (tenant.KRAPin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRA PIN:', pageWidth / 2, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tenant.KRAPin, pageWidth / 2 + 20, infoY);
    }
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Unit:', pageWidth / 2, infoY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.unit?.type || 'N/A', pageWidth / 2 + 15, infoY + 6);

    yPosition += 35;

    // Bill Payment History Title
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL PAYMENT HISTORY', margin, yPosition);
    yPosition += 5;

    const footerHeight = 40;
    
    if (billInvoices.length > 0) {
      const tableData = billInvoices.map((invoice) => [
        invoice.billType,
        invoice.invoiceNumber,
        new Date(invoice.issueDate).toLocaleDateString(),
        new Date(invoice.dueDate).toLocaleDateString(),
        invoice.units.toFixed(2),
        `Ksh ${invoice.chargePerUnit.toFixed(2)}`,
        `Ksh ${invoice.totalAmount.toLocaleString()}`,
        invoice.vatAmount ? `Ksh ${invoice.vatAmount.toLocaleString()}` : '-',
        `Ksh ${invoice.grandTotal.toLocaleString()}`,
        `Ksh ${invoice.amountPaid.toLocaleString()}`,
        `Ksh ${invoice.balance.toLocaleString()}`,
        invoice.status,
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [
          [
            'Type',
            'Invoice #',
            'Issue Date',
            'Due Date',
            'Units',
            'Rate',
            'Amount',
            'VAT',
            'Total',
            'Paid',
            'Balance',
            'Status',
          ],
        ],
        body: tableData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
        },
        bodyStyles: {
          fontSize: 6,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 13, fontSize: 6 },
          1: { cellWidth: 16, fontSize: 6 },
          2: { cellWidth: 14, fontSize: 6 },
          3: { cellWidth: 14, fontSize: 6 },
          4: { cellWidth: 10, fontSize: 6 },
          5: { cellWidth: 12, fontSize: 6 },
          6: { cellWidth: 14, fontSize: 6 },
          7: { cellWidth: 10, fontSize: 6 },
          8: { cellWidth: 14, fontSize: 6 },
          9: { cellWidth: 14, fontSize: 6 },
          10: { cellWidth: 14, fontSize: 6 },
          11: { cellWidth: 12, fontSize: 6 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: margin, right: margin },
        tableWidth: pageWidth - (margin * 2),
        pageBreak: 'auto',
        didDrawPage: function (data: any) {
          if (data.cursor && data.cursor.y > pageHeight - footerHeight - 20) {
            pdf.addPage();
            (this as any).settings.startY = margin;
          }
        },
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 5;
      
      // Get consolidated bill summary
      const summary = consolidateBillInvoices(billInvoices);

      const summaryY = Math.max(finalY, margin);
      
      if (summaryY < pageHeight - footerHeight - 30) {
        const summaryRows = [
          ['Total Units:', summary.totalUnits.toFixed(2), '', ''],
          ['Total Amount:', `Ksh ${summary.totalAmount.toLocaleString()}`, 'Total VAT:', `Ksh ${summary.totalVAT.toLocaleString()}`],
          ['Grand Total:', `Ksh ${summary.grandTotal.toLocaleString()}`, 'Total Paid:', `Ksh ${summary.totalPaid.toLocaleString()}`],
          ['', '', 'Total Balance:', `Ksh ${summary.totalBalance.toLocaleString()}`]
        ];

        autoTable(pdf, {
          startY: summaryY,
          body: summaryRows,
          theme: 'plain',
          bodyStyles: {
            fontSize: 8,
            cellPadding: 3,
          },
          columnStyles: {
            0: { cellWidth: 30, fontStyle: 'bold', halign: 'right' },
            1: { cellWidth: 40, halign: 'right' },
            2: { cellWidth: 30, fontStyle: 'bold', halign: 'right' },
            3: { cellWidth: 40, halign: 'right' },
          },
          styles: {
            lineColor: [200, 200, 200],
            lineWidth: 0.1,
          },
          margin: { left: margin, right: margin },
          tableWidth: pageWidth - (margin * 2),
          didParseCell: function (data: any) {
            if (data.section === 'body') {
              if (data.row.index === 2 && data.column.index === 3) {
                data.cell.styles.textColor = [0, 128, 0];
              }
              if (data.row.index === 3 && data.column.index === 3) {
                const cellText = getCellText(data.cell);
                const balanceValue = extractNumericValue(cellText);
                data.cell.styles.textColor = balanceValue > 0 ? [255, 0, 0] : [0, 128, 0];
              }
            }
          },
        });
      }
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No bill payment records found.', margin, yPosition);
    }

    // Add footer
    const footerY = pageHeight - 30;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    pdf.text(
      companyInfo.website,
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    );
    pdf.setFontSize(7);
    pdf.text(
      `© ${new Date().getFullYear()} ${companyInfo.name}`,
      pageWidth / 2,
      footerY + 10,
      { align: 'center' }
    );
    
    const fileName = `Bill_Payment_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating bill payment report PDF:', error);
    throw new Error(`Failed to generate bill payment report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// ============================================
// COMPREHENSIVE REPORT PDF GENERATION
// ============================================
export const generateComprehensiveReportPDF = async (
  tenant: Tenant,
  paymentReports: PaymentReport[],
  billInvoices: BillInvoice[],
  invoices?: Invoice[]
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = 20;

  try {
    // Add company header
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 15;

    // Title
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPREHENSIVE PAYMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Report date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(
      `Generated on: ${new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 15;

    // Tenant Information Box
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 40, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', margin + 5, yPosition + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let infoY = yPosition + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.fullName, margin + 25, infoY);
    
    if (tenant.KRAPin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRA PIN:', pageWidth - 100, infoY);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tenant.KRAPin, pageWidth - 70, infoY);
    }
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.contact || 'N/A', margin + 30, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Unit:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.unit?.type || 'N/A', margin + 25, infoY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Rent:', pageWidth - 100, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Ksh ${tenant.rent.toLocaleString()}`, pageWidth - 60, infoY);

    yPosition += 50;

    // === RENT PAYMENT SECTION ===
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RENT PAYMENT HISTORY', margin, yPosition);
    yPosition += 8;

    if (paymentReports.length > 0) {
      const rentTableData = paymentReports.map((report) => {
        const relatedInvoice = invoices?.find(inv => 
          inv.totalDue === report.totalDue && 
          inv.amountPaid === report.amountPaid
        );

        return [
          new Date(report.paymentPeriod).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          relatedInvoice ? relatedInvoice.invoiceNumber : '-',
          relatedInvoice ? new Date(relatedInvoice.issueDate).toLocaleDateString() : '-',
          new Date(report.datePaid).toLocaleDateString(),
          `Ksh ${report.rent.toLocaleString()}`,
          report.serviceCharge ? `Ksh ${report.serviceCharge.toLocaleString()}` : '-',
          report.vat ? `Ksh ${report.vat.toLocaleString()}` : '-',
          `Ksh ${report.totalDue.toLocaleString()}`,
          `Ksh ${report.amountPaid.toLocaleString()}`,
          `Ksh ${report.arrears.toLocaleString()}`,
          report.status,
        ];
      });

      autoTable(pdf, {
        startY: yPosition,
        head: [
          [
            'Period',
            'Invoice #',
            'Issue Date',
            'Date Paid',
            'Rent',
            'Service Charge',
            'VAT',
            'Total Due',
            'Amount Paid',
            'Arrears',
            'Status',
          ],
        ],
        body: rentTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
        },
        bodyStyles: {
          fontSize: 6,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 18, fontSize: 6 },
          1: { cellWidth: 20, fontSize: 6 },
          2: { cellWidth: 16, fontSize: 6 },
          3: { cellWidth: 16, fontSize: 6 },
          4: { cellWidth: 14, fontSize: 6 },
          5: { cellWidth: 14, fontSize: 6 },
          6: { cellWidth: 12, fontSize: 6 },
          7: { cellWidth: 16, fontSize: 6 },
          8: { cellWidth: 16, fontSize: 6 },
          9: { cellWidth: 14, fontSize: 6 },
          10: { cellWidth: 12, fontSize: 6 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: margin, right: margin },
        tableWidth: pageWidth - (margin * 2),
        didDrawPage: function (data: any) {
          if (data.cursor && data.cursor.y > pageHeight - 80) {
            pdf.addPage();
            (this as any).settings.startY = margin;
          }
        },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 10;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No rent payment records found.', margin, yPosition);
      yPosition += 15;
    }

    // === BILL PAYMENT SECTION ===
    const spaceNeededForBillTitle = 30;
    const spaceNeededForBillTable = billInvoices.length > 0 ? Math.min(billInvoices.length * 8 + 30, 150) : 20;
    const spaceNeededForSummary = 60;
    const totalSpaceNeeded = spaceNeededForBillTitle + spaceNeededForBillTable + spaceNeededForSummary;
    
    if (yPosition + totalSpaceNeeded > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL PAYMENT HISTORY', margin, yPosition);
    yPosition += 8;

    if (billInvoices.length > 0) {
      const billTableData = billInvoices.map((invoice) => [
        invoice.billType,
        invoice.invoiceNumber,
        new Date(invoice.issueDate).toLocaleDateString(),
        invoice.units.toFixed(2),
        `Ksh ${invoice.chargePerUnit.toFixed(2)}`,
        `Ksh ${invoice.totalAmount.toLocaleString()}`,
        invoice.vatAmount ? `Ksh ${invoice.vatAmount.toLocaleString()}` : '-',
        `Ksh ${invoice.grandTotal.toLocaleString()}`,
        `Ksh ${invoice.amountPaid.toLocaleString()}`,
        `Ksh ${invoice.balance.toLocaleString()}`,
        invoice.status,
      ]);

      autoTable(pdf, {
        startY: yPosition,
        head: [
          [
            'Type',
            'Invoice #',
            'Date',
            'Units',
            'Rate',
            'Amount',
            'VAT',
            'Total',
            'Paid',
            'Balance',
            'Status',
          ],
        ],
        body: billTableData,
        theme: 'striped',
        headStyles: {
          fillColor: [220, 53, 69],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7,
        },
        bodyStyles: {
          fontSize: 6,
          cellPadding: 2,
        },
        columnStyles: {
          0: { cellWidth: 14, fontSize: 6 },
          1: { cellWidth: 18, fontSize: 6 },
          2: { cellWidth: 14, fontSize: 6 },
          3: { cellWidth: 10, fontSize: 6 },
          4: { cellWidth: 12, fontSize: 6 },
          5: { cellWidth: 14, fontSize: 6 },
          6: { cellWidth: 10, fontSize: 6 },
          7: { cellWidth: 14, fontSize: 6 },
          8: { cellWidth: 14, fontSize: 6 },
          9: { cellWidth: 14, fontSize: 6 },
          10: { cellWidth: 12, fontSize: 6 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: margin, right: margin },
        tableWidth: pageWidth - (margin * 2),
        pageBreak: 'avoid',
        didDrawPage: function (data: any) {
          if (data.cursor && data.cursor.y > pageHeight - 100) {
            pdf.addPage();
            (this as any).settings.startY = margin;
          }
        },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 10;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No bill payment records found.', margin, yPosition);
      yPosition += 15;
    }

    // === COMPREHENSIVE SUMMARY ===
    if (yPosition + 60 > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPREHENSIVE SUMMARY', margin, yPosition);
    yPosition += 8;

    // Calculate totals using consolidated data
    const rentSummary = consolidatePaymentReports(paymentReports);
    const billSummary = consolidateBillInvoices(billInvoices);

    const rentTotal = rentSummary.consolidatedTotalDue;
    const rentPaid = rentSummary.totalPaidAll;
    const rentArrears = rentSummary.consolidatedArrears;

    const billsTotal = billSummary.grandTotal;
    const billsPaid = billSummary.totalPaid;
    const billsBalance = billSummary.totalBalance;

    const overallTotal = rentTotal + billsTotal;
    const overallPaid = rentPaid + billsPaid;
    const overallBalance = rentArrears + billsBalance;

    const summaryData = [
      ['RENT', `Ksh ${rentTotal.toLocaleString()}`, `Ksh ${rentPaid.toLocaleString()}`, `Ksh ${rentArrears.toLocaleString()}`],
      ['BILLS', `Ksh ${billsTotal.toLocaleString()}`, `Ksh ${billsPaid.toLocaleString()}`, `Ksh ${billsBalance.toLocaleString()}`],
      ['OVERALL', `Ksh ${overallTotal.toLocaleString()}`, `Ksh ${overallPaid.toLocaleString()}`, `Ksh ${overallBalance.toLocaleString()}`]
    ];

    autoTable(pdf, {
      startY: yPosition,
      head: [
        ['CATEGORY', 'TOTAL DUE', 'TOTAL PAID', 'BALANCE'],
      ],
      body: summaryData,
      theme: 'striped',
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: 4,
      },
      columnStyles: {
        0: { cellWidth: 30, fontStyle: 'bold' },
        1: { cellWidth: 40 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245],
      },
      didDrawCell: function (data: any) {
        if (data.column.index === 1 && data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [41, 128, 185];
          data.cell.styles.textColor = 255;
        } else if (data.column.index === 2 && data.row.index === 2) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [0, 128, 0];
        } else if (data.column.index === 3 && data.row.index === 2) {
          const cellText = getCellText(data.cell);
          const balanceValue = extractNumericValue(cellText);
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = balanceValue > 0 ? [255, 0, 0] : [0, 128, 0];
        }
      },
      margin: { top: yPosition, left: margin, right: margin },
      tableWidth: pageWidth - (margin * 2),
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 20;

    // === ADD FOOTER ===
    const addFooter = (currentPdf: jsPDF) => {
      const currentPage = currentPdf.internal.pages.length;
      currentPdf.setPage(currentPage);
      
      const footerY = pageHeight - 20;
      currentPdf.setDrawColor(200, 200, 200);
      currentPdf.line(margin, footerY - 25, pageWidth - margin, footerY - 25);
      
      currentPdf.setFontSize(9);
      currentPdf.setFont('helvetica', 'normal');
      currentPdf.text(
        `Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`,
        pageWidth / 2,
        footerY - 15,
        { align: 'center' }
      );
      currentPdf.text(
        companyInfo.website,
        pageWidth / 2,
        footerY - 10,
        { align: 'center' }
      );
      currentPdf.setFontSize(8);
      currentPdf.text(
        `© ${new Date().getFullYear()} ${companyInfo.name}`,
        pageWidth / 2,
        footerY - 5,
        { align: 'center' }
      );
    };

    addFooter(pdf);
    
    const fileName = `Comprehensive_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating comprehensive report PDF:', error);
    throw new Error(`Failed to generate comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};