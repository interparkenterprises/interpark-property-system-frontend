import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Property, ArrearsResponse } from '@/types';

/**
 * Export Arrears Report to PDF
 * @param property - Property data
 * @param arrearsData - Arrears data response
 * @returns Promise<void>
 */
export async function exportArrearsToPDF(
  property: Property,
  arrearsData: ArrearsResponse
): Promise<void> {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add letterhead (top)
  try {
    const topLetterheadUrl = 'https://www.genspark.ai/api/files/s/a8WiMPx8';
    const response = await fetch(topLetterheadUrl);
    if (response.ok) {
      const blob = await response.blob();
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onloadend = () => {
          const base64data = reader.result as string;
          doc.addImage(base64data, 'PNG', 10, 10, pageWidth - 20, 25);
          resolve(null);
        };
        reader.readAsDataURL(blob);
      });
    }
  } catch (error) {
    console.error('Error loading letterhead:', error);
    // Fallback text header
    doc.setFontSize(16);
    doc.setTextColor(0, 102, 178);
    doc.text('INTERPARK ENTERPRISES LIMITED', pageWidth / 2, 20, { align: 'center' });
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 178);
  doc.text('ARREARS REPORT', pageWidth / 2, 45, { align: 'center' });

  // Property Info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Property: ${property.name}`, 14, 55);
  doc.text(
    `Date Generated: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    14,
    62
  );

  // Table data with numbering
  const tableData = arrearsData.arrears.map((item, index) => [
    (index + 1).toString(), // Numbering 1, 2, 3, etc.
    item.tenantName,
    item.unitType,
    item.unitNo,
    item.floor,
    item.invoiceNumber,
    item.invoiceType === 'RENT' ? 'Rent' : `Bill (${item.billType})`,
    `Ksh ${item.expectedAmount.toLocaleString()}`,
    `Ksh ${item.paidAmount.toLocaleString()}`,
    `Ksh ${item.balance.toLocaleString()}`,
    item.status === 'UNPAID' ? 'Unpaid' : 'Partial',
  ]);

  // Calculate totals for footer
  const totalExpected = arrearsData.summary.totalExpected;
  const totalPaid = arrearsData.summary.totalPaid;
  const totalArrears = arrearsData.summary.totalArrears;

  // Generate table using autoTable WITHOUT footer
  autoTable(doc, {
    startY: 70,
    head: [
      [
        '#',
        'Tenant Name',
        'Unit Type',
        'Unit No',
        'Floor',
        'Invoice No',
        'Type',
        'Expected',
        'Paid',
        'Balance',
        'Status',
      ],
    ],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 102, 178],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [249, 249, 249],
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 35 },
      2: { cellWidth: 25 },
      3: { cellWidth: 20 },
      4: { cellWidth: 15 },
      5: { cellWidth: 30 },
      6: { cellWidth: 30, halign: 'center' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 25, halign: 'right' },
      9: { cellWidth: 25, halign: 'right', fontStyle: 'bold', textColor: [220, 53, 69] },
      10: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
    styles: { overflow: 'linebreak' },
  });

  // Get the final Y position of the table
  const finalY = (doc as any).lastAutoTable?.finalY ?? 70;

  // Add spacing after table
  const totalsSectionY = finalY + 5;

  // Draw separator line above totals
  const lineStartX = 14;
  const lineEndX = pageWidth - 14;
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.line(lineStartX, totalsSectionY, lineEndX, totalsSectionY);

  // Add custom totals section (without table cells)
  const totalsY = totalsSectionY + 8;
  
  // Calculate positions based on the table column positions
  const totalLabelX = 14 + 15 + 35 + 25 + 20 + 15 + 30; // Sum of previous column widths
  const expectedX = totalLabelX + 30; // After "Type" column
  const paidX = expectedX + 25; // After "Expected" column
  const balanceX = paidX + 25; // After "Paid" column

  // Set font style for totals
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);

  // Draw "Total" label
  doc.text('Total', totalLabelX + 15, totalsY, { align: 'center' });

  // Draw total expected amount (right-aligned)
  doc.text(`Ksh ${totalExpected.toLocaleString()}`, expectedX + 23, totalsY, { align: 'right' });

  // Draw total paid amount (right-aligned)
  doc.text(`Ksh ${totalPaid.toLocaleString()}`, paidX + 23, totalsY, { align: 'right' });

  // Draw total balance/arrears (right-aligned, in red)
  doc.setTextColor(220, 53, 69); // Red color for balance
  doc.text(`Ksh ${totalArrears.toLocaleString()}`, balanceX + 23, totalsY, { align: 'right' });

  // Add footer to all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Check if content is too close to the bottom
    const contentBottomY = i === pageCount ? totalsY + 10 : finalY;
    const minFooterY = pageHeight - 20; // Minimum position for footer
    
    // If content is close to footer area, add a new page
    if (i === pageCount && contentBottomY > minFooterY - 10) {
      doc.addPage();
      doc.setPage(doc.getNumberOfPages());
    }
    
    // Use 10pt for footer company name, 8pt for page number
    doc.setFontSize(10);
    doc.setTextColor(0, 102, 178); // Blue color for company name
    doc.setFont('helvetica', 'bold');
    doc.text('INTERPARK ENTERPRISES LIMITED', pageWidth / 2, pageHeight - 15, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0); // Black color for page number
    doc.setFont('helvetica', 'normal');
    doc.text(`Page ${i}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Generate filename
  const filename = `${property.name.replace(/\s+/g, '_')}_Arrears_Report_${
    new Date().toISOString().split('T')[0]
  }.pdf`;

  // Save the PDF
  doc.save(filename);
}
