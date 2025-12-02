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

// NEW: Bill Invoice Report PDF Generation
export const generateBillInvoiceReportPDF = async (
  tenant: Tenant,
  billInvoices: BillInvoice[]
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;

  try {
    // Add company header
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
    pdf.text('BILL PAYMENT REPORT', pageWidth / 2, yPosition, { align: 'center' });
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
    
    if (tenant.KRAPin) {
      pdf.setFont('helvetica', 'bold');
      pdf.text('KRA PIN:', pageWidth / 2 + 10, yPosition + 15);
      pdf.setFont('helvetica', 'normal');
      pdf.text(tenant.KRAPin, pageWidth / 2 + 35, yPosition + 15);
    }

    yPosition += 55;

    // Bill Payment History Title
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL PAYMENT HISTORY', 20, yPosition);
    yPosition += 8;

    // Bill Invoices Table
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
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 15 },
          1: { cellWidth: 18 },
          2: { cellWidth: 16 },
          3: { cellWidth: 16 },
          4: { cellWidth: 12 },
          5: { cellWidth: 14 },
          6: { cellWidth: 16 },
          7: { cellWidth: 12 },
          8: { cellWidth: 16 },
          9: { cellWidth: 16 },
          10: { cellWidth: 16 },
          11: { cellWidth: 14 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: 10, right: 10 },
      });

      // Calculate totals
      const totalUnits = billInvoices.reduce((sum, inv) => sum + inv.units, 0);
      const totalAmount = billInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
      const totalVAT = billInvoices.reduce((sum, inv) => sum + (inv.vatAmount || 0), 0);
      const grandTotal = billInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const totalPaid = billInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
      const totalBalance = billInvoices.reduce((sum, inv) => sum + inv.balance, 0);

      const finalY = (pdf as any).lastAutoTable.finalY + 10;

      // Summary Box
      pdf.setFillColor(240, 240, 240);
      pdf.rect(pageWidth - 85, finalY, 70, 55, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SUMMARY', pageWidth - 80, finalY + 8);
      
      pdf.setFontSize(9);
      let summaryY = finalY + 15;
      
      pdf.setFont('helvetica', 'normal');
      pdf.text('Total Units:', pageWidth - 80, summaryY);
      pdf.text(totalUnits.toFixed(2), pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.text('Total Amount:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalAmount.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.text('Total VAT:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalVAT.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Grand Total:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${grandTotal.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setTextColor(0, 128, 0);
      pdf.text('Total Paid:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalPaid.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      summaryY += 6;
      pdf.setTextColor(255, 0, 0);
      pdf.text('Total Balance:', pageWidth - 80, summaryY);
      pdf.text(`Ksh ${totalBalance.toLocaleString()}`, pageWidth - 25, summaryY, { align: 'right' });
      
      pdf.setTextColor(0, 0, 0);

      yPosition = finalY + 65;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No bill payment records found.', 20, yPosition);
      yPosition += 20;
    }

    // Add footer with company info
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`© ${new Date().getFullYear()} ${companyInfo.name}`, pageWidth / 2, footerY, { align: 'center' });
    
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
  let yPosition = 20;

  try {
    // Add company header
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

    // === RENT PAYMENT SECTION (Integrated with Invoice References) ===
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RENT PAYMENT HISTORY', 20, yPosition);
    yPosition += 8;

    if (paymentReports.length > 0) {
      // Create a combined dataset that includes invoice information
      const rentTableData = paymentReports.map((report) => {
        // Find corresponding invoice if available
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
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 22 },
          2: { cellWidth: 18 },
          3: { cellWidth: 18 },
          4: { cellWidth: 16 },
          5: { cellWidth: 16 },
          6: { cellWidth: 14 },
          7: { cellWidth: 18 },
          8: { cellWidth: 18 },
          9: { cellWidth: 16 },
          10: { cellWidth: 14 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No rent payment records found.', 20, yPosition);
      yPosition += 15;
    }

    // Check if we need a new page for bills
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = 20;
    }

    // === BILL PAYMENT SECTION ===
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BILL PAYMENT HISTORY', 20, yPosition);
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
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
        },
        columnStyles: {
          0: { cellWidth: 16 },
          1: { cellWidth: 20 },
          2: { cellWidth: 16 },
          3: { cellWidth: 12 },
          4: { cellWidth: 14 },
          5: { cellWidth: 16 },
          6: { cellWidth: 12 },
          7: { cellWidth: 16 },
          8: { cellWidth: 16 },
          9: { cellWidth: 16 },
          10: { cellWidth: 14 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        margin: { top: yPosition, left: 10, right: 10 },
      });

      yPosition = (pdf as any).lastAutoTable.finalY + 15;
    } else {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'italic');
      pdf.text('No bill payment records found.', 20, yPosition);
      yPosition += 15;
    }

    // Check if we need a new page for summary
    if (yPosition > pageHeight - 100) {
      pdf.addPage();
      yPosition = 20;
    }

    // === COMPREHENSIVE SUMMARY ===
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('COMPREHENSIVE SUMMARY', 20, yPosition);
    yPosition += 10;

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

    // Summary Box
    pdf.setFillColor(240, 240, 240);
    pdf.rect(15, yPosition, pageWidth - 30, 70, 'F');
    
    yPosition += 10;
    pdf.setFontSize(10);
    
    // Rent Summary
    pdf.setFont('helvetica', 'bold');
    pdf.text('Rent Summary:', 20, yPosition);
    yPosition += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Rent Due: Ksh ${rentTotal.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    pdf.text(`Total Rent Paid: Ksh ${rentPaid.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    pdf.setTextColor(255, 0, 0);
    pdf.text(`Total Rent Arrears: Ksh ${rentArrears.toLocaleString()}`, 30, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    // Bills Summary
    pdf.setFont('helvetica', 'bold');
    pdf.text('Bills Summary:', 20, yPosition);
    yPosition += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.text(`Total Bills Due: Ksh ${billsTotal.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    pdf.text(`Total Bills Paid: Ksh ${billsPaid.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    pdf.setTextColor(255, 0, 0);
    pdf.text(`Total Bills Balance: Ksh ${billsBalance.toLocaleString()}`, 30, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 10;

    // Overall Summary
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Overall Summary:', 20, yPosition);
    yPosition += 7;
    pdf.setFontSize(10);
    pdf.text(`Grand Total Due: Ksh ${overallTotal.toLocaleString()}`, 30, yPosition);
    yPosition += 6;
    pdf.setTextColor(0, 128, 0);
    pdf.text(`Grand Total Paid: Ksh ${overallPaid.toLocaleString()}`, 30, yPosition);
    pdf.setTextColor(0, 0, 0);
    yPosition += 6;
    pdf.setTextColor(255, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`Grand Total Balance: Ksh ${overallBalance.toLocaleString()}`, 30, yPosition);
    pdf.setTextColor(0, 0, 0);

    // Add footer with company info
    const footerY = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`© ${new Date().getFullYear()} ${companyInfo.name}`, pageWidth / 2, footerY, { align: 'center' });
    
    // Save the PDF
    const fileName = `Comprehensive_Report_${tenant.fullName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error('Error generating comprehensive report PDF:', error);
    throw new Error(`Failed to generate comprehensive report: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};