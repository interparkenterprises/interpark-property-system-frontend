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

// Existing payment report PDF generation
export const generatePaymentReportPDF = async (
  tenant: Tenant,
  paymentReports: PaymentReport[]
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  try {
    // Add company header as text instead of image to avoid loading issues
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(companyInfo.name, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 7;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    pdf.text(companyInfo.website, pageWidth / 2, yPosition, { align: 'center' });
    
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
    pdf.rect(15, yPosition, pageWidth - 30, 45, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', 20, yPosition + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let infoY = yPosition + 15;
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', 20, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.fullName, 50, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', 20, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.contact || 'N/A', 50, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Unit:', 20, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.unit?.type || 'N/A', 50, infoY);
    
    infoY += 7;
    pdf.setFont('helvetica', 'bold');
    pdf.text('Monthly Rent:', 20, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Ksh ${tenant.rent.toLocaleString()}`, 50, infoY);

    if (tenant.KRAPin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRA PIN:', pageWidth / 2 + 10, yPosition + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tenant.KRAPin, pageWidth / 2 + 35, yPosition + 15);
    }

    yPosition += 55;

    // Payment History Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PAYMENT HISTORY', 20, yPosition);
    yPosition += 8;

    // Payment Reports Table
    if (paymentReports.length > 0) {
      const tableData = paymentReports.map((report) => [
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
        margin: { top: yPosition },
      });

      // Calculate totals
      const totalRent = paymentReports.reduce((sum, r) => sum + r.rent, 0);
      const totalServiceCharge = paymentReports.reduce((sum, r) => sum + (r.serviceCharge || 0), 0);
      const totalVAT = paymentReports.reduce((sum, r) => sum + (r.vat || 0), 0);
      const totalDue = paymentReports.reduce((sum, r) => sum + r.totalDue, 0);
      const totalPaid = paymentReports.reduce((sum, r) => sum + r.amountPaid, 0);
      const totalArrears = paymentReports.reduce((sum, r) => sum + r.arrears, 0);

      const finalY = (pdf as any).lastAutoTable.finalY + 10;

      // Summary Box
      pdf.setFillColor(240, 240, 240);
      pdf.rect(pageWidth - 85, finalY, 70, 50, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY', pageWidth - 80, finalY + 8);
      
      pdf.setFontSize(9);
      let summaryY = finalY + 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Rent:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalRent.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.text('Total Service Charge:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalServiceCharge.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.text('Total VAT:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalVAT.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Due:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalDue.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setTextColor(0, 128, 0);
      pdf.text('Total Paid:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalPaid.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setTextColor(255, 0, 0);
      pdf.text('Total Arrears:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalArrears.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      pdf.setTextColor(0, 0, 0);

      yPosition = finalY + 60;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No payment records found.', 20, yPosition);
      yPosition += 20;
    }

    // Add footer with company info
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

// NEW: Bill Invoice Report PDF Generation - Optimized for single page
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

    // Tenant Information Box - more compact
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 30, 'F');
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', margin + 5, yPosition + 7);
    
    pdf.setFontSize(9);
    let infoY = yPosition + 13;
    
    // Left column
    pdf.setFont('helvetica', 'bold');
    pdf.text('Name:', margin + 5, infoY);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.fullName, margin + 20, infoY);
    
    pdf.setFont('helvetica', 'bold');
    pdf.text('Contact:', margin + 5, infoY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(tenant.contact || 'N/A', margin + 25, infoY + 6);
    
    // Right column
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

    // Calculate available space for table before footer
    const footerHeight = 40;
    const availableHeight = pageHeight - yPosition - footerHeight;
    
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

      // Create the main table
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
        // Prevent table from overlapping footer
        didDrawPage: function (data: any) {
          // Check if we're getting too close to footer
          if (data.cursor && data.cursor.y > pageHeight - footerHeight - 20) {
            // Add page if needed
            pdf.addPage();
            (this as any).settings.startY = margin;
          }
        },
      });

      const finalY = (pdf as any).lastAutoTable.finalY + 5;
      
      // Calculate totals
      const totalUnits = billInvoices.reduce((sum, inv) => sum + inv.units, 0);
      const totalAmount = billInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalVAT = billInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
      const grandTotal = billInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalPaid = billInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalBalance = billInvoices.reduce((sum, inv) => sum + inv.balance, 0);

      // Create compact summary RIGHT AFTER the table (not on separate pages)
      const summaryY = Math.max(finalY, margin);
      
      // Ensure summary doesn't overlap footer
      if (summaryY < pageHeight - footerHeight - 30) {
        // Create a simple summary table integrated with the main table
        const summaryRows = [
          ['Total Units:', totalUnits.toFixed(2), '', ''],
          ['Total Amount:', `Ksh ${totalAmount.toLocaleString()}`, 'Total VAT:', `Ksh ${totalVAT.toLocaleString()}`],
          ['Grand Total:', `Ksh ${grandTotal.toLocaleString()}`, 'Total Paid:', `Ksh ${totalPaid.toLocaleString()}`],
          ['', '', 'Total Balance:', `Ksh ${totalBalance.toLocaleString()}`]
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
          // Color coding
          didParseCell: function (data: any) {
            if (data.section === 'body') {
              // Total Paid
              if (data.row.index === 2 && data.column.index === 3) {
                data.cell.styles.textColor = [0, 128, 0]; // Green
              }
              // Total Balance
              if (data.row.index === 3 && data.column.index === 3) {
                data.cell.styles.textColor = [255, 0, 0]; // Red
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

    // Add detailed footer with company contact info
    const footerY = pageHeight - 30;
    
    // Footer separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
    
    // Company contact information in footer
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    
    // Contact info line
    pdf.text(
      `Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`,
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
    
    // Website line
    pdf.text(
      companyInfo.website,
      pageWidth / 2,
      footerY + 5,
      { align: 'center' }
    );
    
    // Copyright line
    pdf.setFontSize(7);
    pdf.text(
      `© ${new Date().getFullYear()} ${companyInfo.name}`,
      pageWidth / 2,
      footerY + 10,
      { align: 'center' }
    );
    
    // Save the PDF
    const fileName = `Bill_Payment_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating bill payment report PDF:', error);
    throw new Error(`Failed to generate bill payment report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};


// NEW: Comprehensive Report PDF Generation (Rent + Bills Combined)
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
    // Add company header (name only now)
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

    // Tenant Information Box - more compact
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - (margin * 2), 40, 'F');
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('TENANT INFORMATION', margin + 5, yPosition + 8);
    
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    let infoY = yPosition + 15;
    
    // Two-column layout for tenant info
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
          // Check if we need to add page
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
    // Check if we have enough space for bill section title + at least some rows
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
        // Keep bill table on same page if possible
        pageBreak: 'avoid',
        didDrawPage: function (data: any) {
          // Only add page if absolutely necessary (table is very long)
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
    // Ensure summary is on same page as bill table
    if (yPosition + 60 > pageHeight - 40) {
      pdf.addPage();
      yPosition = margin;
    }
    
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPREHENSIVE SUMMARY', margin, yPosition);
    yPosition += 8;

    // Calculate totals
    const rentTotal = paymentReports.reduce((sum, r) => sum + r.totalDue, 0);
    const rentPaid = paymentReports.reduce((sum, r) => sum + r.amountPaid, 0);
    const rentArrears = paymentReports.reduce((sum, r) => sum + r.arrears, 0);

    const billsTotal = billInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const billsPaid = billInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const billsBalance = billInvoices.reduce((sum, inv) => sum + inv.balance, 0);

    const overallTotal = rentTotal + billsTotal;
    const overallPaid = rentPaid + billsPaid;
    const overallBalance = rentArrears + billsBalance;

    const summaryData = [
      ['RENT', `Ksh ${rentTotal.toLocaleString()}`, `Ksh ${rentPaid.toLocaleString()}`, `Ksh ${rentArrears.toLocaleString()}`],
      ['BILLS', `Ksh ${billsTotal.toLocaleString()}`, `Ksh ${billsPaid.toLocaleString()}`, `Ksh ${billsBalance.toLocaleString()}`],
      ['OVERALL', `Ksh ${overallTotal.toLocaleString()}`, `Ksh ${overallPaid.toLocaleString()}`, `Ksh ${overallBalance.toLocaleString()}`]
    ];

    const didDrawCell = (data: any) => {
      if (data.column.index === 1 && data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [41, 128, 185];
        data.cell.styles.textColor = 255;
      } else if (data.column.index === 2 && data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [0, 128, 0];
      } else if (data.column.index === 3 && data.row.index === 2) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = [255, 0, 0];
      }
    };

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
      didDrawCell: didDrawCell,
      margin: { top: yPosition, left: margin, right: margin },
      tableWidth: pageWidth - (margin * 2),
    });

    yPosition = (pdf as any).lastAutoTable.finalY + 20;

    // === ADD FOOTER ONLY ON LAST PAGE ===
    const addFooter = (currentPdf: jsPDF) => {
      const currentPage = currentPdf.internal.pages.length;
      
      // Set to last page
      currentPdf.setPage(currentPage);
      
      const footerY = pageHeight - 20;
      
      // Footer separator line
      currentPdf.setDrawColor(200, 200, 200);
      currentPdf.line(margin, footerY - 25, pageWidth - margin, footerY - 25);
      
      // Company contact information in footer
      currentPdf.setFontSize(9);
      currentPdf.setFont('helvetica', 'normal');
      
      // Contact info line
      currentPdf.text(
        `Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`,
        pageWidth / 2,
        footerY - 15,
        { align: 'center' }
      );
      
      // Website line
      currentPdf.text(
        companyInfo.website,
        pageWidth / 2,
        footerY - 10,
        { align: 'center' }
      );
      
      // Copyright line
      currentPdf.setFontSize(8);
      currentPdf.text(
        `© ${new Date().getFullYear()} ${companyInfo.name}`,
        pageWidth / 2,
        footerY - 5,
        { align: 'center' }
      );
    };

    // Add footer only to last page
    addFooter(pdf);
    
    // Save the PDF
    const fileName = `Comprehensive_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating comprehensive report PDF:', error);
    throw new Error(`Failed to generate comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};